# S03: AI 평가 및 이력

**Goal:** 답안 제출 후 Groq LLM API를 호출하여 문법/논리/표현력/주제 적절성 4항목 평가를 수행하고, 결과를 DB에 저장하며, 평가 이력과 점수 추이를 조회할 수 있다.
**Demo:** After this: 답안 제출 시 Groq LLM API가 호출되어 문법/논리/표현력/주제 적절성 4항목 점수와 상세 피드백이 반환되고, 과거 평가 이력과 점수 추이를 조회할 수 있다

## Tasks
- [x] **T01: evaluations 테이블 마이그레이션 SQL 2건, groq-sdk 설치, LlmModule/LlmService 구현, SubmissionsModule export 추가 완료** — S03의 기반을 마련한다. (1) evaluations 테이블 생성 + submissions CHECK constraint에 'evaluated' 추가, (2) groq-sdk npm 패키지 설치, (3) Groq SDK를 래핑하는 LlmModule/LlmService 구현.

LlmService는 한국어 쓰기 평가 프롬프트를 관리하고, JSON Object Mode로 구조화된 평가 결과를 요청하며, 응답을 파싱·검증하는 역할을 한다. groq-sdk의 내장 재시도(429/5xx 자동 2회)에 더해, JSON 파싱 실패 시 1회 재시도 로직을 추가한다.

핵심 패턴:
- ConfigService로 GROQ_API_KEY, LLM_MODEL 환경변수 주입
- response_format: { type: 'json_object' } + 프롬프트 내 JSON 스키마 명시
- 응답 파싱 후 4항목 점수(1~10 범위) + 피드백 필드 존재 수동 검증
- GROQ_API_KEY는 secure_env_collect로 수집

DB 마이그레이션:
- 004_create_evaluations.sql: evaluations 테이블 (submission_id UNIQUE FK, 4개 점수 컬럼, total_score NUMERIC(3,1), feedback JSONB, raw_response JSONB)
- 005_add_evaluated_status.sql: submissions CHECK constraint DROP + ADD ('draft','submitted','evaluated')

SubmissionsModule 변경: SubmissionsService와 SubmissionsRepository를 export하여 EvaluationsModule에서 사용 가능하게 함.
  - Estimate: 1h
  - Files: migrations/004_create_evaluations.sql, migrations/005_add_evaluated_status.sql, server/package.json, server/src/llm/llm.module.ts, server/src/llm/llm.service.ts, server/src/submissions/submissions.module.ts, .env
  - Verify: cd server && npx tsc --noEmit && echo '타입 체크 통과' && grep -q 'groq-sdk' package.json && echo 'groq-sdk 설치 확인' && test -f ../migrations/004_create_evaluations.sql && test -f ../migrations/005_add_evaluated_status.sql && echo '마이그레이션 파일 존재 확인'
- [x] **T02: EvaluationsModule 구현 — POST /submissions/:id/evaluate(LLM 평가+DB 저장+상태 전환)과 GET /evaluations/:submissionId(결과 조회) 엔드포인트 완성** — 핵심 가치를 구현한다: submitted 답안에 대해 LLM 평가를 수행하고 결과를 DB에 저장하는 POST /submissions/:id/evaluate 엔드포인트와, 저장된 평가 결과를 조회하는 GET /evaluations/:submissionId 엔드포인트.

구현할 파일:
1. `evaluations.repository.ts` — evaluations 테이블 Raw SQL (create, findBySubmissionId)
2. `evaluations.service.ts` — 평가 orchestration:
   - SubmissionsRepository로 submission 조회 (status='submitted' 확인)
   - 이미 evaluated인 경우 중복 평가 방지 (기존 결과 반환 또는 에러)
   - LlmService.evaluate() 호출하여 평가 수행
   - evaluations 테이블에 결과 저장
   - submissions 테이블 status를 'evaluated'로 변경
   - 트랜잭션: LLM 호출은 트랜잭션 밖, DB 저장(evaluations INSERT + submissions UPDATE)은 트랜잭션 안에서 처리
3. `evaluations.controller.ts` — POST /submissions/:id/evaluate, GET /evaluations/:submissionId
4. `evaluations.module.ts` — LlmModule + SubmissionsModule import
5. `app.module.ts` — LlmModule + EvaluationsModule 등록

기존 패턴 준수:
- Controller → Service → Repository 3계층
- UserIdGuard + @UserId() 데코레이터
- @ApiTags, @ApiOperation Swagger 데코레이터
- ResponseInterceptor가 { success: true, data } 래핑
- 파라미터 바인딩으로 SQL Injection 방지

