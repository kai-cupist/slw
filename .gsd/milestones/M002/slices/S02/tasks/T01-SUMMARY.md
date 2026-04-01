---
id: T01
parent: S02
milestone: M002
provides: []
requires: []
affects: []
key_files: ["server/src/submissions/dto/get-submissions.dto.ts", "server/src/submissions/submissions.repository.ts", "server/src/submissions/submissions.service.ts"]
key_decisions: ["promptId 필터는 기존 status 필터와 동일한 paramIndex 카운터 패턴으로 동적 WHERE 절에 append"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd server && npm run build — 타입 에러 없이 빌드 성공 (2.7s, exit 0)"
completed_at: 2026-04-01T04:55:09.325Z
blocker_discovered: false
---

# T01: GetSubmissionsDto에 promptId 쿼리 파라미터를 추가하고 Repository/Service까지 연결하여 GET /submissions?promptId={n} 필터 완성

> GetSubmissionsDto에 promptId 쿼리 파라미터를 추가하고 Repository/Service까지 연결하여 GET /submissions?promptId={n} 필터 완성

## What Happened
---
id: T01
parent: S02
milestone: M002
key_files:
  - server/src/submissions/dto/get-submissions.dto.ts
  - server/src/submissions/submissions.repository.ts
  - server/src/submissions/submissions.service.ts
key_decisions:
  - promptId 필터는 기존 status 필터와 동일한 paramIndex 카운터 패턴으로 동적 WHERE 절에 append
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:55:09.325Z
blocker_discovered: false
---

# T01: GetSubmissionsDto에 promptId 쿼리 파라미터를 추가하고 Repository/Service까지 연결하여 GET /submissions?promptId={n} 필터 완성

**GetSubmissionsDto에 promptId 쿼리 파라미터를 추가하고 Repository/Service까지 연결하여 GET /submissions?promptId={n} 필터 완성**

## What Happened

GetSubmissionsDto에 @Type(() => Number) + @IsInt() 데코레이터로 promptId?: number 필드를 추가했다. SubmissionsRepository.findAllByUser의 filters 타입에 promptId?: number를 추가하고, 기존 paramIndex 카운터 패턴으로 동적 WHERE 절에 s.prompt_id = $N 조건을 append했다. SubmissionsService.findAll에서 findAllByUser 호출 시 promptId: dto.promptId를 전달하도록 수정했다.

## Verification

cd server && npm run build — 타입 에러 없이 빌드 성공 (2.7s, exit 0)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd server && npm run build 2>&1 | tail -10 && echo 'BUILD OK'` | 0 | ✅ pass | 2700ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/submissions/submissions.repository.ts`
- `server/src/submissions/submissions.service.ts`


## Deviations
None.

## Known Issues
None.
