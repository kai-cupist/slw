import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import * as fs from 'fs';
import * as path from 'path';

/**
 * 수동 SQL 마이그레이션 서비스
 * migrations/ 폴더의 SQL 파일을 번호순으로 읽어 미적용 파일만 순서대로 실행한다.
 * 각 마이그레이션 적용 이력은 schema_migrations 테이블에 기록된다.
 * 롤백은 지원하지 않는다 — 문제 발생 시 새 마이그레이션으로 수정한다.
 */
@Injectable()
export class MigrationService {
  private readonly logger = new Logger(MigrationService.name);

  constructor(private readonly databaseService: DatabaseService) {}

  /**
   * 마이그레이션 디렉토리 경로를 반환한다.
   * 로컬 개발 환경과 Docker 컨테이너 환경 모두를 지원하기 위해
   * 여러 후보 경로 중 실제 존재하는 경로를 반환한다.
   */
  private getMigrationsDir(): string {
    const candidates = [
      path.join(process.cwd(), 'migrations'),
      path.join(process.cwd(), '..', 'migrations'),
    ];
    for (const dir of candidates) {
      if (fs.existsSync(dir)) return dir;
    }
    throw new Error('migrations 디렉토리를 찾을 수 없습니다');
  }

  /**
   * 미적용 마이그레이션을 순서대로 실행한다.
   * 1. schema_migrations 테이블 존재 확인 (없으면 000 파일로 생성)
   * 2. migrations/ 폴더에서 .sql 파일 목록을 읽어 번호순 정렬
   * 3. 이미 적용된 파일명 목록 조회
   * 4. 미적용 파일만 순서대로 실행하고, schema_migrations에 이력 기록
   */
  async runMigrations(): Promise<void> {
    const migrationsDir = this.getMigrationsDir();

    // schema_migrations 테이블 존재 확인 및 생성
    await this.ensureMigrationsTable(migrationsDir);

    // .sql 파일 목록을 읽어 번호순 정렬
    const sqlFiles = fs
      .readdirSync(migrationsDir)
      .filter((file) => file.endsWith('.sql'))
      .sort();

    // 이미 적용된 마이그레이션 파일명 목록 조회
    const applied = await this.databaseService.query<{ filename: string }>(
      'SELECT filename FROM schema_migrations',
    );
    const appliedSet = new Set(applied.map((row) => row.filename));

    // 미적용 파일만 순서대로 실행
    for (const file of sqlFiles) {
      if (appliedSet.has(file)) {
        continue;
      }

      const filePath = path.join(migrationsDir, file);
      const sql = fs.readFileSync(filePath, 'utf-8');

      // 마이그레이션 SQL 실행
      await this.databaseService.query(sql);

      // 적용 이력 기록
      await this.databaseService.query(
        'INSERT INTO schema_migrations (filename) VALUES ($1)',
        [file],
      );

      this.logger.log(`적용: ${file}`);
    }
  }

  /**
   * schema_migrations 테이블이 존재하는지 확인하고, 없으면 생성한다.
   * 000_create_schema_migrations.sql 파일의 내용을 직접 실행한다.
   */
  private async ensureMigrationsTable(migrationsDir: string): Promise<void> {
    const result = await this.databaseService.queryOne<{ exists: boolean }>(
      `SELECT EXISTS (
        SELECT FROM information_schema.tables
        WHERE table_name = 'schema_migrations'
      )`,
    );

    if (!result?.exists) {
      const initFile = path.join(
        migrationsDir,
        '000_create_schema_migrations.sql',
      );
      if (!fs.existsSync(initFile)) {
        throw new Error(
          'schema_migrations 테이블이 없고, 000_create_schema_migrations.sql 파일도 찾을 수 없습니다',
        );
      }
      const sql = fs.readFileSync(initFile, 'utf-8');
      await this.databaseService.query(sql);
      this.logger.log('schema_migrations 테이블 생성 완료');
    }
  }
}