LLM 호출 실패/파싱 실패 처리:
- groq-sdk 내장 재시도 후에도 실패 → 502 Bad Gateway + 구체적 에러 메시지
- JSON 파싱 실패 → LlmService 내에서 1회 재시도 → 실패 시 502
- 타임아웃 → 504 Gateway Timeout

검증: Docker Compose 기동 후 curl로 실제 LLM API 호출 테스트. submitted 상태 답안에 대해 평가 요청 → 4항목 점수 + 피드백 반환 확인.
  - Estimate: 1h30m
  - Files: server/src/evaluations/evaluations.module.ts, server/src/evaluations/evaluations.controller.ts, server/src/evaluations/evaluations.service.ts, server/src/evaluations/evaluations.repository.ts, server/src/app.module.ts
  - Verify: docker compose up -d --build && sleep 10 && curl -s http://localhost:3100/health | grep -q 'ok' && echo '서버 정상' && curl -s -X POST http://localhost:3100/submissions -H 'X-User-Id: test-user-s03' -H 'Content-Type: application/json' -d '{"prompt_id":1,"content":"오늘은 날씨가 좋아서 공원에 산책을 갔다. 봄꽃이 피어있어서 기분이 좋았다. 새들이 노래하는 소리를 들으며 걸었다."}' | grep -q 'draft' && echo '답안 생성 확인' && export SUB_ID=$(curl -s -X POST http://localhost:3100/submissions -H 'X-User-Id: test-user-s03' -H 'Content-Type: application/json' -d '{"prompt_id":2,"content":"오늘 하루는 정말 바빴다. 아침에 일찍 일어나 운동을 하고, 점심에는 친구를 만났다."}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])') && curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID/submit -H 'X-User-Id: test-user-s03' | grep -q 'submitted' && echo '제출 확인' && curl -s -X POST http://localhost:3100/submissions/$SUB_ID/evaluate -H 'X-User-Id: test-user-s03' | grep -q 'grammar_score' && echo '평가 성공'
- [ ] **T03: 평가 이력 목록 + 점수 추이 API 구현 및 전체 슬라이스 검증** — HIST-01, HIST-02 요구사항을 구현한다.

1. GET /evaluations/history — 사용자의 평가 이력 목록 (페이지네이션)
   - evaluations JOIN submissions JOIN prompts
   - 주제 정보(title, category, difficulty) + 점수 4항목 + total_score + evaluated_at
   - PaginationDto 상속한 GetEvaluationHistoryDto
   - PaginatedResponse<EvaluationHistory> 반환

2. GET /evaluations/scores/trend — 점수 추이
   - 사용자의 평가를 날짜순으로 반환
   - evaluated_at, total_score, grammar_score, logic_score, expression_score, relevance_score
   - 최근 N건 또는 전체 (limit 파라미터)
   - 날짜별 그룹핑은 프론트엔드 책임, API는 raw 데이터 반환

구현할 파일:
- `evaluations.repository.ts`에 findHistoryByUser(), findScoreTrendByUser() 메서드 추가
- `evaluations.service.ts`에 getHistory(), getScoreTrend() 메서드 추가
- `evaluations.controller.ts`에 GET /evaluations/history, GET /evaluations/scores/trend 엔드포인트 추가
- `evaluations/dto/get-evaluation-history.dto.ts` — PaginationDto 상속
- `evaluations/dto/get-score-trend.dto.ts` — limit 파라미터

기존 패턴:
- paramIndex 카운터 방식 동적 WHERE (user_id 필터)
- PaginatedResponse<T> + PaginationDto 상속
- Swagger 데코레이터

전체 슬라이스 검증: Docker Compose 기동 후 전체 흐름(답안 생성 → 제출 → 평가 → 결과 조회 → 이력 → 추이) curl 테스트.
  - Estimate: 1h
  - Files: server/src/evaluations/evaluations.repository.ts, server/src/evaluations/evaluations.service.ts, server/src/evaluations/evaluations.controller.ts, server/src/evaluations/dto/get-evaluation-history.dto.ts, server/src/evaluations/dto/get-score-trend.dto.ts
  - Verify: cd server && npx tsc --noEmit && echo '타입 체크 통과' && cd .. && docker compose up -d --build && sleep 10 && curl -s http://localhost:3100/evaluations/history -H 'X-User-Id: test-user-s03' | grep -q 'items' && echo '이력 조회 성공' && curl -s http://localhost:3100/evaluations/scores/trend -H 'X-User-Id: test-user-s03' | grep -q 'success' && echo '추이 조회 성공'
