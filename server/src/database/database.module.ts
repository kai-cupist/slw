import { Global, Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Pool } from 'pg';
import { DATABASE_POOL } from './database.constants';
import { DatabaseService } from './database.service';

/**
 * 전역 데이터베이스 모듈
 * pg Pool을 커스텀 프로바이더로 등록하고, DatabaseService를 전역으로 제공한다.
 * @Global() 데코레이터로 다른 모듈에서 import 없이 DatabaseService를 주입할 수 있다.
 */
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get<string>('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          user: configService.get<string>('DB_USER'),
          password: configService.get<string>('DB_PASSWORD'),
          database: configService.get<string>('DB_NAME'),
          // 커넥션 풀 설정
          max: 10,
          idleTimeoutMillis: 30000,
          // 연결 타임아웃 필수 설정 (컨테이너 시작 시 DB가 아직 준비 안 될 수 있음)
          connectionTimeoutMillis: 5000,
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}
