import { Module } from '@nestjs/common';
import { PromptsModule } from '../prompts/prompts.module';
import { SubmissionsController } from './submissions.controller';
import { SubmissionsService } from './submissions.service';
import { SubmissionsRepository } from './submissions.repository';

/**
 * 답안 모듈
 * PromptsModule을 import하여 PromptsService(prompt_id 유효성 검증)를 주입받는다.
 * SubmissionsController, SubmissionsService, SubmissionsRepository를 등록한다.
 */
@Module({
  imports: [PromptsModule],
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
})
export class SubmissionsModule {}
