import { Module } from '@nestjs/common';
import { MigrationService } from './migration.service';

/**
 * 마이그레이션 모듈
 * MigrationService를 제공하고 외부에 export한다.
 */
@Module({
  providers: [MigrationService],
  exports: [MigrationService],
})
export class MigrationModule {}
