import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MigrationModule } from './migration/migration.module';
import { PromptsModule } from './prompts/prompts.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { LlmModule } from './llm/llm.module';
import { EvaluationsModule } from './evaluations/evaluations.module';
import { AppController } from './app.controller';
import { RequestLoggerMiddleware } from './common/middleware/request-logger.middleware';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MigrationModule,
    PromptsModule,
    SubmissionsModule,
    LlmModule,
    EvaluationsModule,
  ],
  controllers: [AppController],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(RequestLoggerMiddleware).forRoutes('*');
  }
}
