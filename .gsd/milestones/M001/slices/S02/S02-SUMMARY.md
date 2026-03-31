---
id: S02
parent: M001
milestone: M001
provides:
  - PromptsModule (PromptsService export) — 다른 모듈에서 주제 존재 확인에 사용
  - SubmissionsModule — 답안 CRUD + 상태 전환 API
  - prompts 테이블 + 30개 시드 데이터
  - submissions 테이블 + soft delete + draft/submitted 상태 관리
  - UserIdGuard + @UserId() 데코레이터 — 사용자 식별 인프라
  - PaginationDto + PaginatedResponse<T> — 페이지네이션 공통 인프라
requires:
  - slice: S01
    provides: DatabaseModule(pg Pool), MigrationService, Docker Compose 인프라, ResponseInterceptor, HttpExceptionFilter
affects:
  - S03
key_files:
  - migrations/001_create_prompts.sql
  - migrations/002_create_submissions.sql
  - migrations/003_seed_prompts.sql
  - server/src/prompts/prompts.controller.ts
  - server/src/prompts/prompts.service.ts
  - server/src/prompts/prompts.repository.ts
  - server/src/prompts/dto/get-prompts.dto.ts
  - server/src/submissions/submissions.controller.ts
  - server/src/submissions/submissions.service.ts
  - server/src/submissions/submissions.repository.ts
  - server/src/submissions/dto/create-submission.dto.ts
  - server/src/submissions/dto/update-submission.dto.ts
  - server/src/submissions/dto/get-submissions.dto.ts
  - server/src/common/guards/user-id.guard.ts
  - server/src/common/decorators/user-id.decorator.ts
  - server/src/common/dto/pagination.dto.ts
key_decisions:
  - VARCHAR + CHECK constraint 사용 (PostgreSQL ENUM 대신) — 마이그레이션 시 값 추가/변경이 용이
  - Partial index로 deleted_at IS NULL 조건 적용 — 삭제된 행은 인덱스에서 제외하여 성능 최적화
  - UserIdGuard는 전역이 아닌 컨트롤러 단위 적용 — prompts는 공개 데이터이므로 가드 불필요
  - 동적 WHERE 절에 paramIndex 카운터 방식 사용 — 필터 조합에 따라 안전하게 파라미터 바인딩
  - PromptsService를 export하여 SubmissionsModule에서 prompt_id 유효성 검증에 재사용
patterns_established:
  - Repository 패턴: Controller → Service(비즈니스 로직) → Repository(Raw SQL). 모든 feature 모듈이 이 3계층을 따른다.
  - 동적 WHERE 절 구성: paramIndex 카운터 + conditions 배열 + params 배열로 안전한 동적 쿼리 생성
  - PaginatedResponse<T>: items/total/page/limit/totalPages 페이지네이션 응답 표준 형식
  - PaginationDto 상속: 각 feature의 GetXxxDto는 PaginationDto를 extends하여 page/limit을 재사용
  - 소유권 격리: WHERE user_id = $N AND deleted_at IS NULL 패턴으로 사용자별 데이터 격리 + soft delete 적용
  - DTO 유효성 검증: class-validator 데코레이터 + NestJS ValidationPipe로 요청 데이터 자동 검증
observability_surfaces:
  - GET /health 엔드포인트 — DB 연결 상태 확인
  - 일관된 에러 응답 형식: { success: false, error: { code, message, details? } } — 에러 추적 용이
drill_down_paths:
  - .gsd/milestones/M001/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S02/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T03:13:41.373Z
blocker_discovered: false
---

# S02: Prompts Submissions

**prompts/submissions DB 스키마, 30개 시드 데이터, 8개 REST API 엔드포인트(목록·상세·생성·수정·제출·삭제)가 동작하는 쓰기 주제 및 답안 관리 기능 완성**

## What Happened

S01에서 구축한 인프라(DatabaseModule, MigrationService, Docker Compose) 위에 쓰기 주제(prompts)와 답안(submissions) 도메인을 구현했다.

