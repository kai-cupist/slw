# S03: AI 평가 및 이력 — UAT

**Milestone:** M001
**Written:** 2026-03-31T03:42:35.689Z

# S03: AI 평가 및 이력 — UAT

**Milestone:** M001
**Written:** 2026-03-31

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: AI 평가는 실제 Groq LLM API 호출이 필요하고, DB 상태 전환과 데이터 저장을 런타임에서 검증해야 한다.

## Preconditions

1. Docker Compose가 실행 중이어야 한다 (`docker compose up -d`)
2. PostgreSQL이 healthy 상태이고 마이그레이션 004, 005가 적용되어 있어야 한다
3. NestJS 서버가 http://localhost:3100 에서 응답해야 한다
4. `.env`에 유효한 GROQ_API_KEY가 설정되어 있어야 한다
5. prompts 테이블에 시드 데이터가 있어야 한다

## Smoke Test

```bash
curl -s http://localhost:3100/health | grep -q '"status":"ok"' && echo 'PASS' || echo 'FAIL'
```

## Test Cases

### 1. 답안 제출 후 AI 평가 수행

1. 새 답안 생성: `curl -s -X POST http://localhost:3100/submissions -H 'X-User-Id: uat-user' -H 'Content-Type: application/json' -d '{"prompt_id":1,"content":"오늘은 날씨가 좋아서 공원에 산책을 갔다."}'`
2. 답안 ID를 추출한다 (응답의 data.id)
3. 답안 제출: `curl -s -X PATCH http://localhost:3100/submissions/{id}/submit -H 'X-User-Id: uat-user'`
4. AI 평가 요청: `curl -s -X POST http://localhost:3100/submissions/{id}/evaluate -H 'X-User-Id: uat-user'`
5. **Expected:** 응답에 grammar_score, logic_score, expression_score, relevance_score (각 1~10), total_score, feedback 필드가 포함된다. submission의 status가 'evaluated'로 변경된다.

### 2. 평가 결과 단건 조회

1. 위에서 평가된 submission_id로 조회: `curl -s http://localhost:3100/evaluations/{submissionId} -H 'X-User-Id: uat-user'`
2. **Expected:** grammar_score, logic_score, expression_score, relevance_score, total_score, feedback, raw_response가 모두 포함된 평가 결과가 반환된다.

### 3. 평가 이력 목록 조회

1. `curl -s http://localhost:3100/evaluations/history -H 'X-User-Id: uat-user'`
2. **Expected:** `{ success: true, data: { items: [...], total, page, limit, totalPages } }` 형태. items 각 항목에 prompt_title, prompt_category, prompt_difficulty, 4항목 점수, total_score, evaluated_at이 포함된다.

### 4. 점수 추이 조회

1. `curl -s http://localhost:3100/evaluations/scores/trend -H 'X-User-Id: uat-user'`
2. **Expected:** `{ success: true, data: [...] }` 형태. 각 항목에 evaluated_at, total_score, grammar_score, logic_score, expression_score, relevance_score가 포함된다. 시간순(오래된 것 먼저) 정렬.

### 5. 점수 추이 limit 파라미터

1. `curl -s 'http://localhost:3100/evaluations/scores/trend?limit=5' -H 'X-User-Id: uat-user'`
2. **Expected:** 최근 5건 이하의 점수 추이가 반환된다.

## Edge Cases

### draft 상태 답안 평가 시도

1. draft 상태 답안 생성 후 제출하지 않고 바로 평가 요청: `curl -s -X POST http://localhost:3100/submissions/{draft_id}/evaluate -H 'X-User-Id: uat-user'`
2. **Expected:** 400 Bad Request, 에러 메시지에 submitted 상태만 평가 가능하다는 안내

### 중복 평가 요청 (멱등성)

1. 이미 evaluated된 답안에 대해 다시 평가 요청: `curl -s -X POST http://localhost:3100/submissions/{evaluated_id}/evaluate -H 'X-User-Id: uat-user'`
2. **Expected:** 에러가 아닌 기존 평가 결과가 반환된다 (LLM API 재호출 없이)

### 존재하지 않는 답안 평가 시도

1. `curl -s -X POST http://localhost:3100/submissions/99999/evaluate -H 'X-User-Id: uat-user'`
2. **Expected:** 404 Not Found

### 다른 사용자의 답안 평가 시도

1. user-A가 생성한 답안을 user-B가 평가 요청
2. **Expected:** 404 Not Found (소유자가 아닌 답안은 조회 불가)

### 평가 결과 없는 submission 조회

1. submitted 상태이나 아직 평가되지 않은 답안의 평가 결과 조회
2. **Expected:** 404 Not Found

## Failure Signals

- POST /submissions/:id/evaluate 호출 시 502 Bad Gateway → Groq API 장애 또는 API 키 무효
- POST /submissions/:id/evaluate 호출 시 504 Gateway Timeout → LLM 응답 지연
- GET /evaluations/history에서 items가 빈 배열인데 평가 기록이 있어야 하는 경우 → JOIN 쿼리 또는 user_id 필터 문제
- total_score가 4항목 평균과 일치하지 않는 경우 → 서버 계산 로직 오류

## Not Proven By This UAT

- Groq API 무료 티어 한도 초과 시 폴백 동작 (폴백 API 미구현)
- 대량 동시 평가 요청 시 성능 (부하 테스트 미포함)
- 프론트엔드(Expo 앱)에서의 사용자 경험 (S04에서 검증)

## Notes for Tester

- Groq API 호출에 실제 API 키가 필요하므로 .env에 GROQ_API_KEY가 설정되어야 한다
- LLM 응답 시간은 수초가 걸릴 수 있으므로 평가 요청 후 충분히 대기할 것
- 무료 티어 RPM(30)/RPD(1,000) 한도가 있으므로 반복 테스트 시 주의
