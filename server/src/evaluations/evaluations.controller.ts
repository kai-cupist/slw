import {
  Controller,
  Get,
  Post,
  Param,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ApiHeader, ApiOperation, ApiTags } from '@nestjs/swagger';
import { UserIdGuard } from '../common/guards/user-id.guard';
import { UserId } from '../common/decorators/user-id.decorator';
import { EvaluationsService } from './evaluations.service';

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
   * 답안의 평가 결과를 조회한다.
   * 평가가 완료된 답안만 조회할 수 있다.
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
