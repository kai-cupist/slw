import {
  Controller,
  Get,
  Post,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserIdGuard } from '../common/guards/user-id.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { EvaluationsService } from './evaluations.service';
import { GetEvaluationHistoryDto } from './dto/get-evaluation-history.dto';
import { GetScoreTrendDto } from './dto/get-score-trend.dto';

/**
 * 평가 컨트롤러
 * AI 평가 요청 및 결과 조회 API를 제공한다.
 * 모든 엔드포인트에 UserIdGuard를 적용하여 X-User-Id 헤더를 필수화한다.
 */
@ApiTags('evaluations')
@ApiHeader({
  name: 'X-User-Id',
  description: '사용자 식별 UUID',
  required: true,
  example: '550e8400-e29b-41d4-a716-446655440000',
})
@UseGuards(UserIdGuard)
@Controller()
export class EvaluationsController {
  constructor(private readonly evaluationsService: EvaluationsService) {}

  /**
   * 답안에 대한 AI 평가를 요청한다.
   * submitted 상태의 답안만 평가할 수 있다.
   * 이미 evaluated 상태인 경우 기존 평가 결과를 반환한다.
   */
  @Post('submissions/:id/evaluate')
  @ApiOperation({ summary: '답안 AI 평가 요청' })
  async evaluate(
    @UserId() userId: string,
    @Param('id', ParseIntPipe) id: number,
  ) {
    return this.evaluationsService.evaluate(id, userId);
  }

  /**
   * 사용자의 평가 이력 목록을 조회한다.
   * 주제 정보(제목, 카테고리, 난이도)와 점수를 함께 반환한다.
   * 구체적 경로(/history)를 파라미터 경로(/:submissionId)보다 먼저 선언하여 라우트 충돌을 방지한다.
   */
  @Get('evaluations/history')
  @ApiOperation({ summary: '평가 이력 목록 조회' })
  async getHistory(
    @UserId() userId: string,
    @Query() dto: GetEvaluationHistoryDto,
  ) {
    return this.evaluationsService.getHistory(userId, dto);
  }

  /**
   * 사용자의 점수 추이를 조회한다.
   * 평가일 오름차순으로 점수 데이터를 반환한다.
   */
  @Get('evaluations/scores/trend')
  @ApiOperation({ summary: '점수 추이 조회' })
  async getScoreTrend(
    @UserId() userId: string,
    @Query() dto: GetScoreTrendDto,
  ) {
    return this.evaluationsService.getScoreTrend(userId, dto);
  }

  /**
   * 답안의 평가 결과를 조회한다.
   * 평가가 완료된 답안만 조회할 수 있다.
   * 파라미터 경로는 구체적 경로들 뒤에 선언하여 "history", "scores"가 :submissionId로 매칭되지 않도록 한다.
   */
  @Get('evaluations/:submissionId')
  @ApiOperation({ summary: '평가 결과 조회' })
  async findBySubmissionId(
    @UserId() userId: string,
    @Param('submissionId', ParseIntPipe) submissionId: number,
  ) {
    return this.evaluationsService.findBySubmissionId(submissionId, userId);
  }
}
