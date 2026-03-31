---
id: S01
parent: M001
milestone: M001
provides:
  - Docker Compose 개발 환경 (PostgreSQL 16 + NestJS)
  - @Global() DatabaseModule (pg Pool 기반 Raw SQL)
  - DatabaseService (query, queryOne, withTransaction)
  - 수동 SQL 마이그레이션 시스템 (MigrationService)
  - API Envelope 응답 패턴 (ResponseInterceptor + HttpExceptionFilter)
  - 전역 ValidationPipe (DTO 유효성 검증)
  - Swagger UI (/api-docs)
  - GET /health 헬스체크 엔드포인트
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - server/src/database/database.module.ts
  - server/src/database/database.service.ts
  - server/src/database/database.constants.ts
  - server/src/migration/migration.service.ts
  - server/src/migration/run-migrations.ts
  - server/src/common/interceptors/response.interceptor.ts
  - server/src/common/filters/http-exception.filter.ts
  - server/src/common/interfaces/api-response.interface.ts
  - server/src/main.ts
  - server/src/app.module.ts
  - server/src/app.controller.ts
  - docker-compose.yml
  - Dockerfile
  - .env.example
  - migrations/000_create_schema_migrations.sql
key_decisions:
  - pg Pool을 @Global() 커스텀 프로바이더로 등록 (DATABASE_POOL 토큰) — 모든 모듈에서 import 없이 DatabaseService 주입 가능
  - connectionTimeoutMillis: 5000ms — Docker Compose에서 DB 컨테이너 준비 전 연결 시도 방지
  - withTransaction에서 finally 블록의 client.release() 필수 — 커넥션 풀 누수 방지
  - onModuleDestroy에서 pool.end() — graceful shutdown 보장
  - 마이그레이션 디렉토리 fallback (process.cwd()/migrations → process.cwd()/../migrations) — 로컬/Docker 환경 모두 지원
  - HttpExceptionFilter에서 ValidationPipe 에러의 message 배열을 details 필드로 변환
  - Swagger UI를 /api-docs 경로에 설정
patterns_established:
  - @Global() DatabaseModule로 pg Pool 전역 제공 — 후속 모듈에서 import 없이 DatabaseService 주입
  - API Envelope 패턴 — 성공: { success: true, data }, 에러: { success: false, error: { code, message, details? } }
  - 수동 SQL 마이그레이션 — migrations/ 디렉토리에 번호순 SQL 파일, schema_migrations 테이블로 이력 추적
  - 전역 ValidationPipe — whitelist + forbidNonWhitelisted + transform으로 DTO 유효성 자동 검증
observability_surfaces:
  - GET /health — DB 연결 상태 확인 (SELECT 1)
  - Swagger UI /api-docs — API 문서화 및 테스트
drill_down_paths:
  - .gsd/milestones/M001/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S01/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T03:09:04.248Z
blocker_discovered: false
---

# S01: Infra Setup

**Docker Compose로 PostgreSQL 16 + NestJS 개발 환경을 구성하고, pg Pool 기반 @Global() DatabaseModule + 수동 SQL 마이그레이션 시스템 + API Envelope 응답 패턴 + ValidationPipe + Swagger UI를 갖춘 인프라 기반을 확립했다.**

## What Happened

S01은 두 개의 태스크로 구성되었다.

**T01: NestJS + Docker Compose + DatabaseModule** — NestJS 프로젝트를 server/ 디렉토리에 생성하고, Docker Compose로 PostgreSQL 16-alpine + NestJS 앱을 `docker compose up` 한 번으로 실행 가능한 환경을 구성했다. 핵심은 @Global() DatabaseModule로, pg Pool을 커스텀 프로바이더(DATABASE_POOL 토큰)로 등록하고 DatabaseService(query/queryOne/withTransaction)를 전역 제공한다. GET /health 엔드포인트로 DB 연결 상태를 확인할 수 있다. ConfigModule.forRoot({ isGlobal: true })로 환경 변수를 어디서든 주입 가능하게 설정했다.

**T02: 마이그레이션 시스템 + API 공통 레이어** — MigrationService로 migrations/ 폴더의 SQL 파일을 번호순 실행하고 schema_migrations 테이블에 이력을 기록하는 수동 마이그레이션 시스템을 구축했다. API 공통 레이어로는 ResponseInterceptor(성공 응답 { success: true, data }), HttpExceptionFilter(에러 응답 { success: false, error }), 전역 ValidationPipe(whitelist, forbidNonWhitelisted, transform), Swagger UI(/api-docs)를 설정했다. Docker 환경에서 마이그레이션 실행 시 migrations/ 폴더가 마운트되지 않는 문제를 발견하고 볼륨 마운트를 추가하여 해결했다.

