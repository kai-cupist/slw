# S02: Prompts Submissions

**Goal:** Phase 2의 DB 스키마(prompts, submissions 테이블)와 시드 데이터를 마이그레이션 SQL로 생성하고,
후속 Plan에서 사용할 공통 인프라(X-User-Id 가드/데코레이터, 페이지네이션 DTO/인터페이스)를 구축한다.
**Demo:** Phase 2의 DB 스키마(prompts, submissions 테이블)와 시드 데이터를 마이그레이션 SQL로 생성하고,
후속 Plan에서 사용할 공통 인프라(X-User-Id 가드/데코레이터, 페이지네이션 DTO/인터페이스)를 구축한다.

## Must-Haves


## Tasks

- [x] **T01: 02-prompts-submissions 01** `est:3min`
  - Phase 2의 DB 스키마(prompts, submissions 테이블)와 시드 데이터를 마이그레이션 SQL로 생성하고,
후속 Plan에서 사용할 공통 인프라(X-User-Id 가드/데코레이터, 페이지네이션 DTO/인터페이스)를 구축한다.

Purpose: Phase 2의 모든 API 엔드포인트가 의존하는 DB 테이블과 공통 코드를 선행 구축한다.
Output: 마이그레이션 SQL 3개 + 공통 인프라 TypeScript 4개
- [x] **T02: 02-prompts-submissions 02** `est:2min`
  - 쓰기 주제(prompts) 읽기 전용 API를 구현한다. GET /prompts (목록, 필터링, 페이지네이션)와 GET /prompts/:id (상세) 두 엔드포인트를 제공한다.

Purpose: 사용자가 쓰기 주제를 탐색하고 선택할 수 있는 API를 제공한다.
Output: PromptsModule (Repository + Service + Controller + DTO) + AppModule 등록
- [x] **T03: 02-prompts-submissions 03** `est:4min`
  - 답안(submissions) CRUD API 6개 엔드포인트를 구현한다. 답안 생성/임시저장, 수정/이어쓰기, 최종 제출(draft->submitted), soft delete, 목록 조회(페이지네이션), 상세 조회를 제공한다. X-User-Id 헤더로 사용자를 식별하고 소유권을 검증한다.

Purpose: 사용자가 쓰기 답안을 전체 라이프사이클(생성-수정-제출-삭제-조회)로 관리할 수 있는 API를 제공한다.
Output: SubmissionsModule (Repository + Service + Controller + DTO 3개) + AppModule 등록

## Files Likely Touched

- `migrations/001_create_prompts.sql`
- `migrations/002_create_submissions.sql`
- `migrations/003_seed_prompts.sql`
- `server/src/common/guards/user-id.guard.ts`
- `server/src/common/decorators/user-id.decorator.ts`
- `server/src/common/dto/pagination.dto.ts`
- `server/src/common/interfaces/paginated.interface.ts`
- `server/src/prompts/prompts.module.ts`
- `server/src/prompts/prompts.controller.ts`
- `server/src/prompts/prompts.service.ts`
- `server/src/prompts/prompts.repository.ts`
- `server/src/prompts/dto/get-prompts.dto.ts`
- `server/src/app.module.ts`
- `server/src/submissions/submissions.module.ts`
- `server/src/submissions/submissions.controller.ts`
- `server/src/submissions/submissions.service.ts`
- `server/src/submissions/submissions.repository.ts`
- `server/src/submissions/dto/create-submission.dto.ts`
- `server/src/submissions/dto/update-submission.dto.ts`
- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/app.module.ts`
