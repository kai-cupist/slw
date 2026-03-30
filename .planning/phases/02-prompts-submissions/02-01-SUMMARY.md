---
phase: 02-prompts-submissions
plan: 01
subsystem: database
tags: [postgresql, raw-sql, migration, seed-data, nestjs-guard, pagination, dto]

requires:
  - phase: 01-infra-setup
    provides: DatabaseService(query/queryOne/withTransaction), MigrationService, schema_migrations 테이블

provides:
  - prompts 테이블 (카테고리/난이도 CHECK constraint, 인덱스)
  - submissions 테이블 (FK, status CHECK, soft delete, partial index)
  - 30개 시드 데이터 (5 카테고리 x 3 난이도 x 2)
  - UserIdGuard (X-User-Id 헤더 검증)
  - UserId 파라미터 데코레이터
  - PaginationDto (page/limit 쿼리 파라미터 검증)
  - PaginatedResponse 인터페이스

affects: [02-02, 02-03, 03-evaluation]

tech-stack:
  added: []
  patterns:
    - "CHECK constraint로 ENUM 대신 문자열 제약 (마이그레이션 변경 용이)"
    - "Partial index로 soft delete된 행 제외 (WHERE deleted_at IS NULL)"
    - "Custom Guard + createParamDecorator 조합으로 헤더 기반 사용자 식별"

key-files:
  created:
    - migrations/001_create_prompts.sql
    - migrations/002_create_submissions.sql
    - migrations/003_seed_prompts.sql
    - server/src/common/guards/user-id.guard.ts
    - server/src/common/decorators/user-id.decorator.ts
    - server/src/common/dto/pagination.dto.ts
    - server/src/common/interfaces/paginated.interface.ts
  modified: []

key-decisions:
  - "VARCHAR + CHECK constraint 사용 (PostgreSQL ENUM 대신) - 마이그레이션 시 값 추가/변경이 용이"
  - "Partial index로 deleted_at IS NULL 조건 적용 - 삭제된 행은 인덱스에서 제외하여 성능 최적화"
  - "UserIdGuard는 전역이 아닌 컨트롤러 단위 적용 - prompts는 공개 데이터이므로 가드 불필요"

patterns-established:
  - "마이그레이션 순서: 테이블 생성 → 참조 테이블 생성 → 시드 데이터"
  - "Soft delete: deleted_at TIMESTAMP 컬럼 + 조회 시 WHERE deleted_at IS NULL"
  - "페이지네이션: PaginationDto(page/limit) + PaginatedResponse(items/total/page/limit/totalPages)"

requirements-completed: [PROMPT-03, PROMPT-04]

duration: 3min
completed: 2026-03-30
---

# Phase 2 Plan 1: DB 스키마 및 공통 인프라 Summary

**prompts/submissions 테이블을 CHECK constraint + partial index로 생성하고, X-User-Id 가드와 페이지네이션 DTO를 공통 인프라로 구축**

## Performance

- **Duration:** 3분
- **Started:** 2026-03-30T13:54:52Z
- **Completed:** 2026-03-30T13:58:04Z
- **Tasks:** 2
- **Files modified:** 7

## Accomplishments

- prompts 테이블(category/difficulty CHECK) + submissions 테이블(FK, status CHECK, soft delete) 생성
- 30개 시드 데이터(5개 카테고리 x 3단계 난이도 x 2) 마이그레이션으로 삽입
- UserIdGuard와 UserId 데코레이터로 X-User-Id 헤더 기반 사용자 식별 패턴 확립
- PaginationDto와 PaginatedResponse로 목록 API 공통 인프라 구축

## Task Commits

각 태스크를 원자적으로 커밋:

1. **Task 1: DB 마이그레이션 SQL 작성** - `da7523c` (feat)
2. **Task 2: 공통 인프라 코드** - `f497336` (feat)

## Files Created/Modified

- `migrations/001_create_prompts.sql` - prompts 테이블 DDL + 인덱스
- `migrations/002_create_submissions.sql` - submissions 테이블 DDL + FK + partial index
- `migrations/003_seed_prompts.sql` - 30개 시드 데이터 INSERT
- `server/src/common/guards/user-id.guard.ts` - X-User-Id 헤더 검증 가드
- `server/src/common/decorators/user-id.decorator.ts` - X-User-Id 값 추출 데코레이터
- `server/src/common/dto/pagination.dto.ts` - 페이지네이션 쿼리 DTO (page/limit)
- `server/src/common/interfaces/paginated.interface.ts` - 페이지네이션 응답 인터페이스

## Decisions Made

- VARCHAR + CHECK constraint 사용 (PostgreSQL ENUM 대신) - 마이그레이션 시 값 추가/변경이 ALTER TABLE로 간단
- Partial index로 deleted_at IS NULL 조건 적용 - 삭제된 행을 인덱스에서 제외하여 조회 성능 최적화
- UserIdGuard는 전역 가드가 아닌 컨트롤러 단위 적용 - prompts는 공개 데이터이므로 X-User-Id 불필요

## Deviations from Plan

None - 계획대로 정확히 실행됨

## Issues Encountered

None

## User Setup Required

None - 외부 서비스 설정 불필요

## Next Phase Readiness

- DB 스키마와 시드 데이터 준비 완료, Plan 02-02(Prompts API)에서 바로 사용 가능
- UserIdGuard와 PaginationDto 구축 완료, Plan 02-03(Submissions API)에서 바로 사용 가능
- TypeScript 컴파일 에러 없음

## Self-Check: PASSED

- 7개 파일 모두 존재 확인
- 2개 커밋(da7523c, f497336) 모두 존재 확인
- DB 마이그레이션 성공 (3개 파일 순서대로 적용)
- DB에 30개 시드 데이터 삽입 확인
- TypeScript 컴파일 에러 없음 확인

---

_Phase: 02-prompts-submissions_
_Completed: 2026-03-30_
