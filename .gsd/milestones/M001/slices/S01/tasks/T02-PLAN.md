# T02: 01-infra-setup 02

**Slice:** S01 — **Milestone:** M001

## Description

수동 SQL 마이그레이션 시스템과 API 공통 레이어(Envelope 응답 패턴, 유효성 검증, Swagger)를 구축한다.

Purpose: 마이그레이션으로 DB 스키마를 관리하고, 모든 API가 일관된 형식으로 응답하는 기반을 확립하여 후속 Phase에서 비즈니스 로직 개발에 집중할 수 있게 한다.
Output: migration/ 모듈, common/ 공통 레이어, Swagger UI, 전역 파이프/필터/인터셉터 설정

## Must-Haves

- [ ] "migrations/ 폴더의 SQL 파일을 순서대로 실행하면 스키마가 생성되고 schema_migrations 테이블에 이력이 기록된다"
- [ ] "API 응답이 성공/에러 모두 Envelope 패턴({ success, data } / { success, error })으로 통일된다"
- [ ] "유효성 검증 실패 시 400 에러로 구체적인 필드별 에러 메시지가 반환된다"
- [ ] "GET /health 응답이 Envelope 패턴으로 감싸져 { success: true, data: { status: 'ok', database: 'connected' } } 형태로 반환된다"

## Files

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
