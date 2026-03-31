import {
  Injectable,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import Groq from 'groq-sdk';

/**
 * AI 평가 결과 인터페이스
 * LLM이 반환하는 JSON 응답의 구조를 정의한다.
 */
export interface EvaluationResult {
  /** 문법 점수 (1~10) */
  grammar_score: number;
  /** 논리 점수 (1~10) */
  logic_score: number;
  /** 표현력 점수 (1~10) */
  expression_score: number;
  /** 주제 적절성 점수 (1~10) */
  relevance_score: number;
  /** 총점 (4항목 평균, 소수점 1자리) */
  total_score: number;
  /** 항목별 상세 피드백 */
  feedback: {
    grammar: string;
    logic: string;
    expression: string;
    relevance: string;
    overall: string;
  };
}

/**
 * LLM 서비스
 * Groq SDK를 래핑하여 한국어 쓰기 평가 기능을 제공한다.
 *
 * 핵심 동작:
 * - response_format: { type: 'json_object' }로 구조화된 JSON 응답을 요청
 * - 프롬프트 내에 JSON 스키마를 명시하여 응답 형식을 유도
 * - 응답 파싱 후 4항목 점수(1~10 범위) + 피드백 필드 존재를 수동 검증
 * - groq-sdk 내장 재시도(429/5xx 자동 2회) + JSON 파싱 실패 시 1회 재시도
 */
@Injectable()
export class LlmService {
  private readonly logger = new Logger(LlmService.name);
  private readonly client: Groq;
  private readonly model: string;

  constructor(private readonly configService: ConfigService) {
    const apiKey = this.configService.get<string>('GROQ_API_KEY');
    if (!apiKey) {
      throw new Error(
        'GROQ_API_KEY 환경변수가 설정되지 않았습니다. .env 파일을 확인하세요.',
      );
    }

    this.client = new Groq({
      apiKey,
      maxRetries: 2, // 429/5xx 자동 재시도 2회
    });

    this.model =
      this.configService.get<string>('LLM_MODEL') ??
      'llama-3.3-70b-versatile';

    this.logger.log(`LLM 서비스 초기화 완료 (모델: ${this.model})`);
  }

  /**
   * 한국어 쓰기 답안을 평가한다.
   *
   * @param promptTitle - 주제 제목
   * @param promptCategory - 주제 카테고리 (일상, 사회 등)
   * @param content - 평가할 답안 텍스트
   * @returns 구조화된 평가 결과 (4항목 점수 + 피드백)
   * @throws InternalServerErrorException LLM 호출 또는 응답 파싱 실패 시
   */
  async evaluate(
    promptTitle: string,
    promptCategory: string,
    content: string,
  ): Promise<{ result: EvaluationResult; rawResponse: Record<string, unknown> }> {
    const systemPrompt = this.buildSystemPrompt();
    const userPrompt = this.buildUserPrompt(promptTitle, promptCategory, content);

    // JSON 파싱 실패 시 1회 재시도 (총 최대 2회 시도)
    let lastError: Error | null = null;

    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        const completion = await this.client.chat.completions.create({
          model: this.model,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3, // 평가의 일관성을 위해 낮은 temperature
        });

        const messageContent = completion.choices[0]?.message?.content;
        if (!messageContent) {
          throw new Error('LLM 응답에 content가 없습니다');
        }

        const parsed = JSON.parse(messageContent) as Record<string, unknown>;
        const result = this.validateAndExtract(parsed);

        this.logger.log(
          `평가 완료 — 총점: ${result.total_score}, 모델: ${completion.model}, ` +
          `토큰: ${completion.usage?.total_tokens ?? 'N/A'}`,
        );

        return { result, rawResponse: parsed };
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));

        if (attempt === 0 && this.isRetryableParseError(lastError)) {
          this.logger.warn(
            `JSON 파싱/검증 실패, 1회 재시도합니다: ${lastError.message}`,
          );
          continue;
        }

        // groq-sdk의 API 에러는 재시도하지 않음 (SDK 자체 재시도에 맡김)
        break;
      }
    }

    this.logger.error(`LLM 평가 실패: ${lastError?.message}`);
    throw new InternalServerErrorException(
      `AI 평가에 실패했습니다: ${lastError?.message ?? '알 수 없는 오류'}`,
    );
  }

  /**
   * 시스템 프롬프트를 생성한다.
   * 평가 기준과 JSON 응답 스키마를 명시한다.
   */
  private buildSystemPrompt(): string {
    return `당신은 한국어 쓰기 평가 전문가입니다. 사용자가 제출한 글을 아래 4가지 기준으로 평가하세요.

## 평가 기준
1. **grammar** (문법): 맞춤법, 띄어쓰기, 문법 오류
2. **logic** (논리): 글의 구조, 논리적 흐름, 일관성
3. **expression** (표현력): 어휘 다양성, 문장 표현의 풍부함
4. **relevance** (주제 적절성): 주어진 주제에 대한 적절성, 주제 벗어남 여부

## 점수 기준
- 각 항목 1~10점 (정수)
- 1~3: 부족, 4~5: 보통, 6~7: 양호, 8~9: 우수, 10: 탁월

## 응답 형식
반드시 다음 JSON 형식으로 응답하세요:
{
  "grammar_score": <1~10 정수>,
  "logic_score": <1~10 정수>,
  "expression_score": <1~10 정수>,
  "relevance_score": <1~10 정수>,
  "total_score": <4항목 평균, 소수점 1자리>,
  "feedback": {
    "grammar": "<문법 평가 피드백>",
    "logic": "<논리 평가 피드백>",
    "expression": "<표현력 평가 피드백>",
    "relevance": "<주제 적절성 평가 피드백>",
    "overall": "<종합 평가 피드백>"
  }
}`;
  }

  /**
   * 사용자 프롬프트를 생성한다.
   * 주제 정보와 답안 내용을 포함한다.
   */
  private buildUserPrompt(
    promptTitle: string,
    promptCategory: string,
    content: string,
  ): string {
    return `## 주제 정보
- 제목: ${promptTitle}
- 카테고리: ${promptCategory}

## 평가할 글
${content}`;
  }

  /**
   * LLM 응답을 파싱·검증하여 EvaluationResult를 추출한다.
   * 4항목 점수가 1~10 범위의 정수인지, 피드백 필드가 존재하는지 확인한다.
   *
   * @throws Error 필수 필드 누락 또는 값 범위 초과 시
   */
  private validateAndExtract(
    parsed: Record<string, unknown>,
  ): EvaluationResult {
    // 점수 필드 검증
    const scoreFields = [
      'grammar_score',
      'logic_score',
      'expression_score',
      'relevance_score',
    ] as const;

    for (const field of scoreFields) {
      const value = parsed[field];
      if (typeof value !== 'number' || !Number.isInteger(value)) {
        throw new Error(`${field} 필드가 정수가 아닙니다: ${value}`);
      }
      if (value < 1 || value > 10) {
        throw new Error(`${field} 값이 범위(1~10)를 벗어났습니다: ${value}`);
      }
    }

    // total_score 검증 (LLM이 계산한 값)
    const totalScore = parsed.total_score;
    if (typeof totalScore !== 'number') {
      throw new Error(`total_score 필드가 숫자가 아닙니다: ${totalScore}`);
    }

    // total_score를 직접 계산하여 LLM 계산 오류 보정
    const calculatedTotal =
      Math.round(
        ((parsed.grammar_score as number) +
          (parsed.logic_score as number) +
          (parsed.expression_score as number) +
          (parsed.relevance_score as number)) /
          4 *
          10,
      ) / 10;

    // 피드백 검증
    const feedback = parsed.feedback;
    if (!feedback || typeof feedback !== 'object') {
      throw new Error('feedback 필드가 없거나 객체가 아닙니다');
    }

    const feedbackObj = feedback as Record<string, unknown>;
    const feedbackFields = [
      'grammar',
      'logic',
      'expression',
      'relevance',
      'overall',
    ];

    for (const field of feedbackFields) {
      if (typeof feedbackObj[field] !== 'string' || !feedbackObj[field]) {
        throw new Error(`feedback.${field} 필드가 비어있거나 문자열이 아닙니다`);
      }
    }

    return {
      grammar_score: parsed.grammar_score as number,
      logic_score: parsed.logic_score as number,
      expression_score: parsed.expression_score as number,
      relevance_score: parsed.relevance_score as number,
      total_score: calculatedTotal,
      feedback: {
        grammar: feedbackObj.grammar as string,
        logic: feedbackObj.logic as string,
        expression: feedbackObj.expression as string,
        relevance: feedbackObj.relevance as string,
        overall: feedbackObj.overall as string,
      },
    };
  }

  /**
   * JSON 파싱/검증 실패인지 판단한다.
   * API 에러(네트워크, 인증 등)는 재시도하지 않는다 — SDK 자체 재시도에 맡긴다.
   */
  private isRetryableParseError(error: Error): boolean {
    // groq-sdk의 API 에러 클래스는 재시도 대상이 아님
    if (error.constructor.name.includes('APIError')) {
      return false;
    }
    // SyntaxError (JSON.parse 실패) 또는 검증 에러는 재시도 대상
    return (
      error instanceof SyntaxError ||
      error.message.includes('필드') ||
      error.message.includes('content가 없습니다')
    );
  }
}