두 태스크 모두 계획대로 완료되었고, TypeScript 컴파일 에러 없이 모든 파일이 정상 생성되었다.

## Verification

- TypeScript 컴파일: `npx tsc --noEmit` 에러 없음
- 모든 핵심 파일 존재 확인: database.module.ts, database.service.ts, database.constants.ts, migration.service.ts, migration.module.ts, run-migrations.ts, response.interceptor.ts, http-exception.filter.ts, api-response.interface.ts, docker-compose.yml, Dockerfile, .env.example
- T01 자체 검증: Docker Compose 환경에서 GET /health 엔드포인트 응답 확인, DB 연결 성공
- T02 자체 검증: Docker 환경에서 마이그레이션 실행 성공(schema_migrations 테이블 생성), API Envelope 응답 형식 확인, Swagger UI /api-docs 접근 확인

## Requirements Advanced

- INFRA-01 — Docker Compose로 PostgreSQL 16 + NestJS 앱을 docker compose up 한 번으로 실행 가능
- INFRA-02 — MigrationService로 migrations/ 폴더의 SQL 파일을 번호순 실행, schema_migrations에 이력 기록
- INFRA-03 — @Global() DatabaseModule로 pg Pool 기반 query/queryOne/withTransaction 제공
- INFRA-04 — ConfigModule.forRoot({ isGlobal: true })로 .env 파일에서 DB_HOST, DB_PORT 등 환경 변수 관리
- API-01 — ResponseInterceptor + HttpExceptionFilter로 모든 API 응답을 일관된 Envelope 형식으로 통일
- API-03 — 전역 ValidationPipe(whitelist, forbidNonWhitelisted, transform)로 입력 값 유효성 자동 검증

## Requirements Validated

- INFRA-01 — Docker Compose로 PostgreSQL 16 + NestJS 앱 실행 확인, GET /health로 DB 연결 확인
- INFRA-02 — MigrationService가 000_create_schema_migrations.sql 실행 성공, schema_migrations 테이블에 이력 기록 확인
- INFRA-03 — DatabaseService.query('SELECT 1')로 Raw SQL 실행 확인, @Global() 모듈로 전역 주입 동작
- INFRA-04 — .env.example에 DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME 정의, ConfigModule로 주입 동작
- API-01 — 성공 응답 { success: true, data }, 에러 응답 { success: false, error: { code, message } } 형식 확인
- API-03 — ValidationPipe whitelist+forbidNonWhitelisted로 허용되지 않은 필드 자동 거부 확인

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T02에서 Docker 컨테이너에 migrations/ 폴더가 마운트되지 않아 마이그레이션이 실패하는 문제 발견. docker-compose.yml에 `./migrations:/usr/src/migrations` 볼륨 마운트를 추가하여 해결. 범위 확장 없이 인프라 설정 보완.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `server/src/database/database.module.ts` — @Global() 모듈, pg Pool 커스텀 프로바이더 등록
- `server/src/database/database.service.ts` — query, queryOne, withTransaction Raw SQL 래퍼
- `server/src/database/database.constants.ts` — DATABASE_POOL DI 토큰
- `server/src/migration/migration.service.ts` — SQL 파일 번호순 실행, schema_migrations 이력 기록
- `server/src/migration/migration.module.ts` — 마이그레이션 모듈 정의
- `server/src/migration/run-migrations.ts` — 독립 실행 마이그레이션 스크립트
- `server/src/common/interceptors/response.interceptor.ts` — 성공 응답 { success: true, data } Envelope 래핑
- `server/src/common/filters/http-exception.filter.ts` — 에러 응답 { success: false, error } 통일
- `server/src/common/interfaces/api-response.interface.ts` — ApiSuccessResponse, ApiErrorResponse 타입 정의
- `server/src/main.ts` — ValidationPipe, ResponseInterceptor, HttpExceptionFilter, Swagger 전역 설정
- `server/src/app.module.ts` — ConfigModule, DatabaseModule, MigrationModule import
- `server/src/app.controller.ts` — GET /health 헬스체크 엔드포인트
- `docker-compose.yml` — PostgreSQL 16 + NestJS 서비스 + migrations 볼륨 마운트
- `Dockerfile` — node:20-alpine 기반 개발 빌드
- `.env.example` — 환경 변수 템플릿
- `migrations/000_create_schema_migrations.sql` — 마이그레이션 이력 추적 테이블 DDL
