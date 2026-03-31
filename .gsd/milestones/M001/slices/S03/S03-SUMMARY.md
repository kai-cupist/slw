---
id: S03
parent: M001
milestone: M001
provides:
  - POST /submissions/:id/evaluate 엔드포인트 — 답안 AI 평가
  - GET /evaluations/:submissionId 엔드포인트 — 평가 결과 조회
  - GET /evaluations/history 엔드포인트 — 페이지네이션 이력 조회
  - GET /evaluations/scores/trend 엔드포인트 — 점수 추이
  - evaluations 테이블 스키마
  - LlmModule/LlmService — Groq SDK 래핑
requires:
  - slice: S02
    provides: submissions 테이블 스키마, SubmissionsService/Repository, prompts 테이블 및 시드 데이터
affects:
  - S04
key_files:
  - migrations/004_create_evaluations.sql
  - migrations/005_add_evaluated_status.sql
  - server/src/llm/llm.module.ts
  - server/src/llm/llm.service.ts
  - server/src/evaluations/evaluations.module.ts
  - server/src/evaluations/evaluations.controller.ts
  - server/src/evaluations/evaluations.service.ts
  - server/src/evaluations/evaluations.repository.ts
  - server/src/evaluations/dto/get-evaluation-history.dto.ts
  - server/src/evaluations/dto/get-score-trend.dto.ts
  - server/src/submissions/submissions.module.ts
  - server/src/app.module.ts
key_decisions:
  - EvaluationsModule과 SubmissionsModule 간 결합: 별도 POST /submissions/:id/evaluate 엔드포인트를 EvaluationsController에 배치하여 순환 의존 방지
  - LLM 호출은 트랜잭션 밖, DB 저장은 트랜잭션 안에서 처리하여 외부 API 장애 시 DB 일관성 보장
  - 중복 평가 요청 시 에러 대신 기존 결과 반환으로 멱등성 확보
  - total_score를 LLM 계산값 대신 서버에서 직접 계산하여 정확성 보장
  - 구체적 경로(/history, /scores/trend)를 파라미터 경로(/:submissionId)보다 먼저 선언하여 라우트 충돌 방지
patterns_established:
  - Repository 메서드에 PoolClient 선택적 파라미터로 트랜잭션 안/밖 양쪽 지원
  - Groq JSON Object Mode + 프롬프트 내 스키마 명시 + 응답 수동 검증 패턴
  - 외부 API 호출은 트랜잭션 밖, DB 저장은 트랜잭션 안에서 처리하는 orchestration 패턴
observability_surfaces:
  - LLM 호출 실패 시 502/504 에러 응답으로 외부 API 장애 구분 가능
  - evaluations 테이블의 raw_response JSONB 컬럼에 LLM 원본 응답 저장 — 디버깅용
drill_down_paths:
  - .gsd/milestones/M001/slices/S03/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S03/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T03:42:35.689Z
blocker_discovered: false
---

# S03: AI 평가 및 이력

**Groq LLM API를 호출하여 문법/논리/표현력/주제 적절성 4항목 평가를 수행하고, 결과를 DB에 저장하며, 평가 이력과 점수 추이를 조회하는 3개 엔드포인트를 완성했다.**

## What Happened

S03 슬라이스는 3개 태스크로 AI 평가 파이프라인 전체를 구축했다.

T01에서 기반 인프라를 마련했다: evaluations 테이블 생성 마이그레이션(004), submissions CHECK constraint에 'evaluated' 추가 마이그레이션(005), groq-sdk 설치, LlmModule/LlmService 구현. LlmService는 한국어 쓰기 평가 전용 프롬프트를 관리하고, JSON Object Mode + 프롬프트 내 스키마 명시로 구조화된 응답을 요청하며, 파싱 후 4항목 점수(1~10 범위)와 필수 필드 존재를 수동 검증한다. JSON 파싱 실패 시 1회 재시도 로직을 포함하고, total_score는 LLM 대신 서버에서 직접 계산하여 정확성을 보장한다.

T02에서 핵심 평가 엔드포인트를 구현했다: POST /submissions/:id/evaluate는 답안 조회→상태 검증(submitted만 허용)→중복 평가 확인(이미 evaluated면 기존 결과 반환)→LLM 호출(트랜잭션 밖)→DB 저장+상태 전환(트랜잭션 안) 순서로 처리한다. GET /evaluations/:submissionId는 저장된 평가 결과를 조회한다. LLM 호출 실패 시 502 Bad Gateway, 타임아웃 시 504 Gateway Timeout으로 적절한 에러 응답을 반환한다. 실제 Groq API 호출 E2E 테스트를 포함하여 전체 흐름을 검증했다.

