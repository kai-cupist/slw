---
id: S01
parent: M003
milestone: M003
provides:
  - 탭 바 아이콘(index/history)
  - Stack 헤더 minimal 뒤로가기(prompts/write/evaluation)
requires:
  []
affects:
  - S02
  - S03
  - S04
key_files:
  - mobile/app/(tabs)/_layout.tsx
  - mobile/app/_layout.tsx
key_decisions:
  - headerBackTitle 대신 headerBackButtonDisplayMode: 'minimal'로 교체 — iOS/Android 일관성 확보
  - SymbolView name prop에 플랫폼별 아이콘명을 객체로 전달 — 크로스플랫폼 대응
patterns_established:
  - expo-symbols SymbolView는 name에 { ios, android, web } 객체를 전달해 플랫폼별 아이콘을 선언적으로 지정한다
  - tabBarIcon에서 focused prop으로 weight(semibold/regular)를 전환해 선택 상태를 표현한다
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M003/slices/S01/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T06:37:10.570Z
blocker_discovered: false
---

# S01: 네비게이션 UI 개선 (탭 아이콘·뒤로가기)

**expo-symbols SymbolView로 탭 아이콘을 추가하고, Stack 헤더 뒤로가기를 minimal 모드로 정비해 네비게이션 UI를 완성했다.**

## What Happened

T01 단일 태스크로 구성된 간단한 슬라이스였다. mobile/app/(tabs)/_layout.tsx에 expo-symbols SymbolView를 import하고 index 탭(list.bullet/format_list_bulleted)과 history 탭(clock.arrow.circlepath/history)에 tabBarIcon을 추가했다. 활성 탭은 weight semibold, 비활성은 regular로 설정해 포커스 상태를 시각적으로 구분한다. mobile/app/_layout.tsx의 세 Stack.Screen(prompts/[id], write/index, evaluation/[submissionId])에서 기존 headerBackTitle을 제거하고 headerBackButtonDisplayMode: 'minimal'로 교체해 iOS/Android 모두에서 텍스트 없는 화살표 뒤로가기를 구현했다.

## Verification

cd mobile && npx tsc --noEmit → exit 0. grep으로 tabBarIcon in app/(tabs)/_layout.tsx → 존재 확인. grep으로 headerBackButtonDisplayMode in app/_layout.tsx → 존재 확인. 모두 통과.

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

expo-symbols의 SymbolView는 iOS에서 SF Symbols, Android/web에서 Material Icons를 사용한다. 플랫폼별 아이콘 형태가 다를 수 있으나 이는 의도된 동작이다.

## Follow-ups

None.

## Files Created/Modified

- `mobile/app/(tabs)/_layout.tsx` — expo-symbols SymbolView import 추가, index/history 탭에 tabBarIcon 구현
- `mobile/app/_layout.tsx` — 세 Stack.Screen에 headerBackButtonDisplayMode: 'minimal' 추가, headerBackTitle 제거
