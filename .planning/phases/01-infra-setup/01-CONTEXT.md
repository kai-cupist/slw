# Phase 1: 인프라 및 기반 구축 - Context

**Gathered:** 2026-03-30
**Status:** Ready for planning

<domain>
## Phase Boundary

Docker Compose 환경 구성, PostgreSQL DB 연결, 수동 SQL 마이그레이션 체계 구축, 일관된 API 응답 형식 확립. 이 페이즈는 모든 후속 기능 개발의 기반을 마련한다. 비즈니스 로직(주제, 답안, 평가)은 이 페이즈에 포함되지 않는다.

</domain>

<decisions>
## Implementation Decisions

### Docker Compose 구성
- **D-01:** NestJS 개발 서버는 hot reload를 포함하여 컨테이너에서 실행한다. 소스 코드는 볼륨 마운트로 호스트와 동기화한다.
- **D-02:** PostgreSQL 컨테이너는 데이터 볼륨을 분리하여 컨테이너 재생성 시에도 데이터가 유지된다.
- **D-03:** `docker compose up` 한 번으로 전체 개발 환경이 실행되어야 한다. 별도 설정 단계 없이 바로 개발 가능한 상태.
- **D-04:** 환경 변수는 `.env` 파일로 관리하고, `.env.example`을 제공한다. Docker Compose는 `.env`를 자동 로드한다.

### 마이그레이션 시스템
- **D-05:** `migrations/` 폴더에 번호 순서(001, 002, ...)로 SQL 파일을 관리한다. 파일명 형식: `NNN_description.sql`
- **D-06:** `schema_migrations` 테이블을 만들어 적용된 마이그레이션 이력을 추적한다.
- **D-07:** 마이그레이션 실행 스크립트(또는 NestJS 커맨드)를 작성하여, 미적용 마이그레이션을 순서대로 실행한다.
- **D-08:** 롤백은 v1에서 지원하지 않는다. 문제 발생 시 새 마이그레이션으로 수정한다.

### API 응답 형식
- **D-09:** Envelope 패턴을 사용한다. 성공: `{ success: true, data: T }`, 에러: `{ success: false, error: { code: string, message: string } }`
- **D-10:** NestJS 인터셉터로 성공 응답을 감싸고, ExceptionFilter로 에러 응답을 통일한다.
- **D-11:** 유효성 검증 실패(ValidationPipe)는 400 에러로 구체적인 필드별 에러 메시지를 반환한다.
- **D-12:** SQL 파라미터 바인딩($1, $2...)을 반드시 사용하며, 문자열 결합으로 쿼리를 만들지 않는다.

### 프로젝트 구조
- **D-13:** NestJS 기능 기반 모듈 구조를 따른다. 각 도메인(prompts, submissions, evaluations)은 독립 모듈로 분리한다.
- **D-14:** DatabaseModule은 `@Global()` 모듈로 등록하여, pg Pool을 커스텀 프로바이더로 전역 제공한다.
- **D-15:** 각 모듈 내에 Controller-Service-Repository 레이어를 분리한다. SQL은 Repository 레이어에만 작성한다.
- **D-16:** 공통 레이어: ResponseInterceptor, HttpExceptionFilter, ValidationPipe를 전역 설정한다.

### Claude's Discretion
- 정확한 Docker Compose 버전 및 이미지 태그
- NestJS 프로젝트 생성 시 패키지 매니저 선택 (npm/yarn/pnpm)
- 헬스체크 엔드포인트 구현 방식
- 공통 DTO 유효성 검증 데코레이터 선택

</decisions>

<canonical_refs>
## Canonical References

**Downstream agents MUST read these before planning or implementing.**

No external specs — requirements fully captured in decisions above and research documents below.

### 리서치 문서
- `.planning/research/STACK.md` — NestJS 11, pg 8.20, 버전별 권장 사항 및 설정
- `.planning/research/ARCHITECTURE.md` — 모듈 구조, DatabaseModule 패턴, Repository 레이어 설계
- `.planning/research/PITFALLS.md` — SQL Injection 방지, 커넥션 풀 관리, 마이그레이션 추적 주의사항

### 요구사항
- `.planning/REQUIREMENTS.md` — INFRA-01~04, API-01~03 요구사항 정의
- `.planning/PROJECT.md` — 프로젝트 제약 사항 (ORM 금지, 수동 마이그레이션)

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- 없음 (greenfield 프로젝트)

### Established Patterns
- 없음 — 이 페이즈에서 패턴을 확립한다

### Integration Points
- NestJS CLI로 프로젝트 scaffolding 생성
- Docker Compose로 PostgreSQL 및 NestJS 앱 컨테이너 관리
- pg 라이브러리로 PostgreSQL 직접 연결

</code_context>

<specifics>
## Specific Ideas

- Raw SQL 학습이 목적이므로, Repository 레이어에서 SQL 쿼리를 직접 작성하는 패턴을 명확하게 확립해야 한다
- 리서치에서 제안한 `pool.query()` 사용 (단순 쿼리) vs `pool.connect()` + `release()` (트랜잭션) 패턴을 DatabaseService에 `query()` 및 `withTransaction()` 헬퍼로 추상화
- 마이그레이션 실행은 앱 시작 시 자동 실행보다 수동 스크립트 방식이 학습에 적합

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 01-infra-setup*
*Context gathered: 2026-03-30*
