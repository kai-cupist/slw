---
id: T01
parent: S04
milestone: M003
provides: []
requires: []
affects: []
key_files: ["mobile/lib/theme.ts", "mobile/components/Badge.tsx", "mobile/components/ScoreBar.tsx", "mobile/components/LoadingView.tsx", "mobile/components/ErrorView.tsx"]
key_decisions: ["ScoreBar의 barFill width %는 인라인 style로만 적용 (StyleSheet.create 내 % 문자열 금지 — 기존 코드 패턴 유지)", "difficulty 색상 맵을 theme.ts colors.difficulty에 통합하여 단일 소스 유지"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "파일 5개 존재 확인(exit 0) 후 cd mobile && npx tsc --noEmit 실행 — 에러 0건, exit 0."
completed_at: 2026-04-01T07:00:01.910Z
blocker_discovered: false
---

# T01: theme.ts와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 T02–T04 화면 교체의 기반 확보

> theme.ts와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 T02–T04 화면 교체의 기반 확보

## What Happened
---
id: T01
parent: S04
milestone: M003
key_files:
  - mobile/lib/theme.ts
  - mobile/components/Badge.tsx
  - mobile/components/ScoreBar.tsx
  - mobile/components/LoadingView.tsx
  - mobile/components/ErrorView.tsx
key_decisions:
  - ScoreBar의 barFill width %는 인라인 style로만 적용 (StyleSheet.create 내 % 문자열 금지 — 기존 코드 패턴 유지)
  - difficulty 색상 맵을 theme.ts colors.difficulty에 통합하여 단일 소스 유지
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:00:01.910Z
blocker_discovered: false
---

# T01: theme.ts와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 T02–T04 화면 교체의 기반 확보

**theme.ts와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 T02–T04 화면 교체의 기반 확보**

## What Happened

mobile/lib/theme.ts를 생성하여 앱 전체 색상 토큰, 간격, 반경, 그림자, scoreColor 함수를 정의했다. mobile/components/ 디렉토리를 신규 생성하고 Badge(DifficultyBadge/CategoryBadge), ScoreBar(normal/mini), LoadingView, ErrorView 4개 컴포넌트를 작성했다. ScoreBar의 width %는 인라인 style로만 적용하여 기존 evaluation 화면 코드 패턴과 일치시켰다.

## Verification

파일 5개 존재 확인(exit 0) 후 cd mobile && npx tsc --noEmit 실행 — 에러 0건, exit 0.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f mobile/lib/theme.ts && test -f mobile/components/Badge.tsx && test -f mobile/components/ScoreBar.tsx && test -f mobile/components/LoadingView.tsx && test -f mobile/components/ErrorView.tsx` | 0 | ✅ pass | 2900ms |
| 2 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 6300ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/lib/theme.ts`
- `mobile/components/Badge.tsx`
- `mobile/components/ScoreBar.tsx`
- `mobile/components/LoadingView.tsx`
- `mobile/components/ErrorView.tsx`


## Deviations
None.

## Known Issues
None.
