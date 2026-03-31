# S01: Infra Setup

**Goal:** NestJS 프로젝트를 생성하고, Docker Compose로 PostgreSQL + NestJS 개발 환경을 구성하며, DatabaseModule(pg Pool 기반)을 구축한다.
**Demo:** NestJS 프로젝트를 생성하고, Docker Compose로 PostgreSQL + NestJS 개발 환경을 구성하며, DatabaseModule(pg Pool 기반)을 구축한다.

## Must-Haves


## Tasks

- [x] **T01: 01-infra-setup 01** `est:4min`
  - NestJS 프로젝트를 생성하고, Docker Compose로 PostgreSQL + NestJS 개발 환경을 구성하며, DatabaseModule(pg Pool 기반)을 구축한다.

Purpose: 모든 후속 기능 개발의 인프라 기반을 마련한다. docker compose up 한 번으로 DB 연결이 완료된 NestJS 앱이 실행되는 상태를 달성한다.
Output: server/ 디렉토리(NestJS 프로젝트), Docker Compose 설정, DatabaseModule, 환경 변수 관리
- [x] **T02: 01-infra-setup 02** `est:4min`
  - 수동 SQL 마이그레이션 시스템과 API 공통 레이어(Envelope 응답 패턴, 유효성 검증, Swagger)를 구축한다.

Purpose: 마이그레이션으로 DB 스키마를 관리하고, 모든 API가 일관된 형식으로 응답하는 기반을 확립하여 후속 Phase에서 비즈니스 로직 개발에 집중할 수 있게 한다.
Output: migration/ 모듈, common/ 공통 레이어, Swagger UI, 전역 파이프/필터/인터셉터 설정

## Files Likely Touched

- `server/package.json`
- `server/tsconfig.json`
- `server/nest-cli.json`
- `server/src/main.ts`
- `server/src/app.module.ts`
- `server/src/app.controller.ts`
- `server/src/database/database.module.ts`
- `server/src/database/database.service.ts`
- `server/src/database/database.constants.ts`
- `docker-compose.yml`
- `Dockerfile`
- `.env`
- `.env.example`
- `.gitignore`
- `.dockerignore`
- `server/src/migration/migration.module.ts`
- `server/src/migration/migration.service.ts`
- `server/src/migration/run-migrations.ts`
- `server/src/common/interfaces/api-response.interface.ts`
- `server/src/common/interceptors/response.interceptor.ts`
- `server/src/common/filters/http-exception.filter.ts`
- `server/src/main.ts`
- `server/src/app.module.ts`
- `server/package.json`
- `migrations/000_create_schema_migrations.sql`
