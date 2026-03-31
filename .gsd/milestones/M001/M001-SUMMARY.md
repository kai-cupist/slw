---
id: M001
title: "쓰기 평가 MVP"
status: complete
completed_at: 2026-03-31T15:40:12.778Z
key_decisions:
  - D001: LLM API 호출은 트랜잭션 밖에서, DB 저장은 트랜잭션 안에서 처리 — 커넥션 점유 최소화, LLM 실패 시 DB 상태 보전
  - D003: 중복 평가 요청 시 기존 결과 반환으로 멱등성 확보 — 네트워크 재시도 시 무료 API 호출 한도 절약
  - D004: NestJS 컨트롤러에서 구체적 경로를 파라미터 경로보다 먼저 선언 — Express 라우트 매칭 충돌 방지
  - D006: CNG 방식 Expo 프로젝트 — ios/android 디렉토리 gitignore, Zustand + AsyncStorage로 userId 관리, fetch/useEffect로 서버 상태 직접 관리
  - pg Pool을 @Global() 커스텀 프로바이더로 전역 등록 — 모든 모듈에서 import 없이 DatabaseService 주입
  - VARCHAR + CHECK constraint 사용 (PostgreSQL ENUM 대신) — 마이그레이션 시 값 추가/변경 용이
  - Controller→Service→Repository 3계층 패턴 확립 — 모든 feature 모듈이 동일 구조 적용
key_files:
  - docker-compose.yml
  - Dockerfile
  - .env.example
  - migrations/000_create_schema_migrations.sql
  - migrations/001_create_prompts.sql
  - migrations/002_create_submissions.sql
  - migrations/003_seed_prompts.sql
  - migrations/004_create_evaluations.sql
  - migrations/005_add_evaluated_status.sql
  - server/src/database/database.module.ts
  - server/src/database/database.service.ts
  - server/src/common/interceptors/response.interceptor.ts
  - server/src/common/filters/http-exception.filter.ts
  - server/src/migration/migration.service.ts
  - server/src/prompts/prompts.controller.ts
  - server/src/prompts/prompts.repository.ts
  - server/src/submissions/submissions.controller.ts
  - server/src/submissions/submissions.repository.ts
  - server/src/submissions/submissions.service.ts
  - server/src/evaluations/evaluations.controller.ts
  - server/src/evaluations/evaluations.service.ts
  - server/src/evaluations/evaluations.repository.ts
  - server/src/llm/llm.service.ts
  - server/src/main.ts
  - server/src/app.module.ts
  - mobile/lib/api.ts
  - mobile/stores/userStore.ts
  - mobile/app/(tabs)/index.tsx
  - mobile/app/write/[submissionId].tsx
  - mobile/app/evaluation/[submissionId].tsx
  - mobile/app/(tabs)/history.tsx
lessons_learned:
  - Docker Compose에서 server/ 외부의 디렉토리(migrations/)도 별도 볼륨 마운트가 필요하다 — 서버 코드만 마운트하면 마이그레이션 파일에 접근 불가
  - MigrationService에 디렉토리 fallback 로직(process.cwd()/migrations → ../migrations)을 넣으면 로컬/Docker 환경 모두 지원 가능
  - NestJS(Express)에서 동일 컨트롤러의 구체적 경로(@Get('history'))와 파라미터 경로(@Get(':id'))가 공존할 때 반드시 구체적 경로를 먼저 선언해야 한다
  - Groq JSON Object Mode 사용 시 프롬프트에 JSON 스키마를 명시적으로 기술해야 원하는 구조를 얻는다 — response_format만으로는 불충분
  - Repository 메서드에 PoolClient 선택적 파라미터를 추가하면 트랜잭션 안/밖 양쪽 호출을 하나의 메서드로 지원할 수 있다
  - 동적 WHERE 절은 paramIndex 카운터 + conditions 배열 + params 배열 패턴으로 안전하게 구성한다
  - LLM 호출은 트랜잭션 밖에서, DB 저장은 트랜잭션 안에서 — 외부 I/O를 트랜잭션에 포함하면 커넥션 점유 시간이 길어지고 실패 시 롤백 비용이 커진다
---

# M001: 쓰기 평가 MVP

**"주제 선택 → 답안 작성 → 제출 → AI 평가 → 피드백 확인" 핵심 흐름이 백엔드 API + Expo 모바일 앱으로 끝까지 동작하는 v1을 완성했다.**

## What Happened

M001은 4개 슬라이스로 쓰기 평가 MVP 전체를 구축했다.

