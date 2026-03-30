import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  Query,
  ParseIntPipe,
  UseGuards,
  HttpCode,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserIdGuard } from '../common/guards/user-id.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { SubmissionsService } from './submissions.service';
import { CreateSubmissionDto } from './dto/create-submission.dto';
import { UpdateSubmissionDto } from './dto/update-submission.dto';
import { GetSubmissionsDto } from './dto/get-submissions.dto';

/**
 * 답안 컨트롤러
 * 6개 submissions API 엔드포인트를 제공한다.
 * 모든 엔드포인트에 UserIdGuard를 적용하여 X-User-Id 헤더를 필수화한다.
 */
@ApiTags('submissions')
@ApiHeader({
  name: 'X-User-Id',
  description: '사용자 식별 UUID',
  required: true,
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@UseGuards(UserIdGuard)
@Controller('submissions')
export class SubmissionsController {
  constructor(private readonly submissionsService: SubmissionsService) {}

  /**
   * 답안을 생성한다 (임시저장).
   * prompt_id는 필수이며, content는 선택(빈 문자열 가능)이다.
   */
  @Post()
  @ApiOperation({ summary: '답안 생성 (임시저장)' })
  async create(@UserId() userId: string, @Body() dto: CreateSubmissionDto) {
    return this.submissionsService.create(userId, dto);
  }

  /**
   * 답안 내용을 수정한다 (이어쓰기).
   * draft 상태인 답안만 수정할 수 있다.
   */
  @Patch(':id')
  @ApiOperation({ summary: '답안 수정 (이어쓰기)' })
  async update(
    @UserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateSubmissionDto,
  ) {
    return this.submissionsService.update(id, userId, dto);
  }

  /**
   * 답안을 최종 제출한다 (draft -> submitted).
   * draft 상태이고 내용이 있는 답안만 제출할 수 있다.
   */
  @Patch(':id/submit')
  @ApiOperation({ summary: '답안 최종 제출 (draft -> submitted)' })
  async submit(
    @UserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.submissionsService.submit(id, userId);
  }

  /**
   * 답안을 삭제한다 (soft delete).
   * 삭제된 답안은 목록/상세 조회에서 사라진다.
   */
  @Delete(':id')
  @HttpCode(200)
  @ApiOperation({ summary: '답안 삭제 (soft delete)' })
  async remove(
    @UserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.submissionsService.remove(id, userId);
    return { deleted: true };
  }

  /**
   * 사용자의 답안 목록을 페이지네이션하여 조회한다.
   * status 필터를 지원한다 (?status=draft 또는 ?status=submitted).
   */
  @Get()
  @ApiOperation({ summary: '답안 목록 조회 (페이지네이션)' })
  async findAll(@UserId() userId: string, @Query() dto: GetSubmissionsDto) {
    return this.submissionsService.findAll(userId, dto);
  }

  /**
   * 답안 상세 정보를 조회한다.
   * 주제 정보(title, category, difficulty)가 포함된다.
   */
  @Get(':id')
  @ApiOperation({ summary: '답안 상세 조회' })
  async findOne(
    @UserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.submissionsService.findOne(id, userId);
  }
}