**마이그레이션 (3개 SQL 스크립트):**
- `001_create_prompts.sql` — prompts 테이블 생성. category(일기/편지/감상문/설명문/논설문) 5종과 difficulty(beginner/intermediate/advanced) 3단계를 CHECK constraint로 보장. category/difficulty 인덱스 추가.
- `002_create_submissions.sql` — submissions 테이블 생성. prompt_id FK, user_id, status(draft/submitted) CHECK constraint, soft delete용 deleted_at 컬럼. 삭제되지 않은 행만 대상으로 하는 partial index 3개(user_id, prompt_id, user+prompt+draft 복합).
- `003_seed_prompts.sql` — 5개 카테고리 × 3단계 난이도 = 30개 한국어 쓰기 주제 시드 데이터.

**Prompts 모듈 (2개 엔드포인트):**
- `GET /prompts` — 목록 조회. category/difficulty 필터링, page/limit 페이지네이션 지원. 동적 WHERE 절은 paramIndex 카운터 방식으로 안전하게 구성.
- `GET /prompts/:id` — 상세 조회. 없는 ID → 404.
- 공개 데이터이므로 UserIdGuard 미적용.

**Submissions 모듈 (6개 엔드포인트):**
- `POST /submissions` — 답안 생성(draft). prompt_id 유효성 검증(PromptsService 재사용).
- `PATCH /submissions/:id` — 내용 수정. draft만 수정 가능, submitted → 400.
- `PATCH /submissions/:id/submit` — 최종 제출. draft→submitted 단방향 전환. 빈 content → 400.
- `DELETE /submissions/:id` — soft delete. deleted_at에 현재 시각 설정.
- `GET /submissions` — 목록 조회. 페이지네이션 + status 필터. prompts JOIN으로 주제 정보 포함.
- `GET /submissions/:id` — 상세 조회. 주제 정보(title, category, difficulty) 포함.
- 모든 엔드포인트에 UserIdGuard 적용. X-User-Id 헤더 필수.

**공통 인프라:**
- `UserIdGuard` — X-User-Id 헤더 검증 가드. 빈 문자열/미전송 → 400.
- `@UserId()` 데코레이터 — 컨트롤러에서 헤더 값 추출.
- `PaginationDto` — page/limit 공통 DTO. @Type(() => Number)로 쿼리스트링→숫자 변환.
- `PaginatedResponse<T>` — items/total/page/limit/totalPages 통일 인터페이스.
- DTO에 class-validator 데코레이터 + @nestjs/swagger 데코레이터 적용. content 5000자 제한.

## Verification

**TypeScript 타입 체크:** `npx tsc --noEmit` — 에러 0건.

**Docker Compose 기동:** `docker compose up --build` — PostgreSQL 16 + NestJS 앱 정상 시작, 모든 마이그레이션 실행, 30개 시드 데이터 적재.

**Prompts API 검증:**
- GET /prompts?page=1&limit=3 → 30개 중 3개 반환, totalPages=10 ✅
- GET /prompts?category=일기&difficulty=beginner → 2개 반환 ✅
- GET /prompts/1 → 상세 정보 반환 ✅
- GET /prompts/999 → 404 NOT_FOUND ✅

**Submissions API 검증:**
- POST /submissions (prompt_id=1, content) → draft 생성 ✅
- PATCH /submissions/:id (content 수정) → 수정 반영 ✅
- PATCH /submissions/:id/submit → status=submitted ✅
- submitted 답안 수정 시도 → 400 "이미 제출된 답안은 수정할 수 없습니다" ✅
- GET /submissions → 페이지네이션 목록 + 주제 정보 포함 ✅
- GET /submissions/:id → 상세 + 주제 정보 ✅
- DELETE /submissions/:id → soft delete 성공 ✅
- 삭제 후 GET → 404 ✅

**에지 케이스 검증:**
- X-User-Id 헤더 없이 요청 → 400 "X-User-Id 헤더가 필요합니다" ✅
- 빈 content로 제출 시도 → 400 "내용이 비어있는 답안은 제출할 수 없습니다" ✅
- 존재하지 않는 prompt_id → 400 "유효하지 않은 주제입니다" ✅
- 다른 사용자의 답안 조회 → 404 (소유권 격리) ✅
- content 5001자 → 400 validation 에러 ✅

## Requirements Advanced