T03에서 이력 및 추이 조회를 추가했다: GET /evaluations/history는 evaluations+submissions+prompts 3테이블 JOIN으로 주제 정보와 점수를 포함한 페이지네이션 목록을 반환한다. GET /evaluations/scores/trend는 사용자의 점수 추이를 시간순으로 반환한다. NestJS 라우트 충돌 방지를 위해 구체적 경로를 파라미터 경로보다 먼저 선언하는 패턴을 적용했다.

전체적으로 Controller→Service→Repository 3계층, UserIdGuard+@UserId() 데코레이터, Swagger 데코레이터, ResponseInterceptor Envelope 래핑, 파라미터 바인딩 등 S02에서 확립된 패턴을 일관되게 따랐다.

## Verification

1. TypeScript 컴파일(npx tsc --noEmit) — exit code 0, 타입 에러 없음
2. groq-sdk 의존성 확인 — package.json에 포함
3. 마이그레이션 파일 존재 확인 — 004_create_evaluations.sql, 005_add_evaluated_status.sql
4. Docker Compose E2E: 서버 헬스체크 정상(GET /health → ok)
5. 답안 생성→제출→AI 평가(실제 Groq LLM API 호출)→결과 조회 전체 흐름 검증
6. GET /evaluations/history — items 배열 반환, 주제 정보+점수 포함
7. GET /evaluations/scores/trend — 점수 추이 데이터 반환
8. 에러 케이스: draft 평가 시도 400, 미존재 답안 404, 중복 평가 멱등성 확인

## Requirements Advanced

- EVAL-01 — POST /submissions/:id/evaluate가 Groq LLM API를 호출하여 실제 평가 수행 — E2E 검증 완료
- EVAL-02 — 문법/논리/표현력/주제 적절성 4항목 각각 1~10 점수 반환 검증
- EVAL-03 — 각 항목별 상세 피드백과 개선 제안이 feedback JSONB에 저장되어 반환됨
- EVAL-04 — groq-sdk 내장 재시도(429/5xx) + JSON 파싱 실패 시 1회 재시도 + 502/504 에러 응답 검증
- EVAL-05 — evaluations 테이블에 4항목 점수, total_score, feedback JSONB, raw_response JSONB 저장 확인
- HIST-01 — GET /evaluations/history에서 페이지네이션된 평가 이력 목록 반환 검증
- HIST-02 — GET /evaluations/scores/trend에서 시간순 점수 추이 데이터 반환 검증

## Requirements Validated

- EVAL-01 — Docker Compose E2E에서 실제 Groq API 호출하여 submitted 답안 평가 수행 확인
- EVAL-02 — grammar_score, logic_score, expression_score, relevance_score 4항목 점수 반환 확인
- EVAL-03 — feedback JSONB에 항목별 상세 피드백 포함 확인
- EVAL-04 — groq-sdk 내장 재시도 + JSON 파싱 실패 1회 재시도 + 502/504 에러 응답 구현 확인
- EVAL-05 — evaluations 테이블에 점수, feedback, raw_response 저장 후 GET /evaluations/:id로 조회 확인
- HIST-01 — GET /evaluations/history에서 items 배열 + 페이지네이션 메타데이터 반환 확인
- HIST-02 — GET /evaluations/scores/trend에서 시간순 점수 데이터 반환 확인

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

NestJS 라우트 충돌 방지를 위해 Controller 메서드 순서를 재배치함 (구체적 경로 먼저, 파라미터 경로 나중에). 계획에는 없었으나 런타임에서 필수적인 변경.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `migrations/004_create_evaluations.sql` — evaluations 테이블 생성 (submission_id UNIQUE FK, 4개 점수 컬럼, total_score, feedback JSONB, raw_response JSONB)
- `migrations/005_add_evaluated_status.sql` — submissions CHECK constraint에 evaluated 상태 추가
- `server/src/llm/llm.module.ts` — Groq SDK 래핑 모듈
- `server/src/llm/llm.service.ts` — 한국어 쓰기 평가 프롬프트 관리, JSON Object Mode 호출, 응답 파싱/검증, 재시도 로직
- `server/src/evaluations/evaluations.module.ts` — EvaluationsModule — LlmModule, SubmissionsModule import
- `server/src/evaluations/evaluations.controller.ts` — POST evaluate, GET 결과조회, GET history, GET scores/trend 4개 엔드포인트
- `server/src/evaluations/evaluations.service.ts` — 평가 orchestration — 상태 검증, LLM 호출, 트랜잭션 DB 저장
- `server/src/evaluations/evaluations.repository.ts` — evaluations 테이블 Raw SQL CRUD + 이력/추이 조회
- `server/src/evaluations/dto/get-evaluation-history.dto.ts` — PaginationDto 상속한 이력 조회 DTO
- `server/src/evaluations/dto/get-score-trend.dto.ts` — limit 파라미터 DTO
- `server/src/submissions/submissions.module.ts` — SubmissionsService, SubmissionsRepository export 추가
- `server/src/app.module.ts` — LlmModule, EvaluationsModule 등록
- `server/package.json` — groq-sdk 의존성 추가
