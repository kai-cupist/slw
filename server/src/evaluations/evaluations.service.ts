import {
  BadRequestException,
  BadGatewayException,
  GatewayTimeoutException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { LlmService } from '../llm/llm.service';
import {
  SubmissionsRepository,
  SubmissionWithPrompt,
} from '../submissions/submissions.repository';
import { Evaluation, EvaluationsRepository } from './evaluations.repository';

/**
 * 평가 서비스
 * 답안 평가의 오케스트레이션을 담당한다:
 * 1. 답안 조회 + submitted 상태 검증
 * 2. 중복 평가 방지 (이미 evaluated면 기존 결과 반환)
 * 3. LLM 평가 호출 (트랜잭션 밖)
 * 4. DB 저장 + 상태 전환 (트랜잭션 안)
 */
@Injectable()
export class EvaluationsService {
  private readonly logger = new Logger(EvaluationsService.name);

  constructor(
    private readonly evaluationsRepository: EvaluationsRepository,
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly llmService: LlmService,
    private readonly databaseService: DatabaseService,
  ) {}

  /**
   * 답안을 평가한다.
   *
   * 흐름:
   * 1. 답안 조회 (소유권 + 삭제 여부 검증)
   * 2. 상태 검증: submitted만 평가 가능
   * 3. 중복 평가 확인: 이미 evaluated면 기존 결과 반환
   * 4. LLM 호출 (트랜잭션 밖 — 외부 API 호출은 롤백 불가)
   * 5. 트랜잭션: evaluations INSERT + submissions UPDATE('evaluated')
   *
   * @param submissionId - 답안 ID
   * @param userId - 사용자 ID
   * @returns 평가 결과
   * @throws NotFoundException 답안이 존재하지 않는 경우
   * @throws BadRequestException draft 상태 답안인 경우
   * @throws BadGatewayException LLM 호출/파싱 실패
   * @throws GatewayTimeoutException LLM 타임아웃
   */
  async evaluate(submissionId: number, userId: string): Promise<Evaluation> {
    // 1. 답안 조회 (주제 정보 포함)
    const submission =
      await this.submissionsRepository.findOneDetailByIdAndUser(
        submissionId,
        userId,
      );

    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }

    // 2. 상태 검증
    if (submission.status === 'draft') {
      throw new BadRequestException(
        '제출되지 않은 답안은 평가할 수 없습니다. 먼저 제출해주세요.',
      );
    }

    // 3. 이미 평가된 경우 기존 결과 반환
    if (submission.status === 'evaluated') {
      const existing =
        await this.evaluationsRepository.findBySubmissionId(submissionId);
      if (existing) {
        this.logger.log(
          `이미 평가된 답안 반환 — submissionId: ${submissionId}`,
        );
        return existing;
      }
    }

    // 4. LLM 호출 (트랜잭션 밖에서 실행)
    const llmResponse = await this.callLlm(submission);
    const { result, rawResponse } = llmResponse;

    // 5. 트랜잭션: evaluations INSERT + submissions status UPDATE
    const evaluation = await this.databaseService.withTransaction(
      async (client) => {
        // 5a. 평가 결과 저장
        const saved = await this.evaluationsRepository.create(
          {
            submissionId,
            grammarScore: result.grammar_score,
            logicScore: result.logic_score,
            expressionScore: result.expression_score,
            relevanceScore: result.relevance_score,
            totalScore: result.total_score,
            feedback: result.feedback,
            rawResponse,
          },
          client,
        );

        // 5b. 답안 상태를 evaluated로 변경
        await client.query(
          `UPDATE submissions SET status = $1, updated_at = NOW() WHERE id = $2`,
          ['evaluated', submissionId],
        );

        return saved;
      },
    );

    this.logger.log(
      `평가 완료 — submissionId: ${submissionId}, evaluationId: ${evaluation.id}, totalScore: ${evaluation.total_score}`,
    );

    return evaluation;
  }

  /**
   * 답안의 평가 결과를 조회한다.
   *
   * @param submissionId - 답안 ID
   * @param userId - 사용자 ID
   * @returns 평가 결과
   * @throws NotFoundException 답안 또는 평가 결과가 없는 경우
   */
  async findBySubmissionId(
    submissionId: number,
    userId: string,
  ): Promise<Evaluation> {
    // 답안 소유권 검증
    const submission = await this.submissionsRepository.findOneByIdAndUser(
      submissionId,
      userId,
    );
    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }

    const evaluation =
      await this.evaluationsRepository.findBySubmissionId(submissionId);
    if (!evaluation) {
      throw new NotFoundException('평가 결과가 없습니다');
    }

    return evaluation;
  }

  /**
   * LLM 평가를 호출한다.
   * LlmService의 에러를 적절한 HTTP 에러로 변환한다.
   *
   * @param submission - 주제 정보가 포함된 답안
   * @returns LLM 평가 결과 + 원본 응답
   * @throws BadGatewayException LLM 호출/파싱 실패
   * @throws GatewayTimeoutException LLM 타임아웃
   */
  private async callLlm(
    submission: SubmissionWithPrompt,
  ): Promise<Awaited<ReturnType<LlmService['evaluate']>>> {
    try {
      return await this.llmService.evaluate(
        submission.prompt_title,
        submission.prompt_category,
        submission.content,
      );
    } catch (error) {
      const message =
        error instanceof Error ? error.message : '알 수 없는 오류';

      // 타임아웃 에러 판별
      if (
        message.includes('timeout') ||
        message.includes('Timeout') ||
        message.includes('ETIMEDOUT')
      ) {
        this.logger.error(`LLM 타임아웃 — submissionId: ${submission.id}`);
        throw new GatewayTimeoutException(
          'AI 평가 서버 응답 시간이 초과되었습니다. 잠시 후 다시 시도해주세요.',
        );
      }

      this.logger.error(
        `LLM 호출 실패 — submissionId: ${submission.id}, error: ${message}`,
      );
      throw new BadGatewayException(`AI 평가에 실패했습니다: ${message}`);
    }
  }
}
