---
estimated_steps: 24
estimated_files: 5
skills_used: []
---

# T02: EvaluationsModule 코어 — 평가 요청 API + 결과 저장 + 단건 조회

핵심 가치를 구현한다: submitted 답안에 대해 LLM 평가를 수행하고 결과를 DB에 저장하는 POST /submissions/:id/evaluate 엔드포인트와, 저장된 평가 결과를 조회하는 GET /evaluations/:submissionId 엔드포인트.

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

## Inputs

- ``server/src/llm/llm.module.ts` — LlmModule import`
- ``server/src/llm/llm.service.ts` — LlmService.evaluate() 메서드`
- ``server/src/submissions/submissions.module.ts` — SubmissionsModule import (Service + Repository export됨)`
- ``server/src/submissions/submissions.repository.ts` — findOneByIdAndUser(), updateStatus() 메서드, Submission 인터페이스`
- ``server/src/submissions/submissions.service.ts` — submit 비즈니스 로직 참고`
- ``server/src/database/database.service.ts` — DatabaseService.withTransaction() 메서드`
- ``server/src/common/guards/user-id.guard.ts` — UserIdGuard`
- ``server/src/common/decorators/user-id.decorator.ts` — @UserId() 데코레이터`
- ``server/src/common/interfaces/paginated.interface.ts` — PaginatedResponse<T>`
- ``migrations/004_create_evaluations.sql` — evaluations 테이블 스키마`
- ``migrations/005_add_evaluated_status.sql` — evaluated 상태 추가`
- ``server/src/app.module.ts` — 모듈 등록 대상`

## Expected Output

- ``server/src/evaluations/evaluations.module.ts` — EvaluationsModule 정의`
- ``server/src/evaluations/evaluations.controller.ts` — POST /submissions/:id/evaluate + GET /evaluations/:submissionId`
- ``server/src/evaluations/evaluations.service.ts` — 평가 orchestration (LLM 호출 + DB 저장 + 상태 전환)`
- ``server/src/evaluations/evaluations.repository.ts` — evaluations 테이블 Raw SQL`
- ``server/src/app.module.ts` — LlmModule + EvaluationsModule 등록`

## Verification

docker compose up -d --build && sleep 10 && curl -s http://localhost:3100/health | grep -q 'ok' && echo '서버 정상' && curl -s -X POST http://localhost:3100/submissions -H 'X-User-Id: test-user-s03' -H 'Content-Type: application/json' -d '{"prompt_id":1,"content":"오늘은 날씨가 좋아서 공원에 산책을 갔다. 봄꽃이 피어있어서 기분이 좋았다. 새들이 노래하는 소리를 들으며 걸었다."}' | grep -q 'draft' && echo '답안 생성 확인' && export SUB_ID=$(curl -s -X POST http://localhost:3100/submissions -H 'X-User-Id: test-user-s03' -H 'Content-Type: application/json' -d '{"prompt_id":2,"content":"오늘 하루는 정말 바빴다. 아침에 일찍 일어나 운동을 하고, 점심에는 친구를 만났다."}' | python3 -c 'import sys,json; print(json.load(sys.stdin)["data"]["id"])') && curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID/submit -H 'X-User-Id: test-user-s03' | grep -q 'submitted' && echo '제출 확인' && curl -s -X POST http://localhost:3100/submissions/$SUB_ID/evaluate -H 'X-User-Id: test-user-s03' | grep -q 'grammar_score' && echo '평가 성공'
