import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { DatabaseModule } from './database/database.module';
import { MigrationModule } from './migration/migration.module';
import { PromptsModule } from './prompts/prompts.module';
import { SubmissionsModule } from './submissions/submissions.module';
import { AppController } from './app.controller';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
    }),
    DatabaseModule,
    MigrationModule,
    PromptsModule,
    SubmissionsModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
