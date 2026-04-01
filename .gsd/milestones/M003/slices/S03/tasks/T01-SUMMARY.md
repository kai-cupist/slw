---
id: T01
parent: S03
milestone: M003
provides: []
requires: []
affects: []
key_files: ["mobile/app/_layout.tsx", "mobile/lib/hooks/mutations.ts", "mobile/app/(tabs)/history.tsx"]
key_decisions: ["renderRightActions를 item 클로저를 받는 고차 함수로 정의하여 useCallback 내에서 item별 삭제 핸들러를 생성했다", "GestureHandlerRootView는 QueryClientProvider 바깥 최상위에 배치했다"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npx tsc --noEmit 통과(exit 0). GestureHandlerRootView, useDeleteSubmission, ReanimatedSwipeable grep 확인 모두 통과."
completed_at: 2026-04-01T06:49:47.702Z
blocker_discovered: false
---

# T01: GestureHandlerRootView 래핑, useDeleteSubmission hook, ReanimatedSwipeable 스와이프 삭제 UI를 세 파일에 구현했다

> GestureHandlerRootView 래핑, useDeleteSubmission hook, ReanimatedSwipeable 스와이프 삭제 UI를 세 파일에 구현했다

## What Happened
---
id: T01
parent: S03
milestone: M003
key_files:
  - mobile/app/_layout.tsx
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/history.tsx
key_decisions:
  - renderRightActions를 item 클로저를 받는 고차 함수로 정의하여 useCallback 내에서 item별 삭제 핸들러를 생성했다
  - GestureHandlerRootView는 QueryClientProvider 바깥 최상위에 배치했다
duration: ""
verification_result: passed
completed_at: 2026-04-01T06:49:47.703Z
blocker_discovered: false
---

# T01: GestureHandlerRootView 래핑, useDeleteSubmission hook, ReanimatedSwipeable 스와이프 삭제 UI를 세 파일에 구현했다

**GestureHandlerRootView 래핑, useDeleteSubmission hook, ReanimatedSwipeable 스와이프 삭제 UI를 세 파일에 구현했다**

## What Happened

_layout.tsx에 GestureHandlerRootView를 추가해 QueryClientProvider 바깥에서 앱 전체를 감쌌다. mutations.ts에 useDeleteSubmission을 추가해 DELETE /submissions/:id를 호출하고 성공 시 evaluationHistory와 scoreTrend를 invalidate한다. history.tsx에 ReanimatedSwipeable과 Alert를 import하고, renderRightActions 고차 함수로 item별 빨간 삭제 버튼을 구현했다. 삭제 확인 Alert 후 deleteMutation.mutate를 호출한다.

## Verification

npx tsc --noEmit 통과(exit 0). GestureHandlerRootView, useDeleteSubmission, ReanimatedSwipeable grep 확인 모두 통과.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 3100ms |
| 2 | `grep -q 'GestureHandlerRootView' app/_layout.tsx` | 0 | ✅ pass | 50ms |
| 3 | `grep -q 'useDeleteSubmission' lib/hooks/mutations.ts` | 0 | ✅ pass | 50ms |
| 4 | `grep -q 'ReanimatedSwipeable' 'app/(tabs)/history.tsx'` | 0 | ✅ pass | 50ms |


## Deviations

renderRightActions를 item 클로저를 받는 고차 함수로 구현했다. 태스크 플랜은 단순 함수로 기술했으나 renderItem useCallback 내에서 item별 핸들러 생성을 위해 이 패턴이 필요했다.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/_layout.tsx`
- `mobile/lib/hooks/mutations.ts`
- `mobile/app/(tabs)/history.tsx`


## Deviations
renderRightActions를 item 클로저를 받는 고차 함수로 구현했다. 태스크 플랜은 단순 함수로 기술했으나 renderItem useCallback 내에서 item별 핸들러 생성을 위해 이 패턴이 필요했다.

## Known Issues
None.