- PROMPT-01 — GET /prompts API로 주제 목록 조회, 카테고리/난이도 필터링, 페이지네이션 구현 완료
- PROMPT-02 — GET /prompts/:id API로 주제 상세 조회 구현 완료
- SUB-01 — POST /submissions API로 답안 생성(draft) 구현 완료, content 빈 문자열 허용
- SUB-02 — PATCH /submissions/:id API로 draft 답안 수정(이어쓰기) 구현 완료
- SUB-03 — PATCH /submissions/:id/submit API로 draft→submitted 상태 전환 구현 완료
- SUB-04 — DELETE /submissions/:id API로 soft delete 구현 완료
- SUB-05 — GET /submissions API로 목록 조회, 페이지네이션, status 필터 구현 완료
- SUB-06 — GET /submissions/:id API로 상세 조회(주제 정보 포함) 구현 완료

## Requirements Validated

- PROMPT-01 — API 테스트: GET /prompts?page=1&limit=3 → 30개 중 3개 반환, totalPages=10
- PROMPT-02 — API 테스트: GET /prompts/1 → 상세 반환, GET /prompts/999 → 404
- SUB-01 — API 테스트: POST /submissions → draft 생성, 빈 content 허용, 잘못된 prompt_id → 400
- SUB-02 — API 테스트: PATCH /submissions/:id → draft 수정 성공, submitted 수정 → 400
- SUB-03 — API 테스트: PATCH /submissions/:id/submit → status=submitted, 빈 content → 400
- SUB-04 — API 테스트: DELETE /submissions/:id → soft delete, 이후 조회 → 404
- SUB-05 — API 테스트: GET /submissions → 페이지네이션 + 주제 정보 포함
- SUB-06 — API 테스트: GET /submissions/:id → 주제 title/category/difficulty 포함

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

- 인증 체계 없이 X-User-Id 헤더로만 사용자를 식별한다. 누구든 헤더를 변조하면 다른 사용자로 행동할 수 있다. v2에서 실제 인증을 추가할 때 교체해야 한다.
- submissions 테이블에 한 사용자가 같은 prompt_id로 여러 draft를 생성할 수 있다. 비즈니스 요구에 따라 유니크 제약이 필요할 수 있다.

## Follow-ups

None.

## Files Created/Modified

- `migrations/001_create_prompts.sql` — prompts 테이블 생성 (category/difficulty CHECK constraint, 인덱스)
- `migrations/002_create_submissions.sql` — submissions 테이블 생성 (prompt_id FK, status CHECK, soft delete, partial index 3개)
- `migrations/003_seed_prompts.sql` — 5카테고리 × 3난이도 = 30개 한국어 쓰기 주제 시드 데이터
- `server/src/prompts/prompts.controller.ts` — GET /prompts, GET /prompts/:id 엔드포인트
- `server/src/prompts/prompts.service.ts` — 주제 목록/상세 비즈니스 로직 (페이지네이션, 404 처리)
- `server/src/prompts/prompts.repository.ts` — prompts 테이블 Raw SQL 쿼리 (동적 WHERE, 파라미터 바인딩)
- `server/src/prompts/prompts.module.ts` — PromptsModule 정의 (PromptsService export)
- `server/src/prompts/dto/get-prompts.dto.ts` — 카테고리/난이도 필터 + 페이지네이션 DTO
- `server/src/submissions/submissions.controller.ts` — 6개 submissions 엔드포인트 (CRUD + 제출 + 목록)
- `server/src/submissions/submissions.service.ts` — 답안 비즈니스 로직 (상태 전환, 소유권 검증, prompt_id 검증)
- `server/src/submissions/submissions.repository.ts` — submissions 테이블 Raw SQL 쿼리 (CRUD + JOIN + soft delete)
- `server/src/submissions/submissions.module.ts` — SubmissionsModule 정의 (PromptsModule import)
- `server/src/submissions/dto/create-submission.dto.ts` — 답안 생성 DTO (prompt_id 필수, content 선택, 5000자 제한)
- `server/src/submissions/dto/update-submission.dto.ts` — 답안 수정 DTO (content 필수, 5000자 제한)
- `server/src/submissions/dto/get-submissions.dto.ts` — 답안 목록 조회 DTO (status 필터 + 페이지네이션)
- `server/src/common/guards/user-id.guard.ts` — X-User-Id 헤더 검증 가드
- `server/src/common/decorators/user-id.decorator.ts` — X-User-Id 헤더 값 추출 데코레이터
- `server/src/common/dto/pagination.dto.ts` — 공통 페이지네이션 DTO (page/limit)
- `server/src/common/interfaces/paginated.interface.ts` — PaginatedResponse<T> 인터페이스
- `server/src/app.module.ts` — PromptsModule + SubmissionsModule 등록
