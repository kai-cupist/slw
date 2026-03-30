import { Injectable, NotFoundException } from '@nestjs/common';
import { PaginatedResponse } from '../common/interfaces/paginated.interface';
import { GetPromptsDto } from './dto/get-prompts.dto';
import { Prompt, PromptsRepository } from './prompts.repository';

/**
 * 쓰기 주제 서비스
 * PromptsRepository를 주입받아 비즈니스 로직(페이지네이션 계산, 404 처리)을 담당한다.
 */
@Injectable()
export class PromptsService {
  constructor(private readonly promptsRepository: PromptsRepository) {}

  /**
   * 쓰기 주제 목록을 페이지네이션하여 조회한다.
   * @param dto - 필터링 + 페이지네이션 파라미터
   * @returns 페이지네이션된 주제 목록
   */
  async findAll(dto: GetPromptsDto): Promise<PaginatedResponse<Prompt>> {
    const page = dto.page ?? 1;
    const limit = dto.limit ?? 10;
    const offset = (page - 1) * limit;

    const { rows, total } = await this.promptsRepository.findAll(
      { category: dto.category, difficulty: dto.difficulty },
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
   * ID로 쓰기 주제 하나를 조회한다.
   * 존재하지 않으면 NotFoundException을 던진다.
   * @param id - 주제 ID
   * @returns 주제 상세 정보
   */
  async findOne(id: number): Promise<Prompt> {
    const prompt = await this.promptsRepository.findOneById(id);
    if (!prompt) {
      throw new NotFoundException('주제를 찾을 수 없습니다');
    }
    return prompt;
  }
}
