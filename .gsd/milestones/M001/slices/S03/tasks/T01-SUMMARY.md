---
id: T01
parent: S03
milestone: M001
provides: []
requires: []
affects: []
key_files: ["migrations/004_create_evaluations.sql", "migrations/005_add_evaluated_status.sql", "server/src/llm/llm.module.ts", "server/src/llm/llm.service.ts", "server/src/submissions/submissions.module.ts", "server/package.json", ".env"]
key_decisions: ["total_score를 LLM 계산값 대신 서버에서 직접 계산하여 정확성 보장", "temperature 0.3으로 설정하여 평가 일관성 확보", "ConfigModule isGlobal 설정 활용으로 LlmModule에서 별도 import 불필요"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "태스크 검증 커맨드 실행: `cd server && npx tsc --noEmit` (타입 체크 통과), `grep -q 'groq-sdk' package.json` (설치 확인), `test -f ../migrations/004_create_evaluations.sql && test -f ../migrations/005_add_evaluated_status.sql` (마이그레이션 파일 존재 확인). 모두 exit code 0."
completed_at: 2026-03-31T03:27:19.791Z
blocker_discovered: false
---

# T01: evaluations 테이블 마이그레이션 SQL 2건, groq-sdk 설치, LlmModule/LlmService 구현, SubmissionsModule export 추가 완료

> evaluations 테이블 마이그레이션 SQL 2건, groq-sdk 설치, LlmModule/LlmService 구현, SubmissionsModule export 추가 완료

## What Happened
---
id: T01
parent: S03
milestone: M001
key_files:
  - migrations/004_create_evaluations.sql
  - migrations/005_add_evaluated_status.sql
  - server/src/llm/llm.module.ts
  - server/src/llm/llm.service.ts
  - server/src/submissions/submissions.module.ts
  - server/package.json
  - .env
key_decisions:
  - total_score를 LLM 계산값 대신 서버에서 직접 계산하여 정확성 보장
  - temperature 0.3으로 설정하여 평가 일관성 확보
  - ConfigModule isGlobal 설정 활용으로 LlmModule에서 별도 import 불필요
duration: ""
verification_result: passed
completed_at: 2026-03-31T03:27:19.792Z
blocker_discovered: false
---

# T01: evaluations 테이블 마이그레이션 SQL 2건, groq-sdk 설치, LlmModule/LlmService 구현, SubmissionsModule export 추가 완료

**evaluations 테이블 마이그레이션 SQL 2건, groq-sdk 설치, LlmModule/LlmService 구현, SubmissionsModule export 추가 완료**

## What Happened

S03 슬라이스의 기반 인프라를 마련했다. (1) evaluations 테이블 생성 마이그레이션(004)과 submissions CHECK constraint에 'evaluated' 추가 마이그레이션(005) 작성, (2) groq-sdk 설치, (3) Groq SDK를 래핑하는 LlmModule/LlmService 구현 — JSON Object Mode + 프롬프트 내 스키마 명시 + 응답 수동 검증 + JSON 파싱 실패 시 1회 재시도, (4) SubmissionsModule에서 SubmissionsService와 SubmissionsRepository export 추가.

## Verification

태스크 검증 커맨드 실행: `cd server && npx tsc --noEmit` (타입 체크 통과), `grep -q 'groq-sdk' package.json` (설치 확인), `test -f ../migrations/004_create_evaluations.sql && test -f ../migrations/005_add_evaluated_status.sql` (마이그레이션 파일 존재 확인). 모두 exit code 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd server && npx tsc --noEmit` | 0 | ✅ pass | 3000ms |
| 2 | `grep -q 'groq-sdk' server/package.json` | 0 | ✅ pass | 50ms |
| 3 | `test -f migrations/004_create_evaluations.sql && test -f migrations/005_add_evaluated_status.sql` | 0 | ✅ pass | 50ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `migrations/004_create_evaluations.sql`
- `migrations/005_add_evaluated_status.sql`
- `server/src/llm/llm.module.ts`
- `server/src/llm/llm.service.ts`
- `server/src/submissions/submissions.module.ts`
- `server/package.json`
- `.env`


## Deviations
None.

## Known Issues
None.