**S01 (Infra Setup)** — NestJS 프로젝트를 server/에 생성하고, Docker Compose로 PostgreSQL 16-alpine + NestJS 앱을 한 명령으로 실행 가능한 환경을 구성했다. @Global() DatabaseModule로 pg Pool을 전역 제공하고, MigrationService로 SQL 파일 기반 수동 마이그레이션 시스템을 구축했다. API Envelope 패턴(ResponseInterceptor + HttpExceptionFilter), 전역 ValidationPipe, Swagger UI(/api-docs)를 설정하여 후속 모듈의 공통 인프라를 확립했다.

**S02 (Prompts & Submissions)** — prompts/submissions 테이블 마이그레이션 SQL 3건과 30개 한국어 쓰기 주제 시드 데이터를 생성했다. Controller→Service→Repository 3계층 패턴으로 주제 2개 + 답안 6개 = 8개 REST API 엔드포인트를 구현했다. UserIdGuard + @UserId() 데코레이터로 사용자 식별, PaginationDto + PaginatedResponse<T>로 페이지네이션 공통 인프라를 확립했다. 동적 WHERE 절의 paramIndex 카운터 패턴, soft delete, draft/submitted 상태 전환 등 핵심 백엔드 패턴을 학습·적용했다.

**S03 (AI 평가 및 이력)** — groq-sdk를 래핑한 LlmModule/LlmService를 구현하고, POST /submissions/:id/evaluate로 Groq LLM API를 호출하여 문법/논리/표현력/주제 적절성 4항목 평가를 수행한다. JSON Object Mode + 프롬프트 내 스키마 명시로 구조화된 응답을 받고, 파싱 후 점수 범위(1~10)와 필수 필드를 수동 검증한다. LLM 호출은 트랜잭션 밖, DB 저장은 트랜잭션 안에서 처리하는 orchestration 패턴을 적용했다. GET /evaluations/history(이력)와 GET /evaluations/scores/trend(추이) 엔드포인트도 추가했다.

**S04 (모바일 클라이언트)** — Expo SDK 55 + expo-router로 mobile/에 앱을 생성하고, 7개 화면 파일로 전체 사용자 흐름을 완성했다. lib/api.ts가 envelope 파싱, X-User-Id 자동 주입을 처리하고, Zustand + AsyncStorage로 UUID를 영속 관리한다. 주제 목록(FlatList) → 주제 상세 → 답안 작성/임시저장/제출 → AI 평가 결과(4항목 프로그레스 바) → 이력/점수 추이(미니 바) 전체 흐름이 구현되었다.

전체적으로 ORM 없이 Raw SQL만 사용하고, 수동 SQL 마이그레이션으로 스키마를 관리하며, fetch/useEffect 패턴으로 서버 상태를 직접 관리하는 등 프로젝트의 학습 목적 제약을 일관되게 준수했다.

## Success Criteria Results

## 성공 기준 검증 (비전에서 도출)

- ✅ **주제 조회/선택**: S02 GET /prompts, GET /prompts/:id API + S04 FlatList 주제 목록 화면 — curl E2E 검증 완료
- ✅ **답안 작성/임시저장**: S02 POST /submissions, PATCH /submissions/:id API + S04 write/[submissionId] 화면 — 임시저장/이어쓰기 동작 확인
- ✅ **답안 제출**: S02 PATCH /submissions/:id/submit + S04 자동저장 후 submit+evaluate 순차 호출 — draft→submitted 상태 전환 검증
- ✅ **AI 평가 수행**: S03 POST /submissions/:id/evaluate + 실제 Groq LLM API 호출 E2E 검증 — 4항목 점수(1~10) + 피드백 반환 확인
- ✅ **피드백 확인**: S03 GET /evaluations/:submissionId + S04 evaluation/[submissionId] 화면 — 4항목 프로그레스 바 + 피드백 텍스트 표시
- ✅ **이력/추이 조회**: S03 GET /evaluations/history, GET /evaluations/scores/trend + S04 history.tsx TrendSection — 페이지네이션 목록 + 미니 바 추이

**모든 성공 기준 충족.**

## Definition of Done Results

## 완료 정의 검증

- ✅ **모든 슬라이스 완료**: S01, S02, S03, S04 — 4/4 슬라이스 `[x]` 체크
- ✅ **슬라이스 SUMMARY 존재**: S01-SUMMARY.md, S02-SUMMARY.md, S03-SUMMARY.md, S04-SUMMARY.md — 4/4 존재
- ✅ **슬라이스 UAT 존재**: S01-UAT.md, S02-UAT.md, S03-UAT.md, S04-UAT.md — 4/4 존재
- ✅ **크로스 슬라이스 통합**: S01→S02(DatabaseModule, MigrationService), S02→S03(submissions 테이블, SubmissionsModule export), S03→S04(API 엔드포인트, CORS 활성화) — 모든 produces/consumes 정렬 확인
- ✅ **TypeScript 컴파일**: S01~S04 모두 `npx tsc --noEmit` exit code 0
- ✅ **Docker Compose E2E**: PostgreSQL + NestJS 기동, 마이그레이션 실행, API 응답 확인
- ✅ **코드 변경 실재**: 100개 파일, 25,318줄 추가 (server/, mobile/, migrations/, 인프라 파일 포함)

