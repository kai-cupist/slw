import { Controller, Get, Param, ParseIntPipe, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { PromptsService } from './prompts.service';
import { GetPromptsDto } from './dto/get-prompts.dto';

/**
 * 쓰기 주제 컨트롤러
 * GET /prompts (목록, 필터링, 페이지네이션)와 GET /prompts/:id (상세) 엔드포인트를 제공한다.
 * 주제는 공개 데이터이므로 X-User-Id 가드를 적용하지 않는다.
 * ResponseInterceptor가 자동으로 { success: true, data: ... } 래핑하므로 순수 데이터만 반환한다.
 */
@ApiTags('prompts')
@Controller('prompts')
export class PromptsController {
  constructor(private readonly promptsService: PromptsService) {}

  /**
   * 쓰기 주제 목록을 조회한다.
   * category, difficulty로 필터링하고, page/limit로 페이지네이션한다.
   */
  @Get()
  @ApiOperation({ summary: '쓰기 주제 목록 조회 (필터링/페이지네이션)' })
  async findAll(@Query() dto: GetPromptsDto) {
    return this.promptsService.findAll(dto);
  }

  /**
   * ID로 쓰기 주제 상세 정보를 조회한다.
   * 존재하지 않는 ID이면 404 에러를 반환한다.
   */
  @Get(':id')
  @ApiOperation({ summary: '쓰기 주제 상세 조회' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.promptsService.findOne(id);
  }
}
