---
id: T03
parent: S03
milestone: M001
provides: []
requires: []
affects: []
key_files: ["server/src/evaluations/dto/get-evaluation-history.dto.ts", "server/src/evaluations/dto/get-score-trend.dto.ts", "server/src/evaluations/evaluations.repository.ts", "server/src/evaluations/evaluations.service.ts", "server/src/evaluations/evaluations.controller.ts"]
key_decisions: ["구체적 경로(/history, /scores/trend)를 파라미터 경로(/:submissionId)보다 먼저 선언하여 NestJS 라우트 충돌 방지", "점수 추이는 서브쿼리 DESC 후 외부 ASC 정렬로 시간순 반환"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "타입 체크(npx tsc --noEmit) 통과, GET /evaluations/history에서 items 배열 확인, GET /evaluations/scores/trend에서 success 확인, GET /evaluations/10에서 기존 단건 조회 라우트 충돌 없이 정상 동작 확인"
completed_at: 2026-03-31T03:38:38.244Z
blocker_discovered: false
---

# T03: GET /evaluations/history(페이지네이션 이력 조회)와 GET /evaluations/scores/trend(점수 추이) 엔드포인트 구현 및 전체 E2E 플로우 검증 완료

> GET /evaluations/history(페이지네이션 이력 조회)와 GET /evaluations/scores/trend(점수 추이) 엔드포인트 구현 및 전체 E2E 플로우 검증 완료

## What Happened
---
id: T03
parent: S03
milestone: M001
key_files:
  - server/src/evaluations/dto/get-evaluation-history.dto.ts
  - server/src/evaluations/dto/get-score-trend.dto.ts
  - server/src/evaluations/evaluations.repository.ts
  - server/src/evaluations/evaluations.service.ts
  - server/src/evaluations/evaluations.controller.ts
key_decisions:
  - 구체적 경로(/history, /scores/trend)를 파라미터 경로(/:submissionId)보다 먼저 선언하여 NestJS 라우트 충돌 방지
  - 점수 추이는 서브쿼리 DESC 후 외부 ASC 정렬로 시간순 반환
duration: ""
verification_result: passed
completed_at: 2026-03-31T03:38:38.245Z
blocker_discovered: false
---

# T03: GET /evaluations/history(페이지네이션 이력 조회)와 GET /evaluations/scores/trend(점수 추이) 엔드포인트 구현 및 전체 E2E 플로우 검증 완료

**GET /evaluations/history(페이지네이션 이력 조회)와 GET /evaluations/scores/trend(점수 추이) 엔드포인트 구현 및 전체 E2E 플로우 검증 완료**

## What Happened

HIST-01, HIST-02 요구사항을 구현했다. GetEvaluationHistoryDto(PaginationDto 상속)와 GetScoreTrendDto(limit 파라미터) DTO를 생성하고, Repository에 3테이블 JOIN 기반 findHistoryByUser()와 서브쿼리 정렬 기반 findScoreTrendByUser()를 추가했다. Service와 Controller에 대응하는 메서드/엔드포인트를 추가하면서, NestJS 라우트 충돌 방지를 위해 구체적 경로를 파라미터 경로보다 먼저 선언했다. Docker Compose 환경에서 답안 생성→제출→AI 평가→결과 조회→이력 목록→점수 추이 전체 E2E 플로우를 검증 완료.

## Verification

타입 체크(npx tsc --noEmit) 통과, GET /evaluations/history에서 items 배열 확인, GET /evaluations/scores/trend에서 success 확인, GET /evaluations/10에서 기존 단건 조회 라우트 충돌 없이 정상 동작 확인

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd server && npx tsc --noEmit` | 0 | ✅ pass | 3100ms |
| 2 | `curl -s .../evaluations/history | grep -q 'items'` | 0 | ✅ pass | 500ms |
| 3 | `curl -s .../evaluations/scores/trend | grep -q 'success'` | 0 | ✅ pass | 500ms |
| 4 | `curl -s .../evaluations/10 | grep -q 'grammar_score'` | 0 | ✅ pass | 500ms |


## Deviations

NestJS 라우트 충돌 방지를 위해 Controller 메서드 순서를 재배치함 (구체적 경로 먼저, 파라미터 경로 나중에)

## Known Issues

None.

## Files Created/Modified

- `server/src/evaluations/dto/get-evaluation-history.dto.ts`
- `server/src/evaluations/dto/get-score-trend.dto.ts`
- `server/src/evaluations/evaluations.repository.ts`
- `server/src/evaluations/evaluations.service.ts`
- `server/src/evaluations/evaluations.controller.ts`


## Deviations
NestJS 라우트 충돌 방지를 위해 Controller 메서드 순서를 재배치함 (구체적 경로 먼저, 파라미터 경로 나중에)

## Known Issues
None.
