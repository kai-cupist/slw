import { NestFactory } from '@nestjs/core';
import { AppModule } from '../app.module';
import { MigrationService } from './migration.service';

/**
 * 마이그레이션 독립 실행 스크립트
 * NestJS 앱 컨텍스트를 생성하여 MigrationService를 통해 마이그레이션을 실행한다.
 * 사용법: npm run migration:run
 */
async function bootstrap() {
  const app = await NestFactory.createApplicationContext(AppModule);
  const migrationService = app.get(MigrationService);
  try {
    await migrationService.runMigrations();
    console.log('[Migration] 마이그레이션 완료');
  } catch (error) {
    console.error('[Migration] 마이그레이션 실패:', error);
    process.exit(1);
  } finally {
    await app.close();
  }
}
void bootstrap();
