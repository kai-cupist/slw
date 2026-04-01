---
id: T01
parent: S03
milestone: M002
provides: []
requires: []
affects: []
key_files: ["mobile/lib/hooks/mutations.ts", "mobile/app/(tabs)/index.tsx", "mobile/app/(tabs)/history.tsx"]
key_decisions: ["useEvaluate onSuccess에서 evaluationHistory·scoreTrend 두 캐시를 invalidate해 평가 후 자동 갱신", "HistoryScreen에서 useScoreTrend를 별도 호출해 refetchTrend 확보, handleRefresh로 묶음"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run typecheck exit 0, grep으로 refreshing/onRefresh/invalidateQueries 삽입 확인."
completed_at: 2026-04-01T05:02:55.259Z
blocker_discovered: false
---

# T01: pull-to-refresh(index·history)와 평가 후 이력·트렌드 캐시 자동 갱신 연결

> pull-to-refresh(index·history)와 평가 후 이력·트렌드 캐시 자동 갱신 연결

## What Happened
---
id: T01
parent: S03
milestone: M002
key_files:
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
key_decisions:
  - useEvaluate onSuccess에서 evaluationHistory·scoreTrend 두 캐시를 invalidate해 평가 후 자동 갱신
  - HistoryScreen에서 useScoreTrend를 별도 호출해 refetchTrend 확보, handleRefresh로 묶음
duration: ""
verification_result: passed
completed_at: 2026-04-01T05:02:55.260Z
blocker_discovered: false
---

# T01: pull-to-refresh(index·history)와 평가 후 이력·트렌드 캐시 자동 갱신 연결

**pull-to-refresh(index·history)와 평가 후 이력·트렌드 캐시 자동 갱신 연결**

## What Happened

mutations.ts의 useEvaluate에 queryClient + onSuccess(invalidateQueries) 추가. index.tsx FlatList에 refreshing/onRefresh 연결. history.tsx에 handleRefresh(refetch + refetchTrend) 추가 후 FlatList에 연결. TrendSection 내부 수정 없음.

## Verification

npm run typecheck exit 0, grep으로 refreshing/onRefresh/invalidateQueries 삽입 확인.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npm run typecheck` | 0 | ✅ pass | 2400ms |
| 2 | `grep -n 'refreshing\|onRefresh' app/(tabs)/index.tsx app/(tabs)/history.tsx` | 0 | ✅ pass | 50ms |
| 3 | `grep -n 'invalidateQueries.*evaluationHistory\|invalidateQueries.*scoreTrend' lib/hooks/mutations.ts` | 0 | ✅ pass | 50ms |


## Deviations

mutations.ts에 useQueryClient import가 이미 존재해 import 수정 불필요했음.

## Known Issues

None.

## Files Created/Modified

- `mobile/lib/hooks/mutations.ts`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/history.tsx`


## Deviations
mutations.ts에 useQueryClient import가 이미 존재해 import 수정 불필요했음.

## Known Issues
None.
