---
id: T01
parent: S01
milestone: M003
provides: []
requires: []
affects: []
key_files: ["mobile/app/(tabs)/_layout.tsx", "mobile/app/_layout.tsx"]
key_decisions: ["headerBackTitle 대신 headerBackButtonDisplayMode: 'minimal'로 교체 — iOS/Android 일관성 확보"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd mobile && npx tsc --noEmit (타입 에러 없음), grep으로 tabBarIcon 및 headerBackButtonDisplayMode 존재 확인 — 모두 통과"
completed_at: 2026-04-01T06:35:56.570Z
blocker_discovered: false
---

# T01: expo-symbols SymbolView로 탭 아이콘 추가, Stack 헤더 뒤로가기를 minimal 모드로 정비

> expo-symbols SymbolView로 탭 아이콘 추가, Stack 헤더 뒤로가기를 minimal 모드로 정비

## What Happened
---
id: T01
parent: S01
milestone: M003
key_files:
  - mobile/app/(tabs)/_layout.tsx
  - mobile/app/_layout.tsx
key_decisions:
  - headerBackTitle 대신 headerBackButtonDisplayMode: 'minimal'로 교체 — iOS/Android 일관성 확보
duration: ""
verification_result: passed
completed_at: 2026-04-01T06:35:56.570Z
blocker_discovered: false
---

# T01: expo-symbols SymbolView로 탭 아이콘 추가, Stack 헤더 뒤로가기를 minimal 모드로 정비

**expo-symbols SymbolView로 탭 아이콘 추가, Stack 헤더 뒤로가기를 minimal 모드로 정비**

## What Happened

mobile/app/(tabs)/_layout.tsx에 expo-symbols SymbolView를 임포트하고 index 탭(list.bullet/format_list_bulleted)과 history 탭(clock.arrow.circlepath/history)에 tabBarIcon을 추가했다. 활성 탭은 weight semibold, 비활성은 regular로 설정. mobile/app/_layout.tsx의 세 Stack.Screen에서 headerBackTitle을 제거하고 headerBackButtonDisplayMode: 'minimal'로 교체해 텍스트 없는 화살표 뒤로가기를 구현했다.

## Verification

cd mobile && npx tsc --noEmit (타입 에러 없음), grep으로 tabBarIcon 및 headerBackButtonDisplayMode 존재 확인 — 모두 통과

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 2700ms |
| 2 | `grep -q 'tabBarIcon' app/(tabs)/_layout.tsx` | 0 | ✅ pass | 50ms |
| 3 | `grep -q 'headerBackButtonDisplayMode' app/_layout.tsx` | 0 | ✅ pass | 50ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/(tabs)/_layout.tsx`
- `mobile/app/_layout.tsx`


## Deviations
None.

## Known Issues
None.
