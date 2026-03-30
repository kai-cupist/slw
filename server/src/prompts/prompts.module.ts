import { Module } from '@nestjs/common';
import { PromptsController } from './prompts.controller';
import { PromptsService } from './prompts.service';
import { PromptsRepository } from './prompts.repository';

/**
 * 쓰기 주제 모듈
 * PromptsController, PromptsService, PromptsRepository를 등록한다.
 * PromptsService를 export하여 다른 모듈(예: SubmissionsModule)에서
 * 주제 존재 확인 등에 사용할 수 있게 한다.
 */
@Module({
  controllers: [PromptsController],
  providers: [PromptsService, PromptsRepository],
  exports: [PromptsService],
})
export class PromptsModule {}
