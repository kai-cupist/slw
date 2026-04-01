---
id: T03
parent: S01
milestone: M004
provides: []
requires: []
affects: []
key_files: ["mobile/app/_layout.tsx", "mobile/app/(tabs)/_layout.tsx"]
key_decisions: ["headerStyle에 shadow.bar를 StyleSheet 스타일 객체로 병합 — expo-router Stack의 headerStyle은 배열을 지원하지 않으므로 StyleSheet 내에서 스프레드로 적용", "탭바 높이를 iOS 84px, Android 60px으로 플랫폼별 분기 — iOS safe area 고려", "AppTheme에 notification 토큰 추가 — React Navigation 테마 스펙 완성"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd mobile && npx tsc --noEmit — exit 0, 출력 없음"
completed_at: 2026-04-01T07:37:33.593Z
blocker_discovered: false
---

# T03: _layout.tsx와 (tabs)/_layout.tsx에 shadow.bar 헤더, 탭바 높이 정제, 스플래시 색상 토큰화 적용

> _layout.tsx와 (tabs)/_layout.tsx에 shadow.bar 헤더, 탭바 높이 정제, 스플래시 색상 토큰화 적용

## What Happened
---
id: T03
parent: S01
milestone: M004
key_files:
  - mobile/app/_layout.tsx
  - mobile/app/(tabs)/_layout.tsx
key_decisions:
  - headerStyle에 shadow.bar를 StyleSheet 스타일 객체로 병합 — expo-router Stack의 headerStyle은 배열을 지원하지 않으므로 StyleSheet 내에서 스프레드로 적용
  - 탭바 높이를 iOS 84px, Android 60px으로 플랫폼별 분기 — iOS safe area 고려
  - AppTheme에 notification 토큰 추가 — React Navigation 테마 스펙 완성
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:37:33.594Z
blocker_discovered: false
---

# T03: _layout.tsx와 (tabs)/_layout.tsx에 shadow.bar 헤더, 탭바 높이 정제, 스플래시 색상 토큰화 적용

**_layout.tsx와 (tabs)/_layout.tsx에 shadow.bar 헤더, 탭바 높이 정제, 스플래시 색상 토큰화 적용**

## What Happened

두 레이아웃 파일 모두 이미 T01 Indigo 테마를 참조하고 있었으나 세부 정제가 필요했다. _layout.tsx에서 미사용 Image import 제거, shadow 토큰 import 추가, AppTheme notification 토큰 완성, 헤더에 shadow.bar 적용, 스플래시 하드코딩 색상 2곳을 테마 토큰으로 교체했다. (tabs)/_layout.tsx에서 spacing import 추가, 탭바에 플랫폼별 높이(iOS 84px/Android 60px)와 패딩 추가, 헤더에 shadow.bar 적용했다. expo-router headerStyle은 배열을 지원하지 않으므로 StyleSheet 내 스프레드 패턴을 확립했다.

## Verification

cd mobile && npx tsc --noEmit — exit 0, 출력 없음

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 2400ms |


## Deviations

없음.

## Known Issues

없음.

## Files Created/Modified

- `mobile/app/_layout.tsx`
- `mobile/app/(tabs)/_layout.tsx`


## Deviations
없음.

## Known Issues
없음.
