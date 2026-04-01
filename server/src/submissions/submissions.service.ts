import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PaginatedResponse } from '../common/interfaces/paginated.interface';
import { PromptsService } from '../prompts/prompts.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { GetSubmissionsDto } from './dto/get-submissions.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import {
  Submission,
  SubmissionWithPrompt,
  SubmissionsRepository,
} from './submissions.repository';

/**
 * 답안 서비스
 * SubmissionsRepository를 주입받아 비즈니스 로직을 담당한다.
 * - 상태 전환 규칙 (draft -> submitted 단방향)
 * - 소유권 검증 (userId 기반)
 * - prompt_id 유효성 검증
 */
@Injectable()
export class SubmissionsService {
  constructor(
    private readonly submissionsRepository: SubmissionsRepository,
    private readonly promptsService: PromptsService,
  ) {}

  /**
   * 새 답안을 생성한다 (임시저장).
   * prompt_id가 유효한지 확인한 후 생성한다.
   * 이미 해당 prompt에 대한 draft가 존재하면 새로 생성하지 않고 기존 draft를 반환한다.
   *
   * @param userId - 사용자 ID (X-User-Id 헤더)
   * @param dto - 생성 DTO (prompt_id 필수, content 선택)
   * @returns 생성된 답안 (또는 기존 draft)
   * @throws BadRequestException 유효하지 않은 prompt_id인 경우
   */
  async create(userId: string, dto: CreateSubmissionDto): Promise<Submission> {
    // prompt_id가 유효한지 확인 (존재하지 않으면 NotFoundException이 발생)
    try {
      await this.promptsService.findOne(dto.prompt_id);
    } catch {
      throw new BadRequestException('유효하지 않은 주제입니다');
    }

    // 이미 draft가 존재하면 중복 생성 방지 — 기존 draft 반환
    const existingDraft =
      await this.submissionsRepository.findDraftByUserAndPrompt(
        userId,
        dto.prompt_id,
      );
    if (existingDraft) {
      return existingDraft;
    }

    return this.submissionsRepository.create(
      userId,
      dto.prompt_id,
      dto.content ?? '',
    );
  }

  /**
   * 답안 내용을 수정한다 (이어쓰기).
   * draft 상태인 답안만 수정할 수 있다.
   *
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @param dto - 수정 DTO (content 필수)
   * @returns 수정된 답안
   * @throws NotFoundException 답안이 존재하지 않는 경우
   * @throws BadRequestException 이미 제출된 답안인 경우
   */
  async update(
    id: number,
    userId: string,
    dto: UpdateSubmissionDto,
  ): Promise<Submission> {
    const submission = await this.submissionsRepository.findOneByIdAndUser(
      id,
      userId,
    );
    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }

    if (submission.status !== 'draft') {
      throw new BadRequestException('이미 제출된 답안은 수정할 수 없습니다');
    }

    return this.submissionsRepository.updateContent(id, dto.content);
  }

  /**
   * 답안을 최종 제출한다 (draft -> submitted).
   * draft 상태이고 내용이 있는 답안만 제출할 수 있다.
   *
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @returns 제출된 답안
   * @throws NotFoundException 답안이 존재하지 않는 경우
   * @throws BadRequestException 이미 제출된 답안이거나 내용이 비어있는 경우
   */
  async submit(id: number, userId: string): Promise<Submission> {
    const submission = await this.submissionsRepository.findOneByIdAndUser(
      id,
      userId,
    );
    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }

    if (submission.status !== 'draft') {
      throw new BadRequestException('이미 제출된 답안입니다');
    }

    if (!submission.content || submission.content.trim() === '') {
      throw new BadRequestException(
        '내용이 비어있는 답안은 제출할 수 없습니다',
      );
    }

    return this.submissionsRepository.updateStatus(id, 'submitted');
  }

  /**
   * 답안을 삭제한다 (soft delete).
   *
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @throws NotFoundException 답안이 존재하지 않는 경우
   */
  async remove(id: number, userId: string): Promise<void> {
    const submission = await this.submissionsRepository.findOneByIdAndUser(
      id,
      userId,
    );
    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }

    await this.submissionsRepository.softDelete(id);
  }

  /**
   * 사용자의 답안 목록을 페이지네이션하여 조회한다.
   *
   * @param userId - 사용자 ID
   * @param dto - 조회 DTO (페이지네이션 + status 필터)
   * @returns 페이지네이션된 답안 목록 (주제 정보 포함)
   */
  async findAll(
    userId: string,
    dto: GetSubmissionsDto,
  ): Promise<PaginatedResponse<SubmissionWithPrompt>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const offset = (page - 1) * limit;

    const { rows, total } = await this.submissionsRepository.findAllByUser(
      userId,
      { status: dto.status, promptId: dto.promptId },
      offset,
      limit,
    );

    return {
      items: rows,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * 답안 상세 정보를 조회한다.
   * 주제 정보(title, category, difficulty)가 포함된다.
   *
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @returns 주제 정보가 포함된 답안 상세
   * @throws NotFoundException 답안이 존재하지 않는 경우
   */
  async findOne(id: number, userId: string): Promise<SubmissionWithPrompt> {
    const submission =
      await this.submissionsRepository.findOneDetailByIdAndUser(id, userId);
    if (!submission) {
      throw new NotFoundException('답안을 찾을 수 없습니다');
    }
    return submission;
  }
}
