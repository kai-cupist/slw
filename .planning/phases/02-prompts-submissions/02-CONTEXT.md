# Phase 2: 쓰기 주제 및 답안 관리 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

사용자가 쓰기 주제를 탐색하고, 답안을 작성/임시저장/제출/삭제하며, 과거 제출 이력을 조회할 수 있는 상태. 주제(prompts) CRUD API와 답안(submissions) CRUD API를 구현하고, DB에 시드 데이터(20-30개 주제)를 포함한다. AI 평가 연동은 Phase 3에서 구현한다.

</domain>

<decisions>
## Implementation Decisions

### DB 스키마 설계

- **D-01:** ID는 SERIAL (자동 증가 정수)을 사용한다. 학습 목적에서 UUID보다 직관적이고 디버깅이 용이하다.
- **D-02:** `prompts` 테이블: id, title, description, category, difficulty, created_at, updated_at. 주제 정보를 저장한다.
- **D-03:** `submissions` 테이블: id, prompt_id (FK → prompts.id), user_id, content, status, created_at, updated_at, deleted_at. 답안 정보를 저장한다.
- **D-04:** prompts.difficulty는 VARCHAR + CHECK constraint ('beginner', 'intermediate', 'advanced')로 관리한다.
- **D-05:** prompts.category는 VARCHAR로 저장한다. (일기, 편지, 감상문, 설명문, 논설문)

### 답안 상태 관리

- **D-06:** submissions.status는 VARCHAR + CHECK constraint ('draft', 'submitted')로 관리한다. PostgreSQL ENUM type보다 마이그레이션 시 변경이 용이하다.
- **D-07:** draft → submitted 전환은 한 방향만 허용한다. 제출 후 다시 draft로 돌릴 수 없다.
- **D-08:** Soft delete는 deleted_at TIMESTAMP 컬럼으로 구현한다. NULL = 활성, NOT NULL = 삭제 시각. 모든 조회 쿼리에 WHERE deleted_at IS NULL 조건을 추가한다.

### 페이지네이션

- **D-09:** offset/limit 기반 페이지네이션을 사용한다. 데이터 규모가 작고, SQL 학습 목적에서 cursor 기반보다 직관적이다.
- **D-10:** 기본 정렬은 created_at DESC (최신순)이며, 기본 페이지 크기는 10이다.
- **D-11:** 응답에 총 개수(total), 현재 페이지, 페이지당 항목 수를 포함한다.

### 사용자 식별 (인증 없음)

- **D-12:** v1에서는 인증 없이 X-User-Id 요청 헤더로 사용자를 식별한다. 클라이언트(Expo 앱)에서 UUID를 생성하여 로컬 저장 후 매 요청에 포함한다.
- **D-13:** X-User-Id가 없는 요청은 400 에러로 거부한다. (빈 문자열도 거부)
- **D-14:** v2에서 JWT 인증 도입 시 이 헤더 방식을 교체한다. user_id 컬럼의 데이터 타입은 VARCHAR로 하여 UUID 문자열을 저장한다.

### 시드 데이터

- **D-15:** 5개 카테고리 × 난이도 3단계로 25-30개 주제를 시드 데이터로 제공한다.
- **D-16:** 카테고리: 일기, 편지, 감상문, 설명문, 논설문 (초등 국어 교과서 기반)
- **D-17:** 시드 데이터는 마이그레이션 SQL 파일로 관리한다. (별도의 seed 스크립트가 아닌 마이그레이션 체계 내)

### API 엔드포인트 설계

- **D-18:** 주제 API: GET /prompts (목록), GET /prompts/:id (상세). 주제는 읽기 전용이므로 POST/PUT/DELETE 불필요.
- **D-19:** 답안 API: POST /submissions (생성/임시저장), PATCH /submissions/:id (수정/이어쓰기), PATCH /submissions/:id/submit (최종 제출), DELETE /submissions/:id (soft delete), GET /submissions (목록), GET /submissions/:id (상세).
- **D-20:** 주제 목록은 카테고리와 난이도로 필터링 가능해야 한다. (쿼리 파라미터: ?category=일기&difficulty=beginner)

### Claude's Discretion

- 정확한 SQL 인덱스 설계 (어떤 컬럼에 인덱스를 걸지)
- DTO 클래스의 구체적인 유효성 검증 규칙 (글자 수 제한 등)
- 필터링 쿼리의 동적 WHERE 절 구성 방식
- 에러 코드 문자열 (PROMPT_NOT_FOUND, SUBMISSION_NOT_FOUND 등)

</decisions>

<canonical_refs>

## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above.

### 요구사항

- `.planning/REQUIREMENTS.md` — PROMPT-01~04, SUB-01~06 요구사항 정의
- `.planning/PROJECT.md` — 프로젝트 제약 사항 (ORM 금지, 수동 마이그레이션, 편의 라이브러리 최소화)

### 이전 페이즈 컨텍스트

- `.planning/phases/01-infra-setup/01-CONTEXT.md` — DatabaseModule, Envelope 패턴, 프로젝트 구조 결정 사항

### 기존 코드 (Phase 1 산출물)

- `server/src/database/database.service.ts` — query/queryOne/withTransaction 메서드 (Phase 2 Repository에서 사용)
- `server/src/common/interfaces/api-response.interface.ts` — ApiSuccessResponse/ApiErrorResponse 타입
- `server/src/common/filters/http-exception.filter.ts` — 통일된 에러 응답 필터
- `server/src/common/interceptors/response.interceptor.ts` — Envelope 래핑 인터셉터

</canonical_refs>

<code_context>

## Existing Code Insights

### Reusable Assets

- `DatabaseService` (query, queryOne, withTransaction): 모든 SQL 실행의 진입점. Phase 2 Repository에서 주입하여 사용
- `ResponseInterceptor`: 성공 응답 자동 래핑. Phase 2 컨트롤러에서 추가 작업 불필요
- `HttpExceptionFilter`: 에러 응답 통일. Phase 2에서 NestJS 기본 예외만 throw하면 됨
- `ApiResponse` 인터페이스: 응답 타입 정의 재사용

### Established Patterns

- `@Global() DatabaseModule`: pg Pool 전역 제공 — 새 모듈에서 별도 import 불필요
- `ConfigModule.forRoot({ isGlobal: true })`: 환경변수 전역 접근 가능
- `ValidationPipe` 전역 설정: DTO에 class-validator 데코레이터만 추가하면 자동 검증
- 마이그레이션: `migrations/` 폴더에 NNN_description.sql 순서대로 실행

### Integration Points

- `AppModule.imports`에 PromptsModule, SubmissionsModule 추가
- `migrations/` 폴더에 001_create_prompts.sql, 002_create_submissions.sql, 003_seed_prompts.sql 추가
- 기존 Swagger 설정(/api-docs)에 새 엔드포인트 자동 노출

</code_context>

<specifics>
## Specific Ideas

- Phase 1에서 확립한 Controller-Service-Repository 패턴을 그대로 따르되, 이번에는 실제 비즈니스 로직이 포함된 서비스를 구현하는 것이 핵심 학습 포인트
- Raw SQL로 JOIN, 동적 WHERE, 페이지네이션(COUNT + offset/limit) 쿼리를 직접 작성하여 SQL 실력 향상
- X-User-Id 헤더는 NestJS Custom Decorator나 Guard로 추출하여 깔끔하게 처리

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

_Phase: 02-prompts-submissions_
_Context gathered: 2026-03-30_