## Requirement Outcomes

## 요구사항 상태 전환

### active → validated (20건) — M001에서 검증 완료

| 요구사항 | 증거 |
|---------|------|
| PROMPT-01 | S02 E2E: GET /prompts?page=1&limit=3 → 30개 중 3개 반환, totalPages=10 |
| PROMPT-02 | S02 E2E: GET /prompts/1 → 상세 반환, GET /prompts/999 → 404 |
| SUB-01 | S02 E2E: POST /submissions → draft 생성, 빈 content 허용, 잘못된 prompt_id → 400 |
| SUB-02 | S02 E2E: PATCH /submissions/:id → draft 수정 성공, submitted 수정 → 400 |
| SUB-03 | S02 E2E: PATCH /submissions/:id/submit → status=submitted, 빈 content → 400 |
| SUB-04 | S02 E2E: DELETE /submissions/:id → soft delete, 이후 조회 → 404 |
| SUB-05 | S02 E2E: GET /submissions → 페이지네이션 + 주제 정보 포함 |
| SUB-06 | S02 E2E: GET /submissions/:id → 주제 title/category/difficulty 포함 |
| EVAL-01 | S03 E2E: POST /submissions/:id/evaluate → 실제 Groq API 호출, submitted 답안 평가 수행 |
| EVAL-02 | S03 E2E: grammar_score, logic_score, expression_score, relevance_score 4항목 점수 반환 |
| EVAL-03 | S03 E2E: feedback JSONB에 항목별 상세 피드백 포함 |
| EVAL-04 | S03: groq-sdk 내장 재시도 + JSON 파싱 실패 1회 재시도 + 502/504 에러 응답 구현 |
| EVAL-05 | S03 E2E: evaluations 테이블에 점수, feedback, raw_response 저장 후 GET 조회 확인 |
| HIST-01 | S03 E2E: GET /evaluations/history → items 배열 + 페이지네이션 메타데이터 반환 |
| HIST-02 | S03 E2E: GET /evaluations/scores/trend → 시간순 점수 데이터 반환 |
| APP-01 | S04: FlatList 주제 목록 + 카테고리/난이도 뱃지 + Pressable 네비게이션, tsc 통과 |
| APP-02 | S04: write/[submissionId] 화면 — 답안 생성(POST), 임시저장(PATCH), 제출(submit+evaluate), tsc 통과 |
| APP-03 | S04: evaluation/[submissionId] 화면 — 4항목 프로그레스 바 + 총점 + feedback 텍스트, tsc 통과 |
| APP-04 | S04: history.tsx — FlatList 이력 목록 + TrendSection 점수 추이 미니 바, tsc 통과 |

### 기존 validated 유지 (9건)
INFRA-01, INFRA-02, INFRA-03, INFRA-04, PROMPT-03, PROMPT-04, API-01, API-02, API-03

### 미주소 요구사항: 없음
29개 전체 요구사항이 validated 상태로 전환.

## Deviations

- S01/T02: Docker 컨테이너에 migrations/ 폴더 볼륨 마운트 추가 (계획에 없었으나 인프라 보완)
- S03/T03: NestJS 컨트롤러 메서드 순서 재배치로 라우트 충돌 방지 (런타임 필수 변경)
- S04/T01: Expo SDK 55 기본 템플릿의 src/app/ 구조를 app/ 루트로 변환
- S04/T03: api.ts에 patch 메서드 추가 (계획에 없었으나 PATCH 엔드포인트 호출에 필수)
- S04/T04: feedback 구조를 서버 실제 구현(플랫 문자열)에 맞춰 조정

## Follow-ups

- 실제 인증 체계 도입 (현재 X-User-Id 헤더 기반 — 변조 가능)
- TanStack Query 도입 검토 (v2에서 API 엔드포인트 증가 시)
- 오프라인 지원 및 캐싱 전략 (v2)
- 차트 라이브러리 도입으로 점수 추이 시각화 개선 (v2)
- 한 사용자가 같은 prompt_id로 여러 draft 생성 가능 — 비즈니스 요구에 따라 유니크 제약 검토
