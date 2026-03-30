---
phase: 01-infra-setup
plan: 02
subsystem: infra
tags: [nestjs, postgresql, migration, swagger, envelope-pattern, validation]

requires:
  - phase: 01-infra-setup/01
    provides: "Docker Compose 환경, DatabaseModule, DatabaseService, AppController(health)"
provides:
  - "수동 SQL 마이그레이션 시스템 (MigrationService, run-migrations.ts)"
  - "API Envelope 응답 패턴 (ResponseInterceptor, HttpExceptionFilter)"
  - "전역 ValidationPipe (whitelist, forbidNonWhitelisted, transform)"
  - "Swagger UI (/api-docs)"
affects: [02-core-api, 03-ai-integration]

tech-stack:
  added: []
  patterns:
    - "수동 SQL 마이그레이션: migrations/ 폴더의 NNN_*.sql 파일을 번호순 실행, schema_migrations 추적"
    - "Envelope 응답 패턴: 성공 { success: true, data }, 에러 { success: false, error: { code, message, details? } }"
    - "전역 파이프/인터셉터/필터: main.ts에서 useGlobalPipes/useGlobalInterceptors/useGlobalFilters 설정"

key-files:
  created:
    - migrations/000_create_schema_migrations.sql
    - server/src/migration/migration.service.ts
    - server/src/migration/migration.module.ts
    - server/src/migration/run-migrations.ts
    - server/src/common/interfaces/api-response.interface.ts
    - server/src/common/interceptors/response.interceptor.ts
    - server/src/common/filters/http-exception.filter.ts
  modified:
    - server/src/app.module.ts
    - server/src/main.ts
    - server/package.json
    - docker-compose.yml

key-decisions:
  - "마이그레이션 디렉토리 fallback 로직으로 로컬/Docker 환경 모두 지원"
  - "HttpExceptionFilter에서 ValidationPipe 에러의 message 배열을 details 필드로 변환"
  - "Swagger UI를 /api-docs 경로에 설정"

patterns-established:
  - "마이그레이션 패턴: migrations/ 폴더에 NNN_description.sql 형식, schema_migrations 테이블로 이력 추적"
  - "API 응답 패턴: 모든 응답이 Envelope({ success, data/error })로 통일"
  - "전역 설정 패턴: main.ts에서 ValidationPipe, ResponseInterceptor, HttpExceptionFilter를 전역 등록"

requirements-completed: [INFRA-02, API-01, API-03]

duration: 4min
completed: 2026-03-30
---

# Phase 1 Plan 2: 마이그레이션 시스템 및 API 공통 레이어 Summary

**수동 SQL 마이그레이션 시스템과 Envelope 응답 패턴 + ValidationPipe + Swagger UI를 포함한 API 공통 레이어 구축**

## Performance

- **Duration:** 4min
- **Started:** 2026-03-30T11:18:34Z
- **Completed:** 2026-03-30T11:22:57Z
- **Tasks:** 3
- **Files modified:** 11

## Accomplishments
- MigrationService로 migrations/ 폴더의 SQL 파일을 번호순 실행하고 schema_migrations에 이력 기록
- ResponseInterceptor로 성공 응답을 { success: true, data } 형식으로, HttpExceptionFilter로 에러 응답을 { success: false, error } 형식으로 통일
- ValidationPipe 전역 설정으로 DTO 유효성 검증 자동화 (whitelist, forbidNonWhitelisted, transform)
- Swagger UI를 /api-docs 경로에서 접근 가능하도록 설정
- Docker 환경에서 마이그레이션 실행 및 API 응답 형식 통합 검증 완료

## Task Commits

각 태스크를 원자적으로 커밋:

1. **Task 1: 수동 SQL 마이그레이션 시스템 구축** - `1746974` (feat)
2. **Task 2: API 공통 레이어 구축** - `f40eb34` (feat)
3. **Task 3: 전체 통합 검증** - `a4a9b12` (fix - migrations 볼륨 마운트 추가)

## Files Created/Modified
- `migrations/000_create_schema_migrations.sql` - 마이그레이션 이력 추적 테이블 DDL
- `server/src/migration/migration.service.ts` - 마이그레이션 러너 (SQL 파일 순서대로 실행, 이력 기록)
- `server/src/migration/migration.module.ts` - 마이그레이션 모듈
- `server/src/migration/run-migrations.ts` - 독립 실행 마이그레이션 스크립트
- `server/src/common/interfaces/api-response.interface.ts` - ApiSuccessResponse, ApiErrorResponse 타입 정의
- `server/src/common/interceptors/response.interceptor.ts` - 성공 응답 Envelope 래핑
- `server/src/common/filters/http-exception.filter.ts` - 에러 응답 Envelope 통일
- `server/src/app.module.ts` - MigrationModule import 추가
- `server/src/main.ts` - ValidationPipe, ResponseInterceptor, HttpExceptionFilter, Swagger 전역 설정
- `server/package.json` - migration:run 스크립트 추가
- `docker-compose.yml` - migrations/ 볼륨 마운트 추가

## Decisions Made
- 마이그레이션 디렉토리 경로를 process.cwd()/migrations와 process.cwd()/../migrations 두 후보로 fallback 처리하여 로컬과 Docker 환경 모두 지원
- HttpExceptionFilter에서 ValidationPipe 에러의 message 배열을 details 필드로 변환하여 필드별 에러 메시지 제공
- Swagger UI는 /api-docs 경로에 설정

## Deviations from Plan

### Auto-fixed Issues

**1. [Rule 3 - Blocking] Docker 컨테이너에서 migrations/ 폴더 접근 불가**
- **Found during:** Task 3 (전체 통합 검증)
- **Issue:** docker-compose.yml에서 server/ 폴더만 마운트하고 있어 컨테이너 내에서 migrations/ 폴더에 접근할 수 없음
- **Fix:** api 서비스에 `./migrations:/usr/src/migrations` 볼륨 마운트 추가
- **Files modified:** docker-compose.yml
- **Verification:** docker compose exec api npm run migration:run 성공
- **Committed in:** a4a9b12

---

**Total deviations:** 1 auto-fixed (1 blocking)
**Impact on plan:** 마이그레이션 실행에 필수적인 볼륨 마운트 추가. 범위 확장 없음.

## Issues Encountered
- Docker credential helper(docker-credential-desktop) PATH 문제로 docker compose up 시 에러 발생. /Applications/Docker.app/Contents/Resources/bin을 PATH에 추가하여 해결 (로컬 환경 문제, 코드 변경 없음).

## User Setup Required

None - 외부 서비스 설정이 필요하지 않음.

## Known Stubs

None - 모든 기능이 완전히 구현됨.

## Next Phase Readiness
- 마이그레이션 시스템이 동작하므로 Phase 2에서 비즈니스 테이블(prompts, submissions, evaluations) DDL 작성 가능
- API Envelope 패턴이 확립되어 모든 후속 API 엔드포인트가 일관된 응답 형식 사용 가능
- ValidationPipe로 DTO 유효성 검증이 자동화되어 후속 API 개발에 즉시 활용 가능
- Swagger UI가 설정되어 API 문서화 및 테스트 환경 준비 완료

## Self-Check: PASSED

- 모든 생성 파일 8개: FOUND
- 모든 커밋 해시 3개: FOUND

---
*Phase: 01-infra-setup*
*Completed: 2026-03-30*
