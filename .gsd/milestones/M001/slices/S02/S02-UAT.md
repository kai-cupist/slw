# S02: Prompts Submissions — UAT

**Milestone:** M001
**Written:** 2026-03-31T03:13:41.373Z

# S02: Prompts Submissions — UAT

**Milestone:** M001
**Written:** 2026-03-31

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: DB 스키마, 시드 데이터, 8개 REST API 엔드포인트의 동작을 실제 HTTP 요청으로 검증해야 한다.

## Preconditions

- Docker Desktop 실행 중
- `docker compose up --build` 로 PostgreSQL + NestJS 앱 기동
- 마이그레이션 자동 실행되어 prompts/submissions 테이블 + 30개 시드 데이터 적재 완료
- API가 http://localhost:3100 에서 응답

## Smoke Test

```bash
curl -s http://localhost:3100/prompts | python3 -c "import sys,json; d=json.load(sys.stdin); assert d['success'] and d['data']['total']==30, 'FAIL'; print('PASS: 30개 주제 확인')"
```

## Test Cases

### 1. 쓰기 주제 목록 조회 (페이지네이션)

1. `curl -s "http://localhost:3100/prompts?page=1&limit=5"` 실행
2. **Expected:** `success: true`, `data.items` 배열 5개, `data.total` = 30, `data.totalPages` = 6

### 2. 쓰기 주제 필터링 (카테고리 + 난이도)

1. `curl -s "http://localhost:3100/prompts?category=일기&difficulty=beginner"` 실행
2. **Expected:** `success: true`, `data.items` 배열 2개 (일기+beginner 시드 데이터), 모든 항목의 category="일기", difficulty="beginner"

### 3. 쓰기 주제 상세 조회

1. `curl -s http://localhost:3100/prompts/1` 실행
2. **Expected:** `success: true`, `data.id` = 1, `data.title` / `data.description` / `data.category` / `data.difficulty` 모두 존재

### 4. 존재하지 않는 주제 조회

1. `curl -s http://localhost:3100/prompts/999` 실행
2. **Expected:** `success: false`, `error.code` = "NOT_FOUND"

### 5. 답안 생성 → 수정 → 제출 전체 흐름

1. `curl -s -X POST http://localhost:3100/submissions -H "Content-Type: application/json" -H "X-User-Id: uat-user" -d '{"prompt_id": 1, "content": "초기 내용"}'` 실행
2. **Expected:** `success: true`, `data.status` = "draft", `data.content` = "초기 내용"
3. 반환된 `data.id`를 `SUB_ID`에 저장
4. `curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID -H "Content-Type: application/json" -H "X-User-Id: uat-user" -d '{"content": "수정된 내용"}'` 실행
5. **Expected:** `data.content` = "수정된 내용", `data.status` = "draft"
6. `curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID/submit -H "X-User-Id: uat-user"` 실행
7. **Expected:** `data.status` = "submitted"

### 6. 제출된 답안 수정 불가

1. 위 테스트 5에서 제출된 `SUB_ID` 사용
2. `curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID -H "Content-Type: application/json" -H "X-User-Id: uat-user" -d '{"content": "수정 시도"}'` 실행
3. **Expected:** `success: false`, `error.code` = "BAD_REQUEST", message에 "이미 제출된 답안" 포함

### 7. 답안 삭제 (soft delete)

1. `curl -s -X DELETE http://localhost:3100/submissions/$SUB_ID -H "X-User-Id: uat-user"` 실행
2. **Expected:** `success: true`, `data.deleted` = true
3. `curl -s http://localhost:3100/submissions/$SUB_ID -H "X-User-Id: uat-user"` 실행
4. **Expected:** `success: false`, `error.code` = "NOT_FOUND"

### 8. 답안 목록 조회 (주제 정보 포함)

1. 새 답안 생성 후 `curl -s http://localhost:3100/submissions -H "X-User-Id: uat-user"` 실행
2. **Expected:** `data.items[].prompt_title`, `data.items[].prompt_category`, `data.items[].prompt_difficulty` 필드 존재

## Edge Cases

### X-User-Id 헤더 누락

1. `curl -s -X POST http://localhost:3100/submissions -H "Content-Type: application/json" -d '{"prompt_id": 1}'` 실행
2. **Expected:** `success: false`, `error.code` = "BAD_REQUEST", message에 "X-User-Id" 포함

### 유효하지 않은 prompt_id

1. `curl -s -X POST http://localhost:3100/submissions -H "Content-Type: application/json" -H "X-User-Id: uat-user" -d '{"prompt_id": 9999}'` 실행
2. **Expected:** `success: false`, `error.code` = "BAD_REQUEST", message에 "유효하지 않은 주제" 포함

### 빈 내용으로 제출 시도

1. 빈 content로 draft 생성: `curl -s -X POST http://localhost:3100/submissions -H "Content-Type: application/json" -H "X-User-Id: uat-user" -d '{"prompt_id": 1}'`
2. 바로 제출 시도: `curl -s -X PATCH http://localhost:3100/submissions/$SUB_ID/submit -H "X-User-Id: uat-user"`
3. **Expected:** `success: false`, message에 "비어있는 답안" 포함

### 다른 사용자의 답안 접근

1. user-A로 답안 생성 후, user-B로 해당 답안 조회
2. **Expected:** `success: false`, `error.code` = "NOT_FOUND" (소유권 격리)

### content 5000자 초과

1. 5001자 content로 답안 생성 시도
2. **Expected:** `success: false`, validation 에러

## Failure Signals

- 마이그레이션 실패 → prompts 테이블 없음 → GET /prompts 500 에러
- 시드 데이터 누락 → total=0
- UserIdGuard 미적용 → X-User-Id 없이 submissions 접근 가능
- soft delete 미작동 → 삭제된 답안이 목록에 계속 노출

## Not Proven By This UAT

- AI 평가 연동 (S03에서 구현)
- 동시성 처리 (같은 답안에 동시 수정 요청)
- 대량 데이터 성능 (수천 건 이상)
- 실제 모바일 앱에서의 API 호출 (S04에서 구현)

## Notes for Tester

- API 포트는 docker-compose 설정에 따라 3100번이다 (호스트 포트).
- 한국어 카테고리 필터 테스트 시 URL 인코딩에 주의한다 (curl은 자동 인코딩하지 않으므로 `%EC%9D%BC%EA%B8%B0` 등으로 전달하거나 `--data-urlencode` 사용).
- X-User-Id는 아무 문자열이나 사용 가능하다 (인증 없음).
