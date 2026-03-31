import { Module } from '@nestjs/common';
import { LlmModule } from '../llm/llm.module';
import { SubmissionsModule } from '../submissions/submissions.module';
import { EvaluationsController } from './evaluations.controller';
import { EvaluationsService } from './evaluations.service';
import { EvaluationsRepository } from './evaluations.repository';

/**
 * 평가 모듈
 * LlmModule(AI 평가)과 SubmissionsModule(답안 조회/상태 변경)을 import한다.
 * EvaluationsController, EvaluationsService, EvaluationsRepository를 등록한다.
 */
@Module({
  imports: [LlmModule, SubmissionsModule],
  controllers: [EvaluationsController],
  providers: [EvaluationsService, EvaluationsRepository],
  exports: [EvaluationsService],
})
export class EvaluationsModule {}
