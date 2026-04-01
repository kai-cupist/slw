---
id: T02
parent: S04
milestone: M003
provides: []
requires: []
affects: []
key_files: ["mobile/app/(tabs)/index.tsx", "mobile/app/prompts/[id].tsx"]
key_decisions: ["prompts/[id].tsx 에러 분기는 ErrorView에 onRetry 없이 적용 — 재시도 버튼 불필요한 맥락"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd mobile && npx tsc --noEmit — 에러 0건, exit 0. rg 'DIFFICULTY_COLORS' 두 파일 모두 매칭 없음 확인."
completed_at: 2026-04-01T07:01:49.602Z
blocker_discovered: false
---

# T02: index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS·badge 코드를 공통 Badge/LoadingView/ErrorView 컴포넌트로 교체했다

> index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS·badge 코드를 공통 Badge/LoadingView/ErrorView 컴포넌트로 교체했다

## What Happened
---
id: T02
parent: S04
milestone: M003
key_files:
  - mobile/app/(tabs)/index.tsx
  - mobile/app/prompts/[id].tsx
key_decisions:
  - prompts/[id].tsx 에러 분기는 ErrorView에 onRetry 없이 적용 — 재시도 버튼 불필요한 맥락
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:01:49.603Z
blocker_discovered: false
---

# T02: index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS·badge 코드를 공통 Badge/LoadingView/ErrorView 컴포넌트로 교체했다

**index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS·badge 코드를 공통 Badge/LoadingView/ErrorView 컴포넌트로 교체했다**

## What Happened

mobile/app/(tabs)/index.tsx에서 상단 DIFFICULTY_COLORS 상수와 DifficultyBadge/CategoryBadge 인라인 함수를 제거하고 공통 컴포넌트를 import했다. 로딩/에러 분기를 LoadingView/ErrorView로 교체하고 관련 StyleSheet 항목(center, loadingText, errorText, retryButton, retryButtonText, badge, badgeText)을 정리했다. mobile/app/prompts/[id].tsx도 동일하게 DIFFICULTY_COLORS 제거, metaRow 인라인 badge View 2개를 CategoryBadge/DifficultyBadge로 교체, 로딩 분기를 LoadingView로, 에러 분기를 ErrorView(onRetry 없이)로 교체했다.

## Verification

cd mobile && npx tsc --noEmit — 에러 0건, exit 0. rg 'DIFFICULTY_COLORS' 두 파일 모두 매칭 없음 확인.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 7200ms |
| 2 | `! rg 'DIFFICULTY_COLORS' mobile/app/(tabs)/index.tsx` | 0 | ✅ pass | 150ms |
| 3 | `! rg 'DIFFICULTY_COLORS' mobile/app/prompts/` | 0 | ✅ pass | 150ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/(tabs)/index.tsx`
- `mobile/app/prompts/[id].tsx`


## Deviations
None.

## Known Issues
None.
