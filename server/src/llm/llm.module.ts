import { Module } from '@nestjs/common';
import { LlmService } from './llm.service';

/**
 * LLM 모듈
 * Groq SDK를 래핑하는 LlmService를 제공한다.
 * ConfigModule은 AppModule에서 isGlobal: true로 설정되어 별도 import 불필요.
 */
@Module({
  providers: [LlmService],
  exports: [LlmService],
})
export class LlmModule {}
