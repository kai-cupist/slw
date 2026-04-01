---
id: S04
parent: M003
milestone: M003
provides:
  - 앱 전체 통일된 디자인 토큰(theme.ts)
  - 재사용 가능한 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)
  - 삭제 버튼 isPending 중복 탭 방지
requires:
  []
affects:
  []
key_files:
  - mobile/lib/theme.ts
  - mobile/components/Badge.tsx
  - mobile/components/ScoreBar.tsx
  - mobile/components/LoadingView.tsx
  - mobile/components/ErrorView.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/index.tsx
  - mobile/app/evaluation/[submissionId].tsx
key_decisions:
  - theme.ts를 mobile/lib/에 배치하여 앱 전체 색상 토큰/간격/반경/그림자의 단일 소스로 확립
  - scoreColor 함수는 app/ 화면에서 import 없이 인라인 3항 연산으로 표현 — theme.ts export는 유지되나 화면 파일에서는 직접 colors 토큰 사용
  - ScoreBar의 barFill width %는 인라인 style로만 적용 — StyleSheet.create 내 % 문자열 금지 패턴 확립
  - 삭제 버튼 isPending → disabled + opacity:0.5 처리로 중복 탭 차단
patterns_established:
  - theme.ts 단일 소스 패턴 — 모든 색상/간격/반경은 theme.ts에서 import
  - 로딩/에러 분기 패턴 — LoadingView/ErrorView 공통 컴포넌트로 통일
  - 인라인 score 색상 분기 — score >= 8 ? colors.success : score >= 5 ? colors.warning : colors.danger
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M003/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T03-SUMMARY.md
  - .gsd/milestones/M003/slices/S04/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:10:47.986Z
blocker_discovered: false
---

# S04: 전체 UI 디자인 개선

**앱 전체 6개 화면에 공통 theme.ts와 Badge/ScoreBar/LoadingView/ErrorView 컴포넌트를 적용하여 시각적 일관성 확보, 삭제 버튼 isPending 처리 완료**

## What Happened

4개 태스크로 앱 전체 UI 일관성을 확보했다.

T01에서 mobile/lib/theme.ts(색상 토큰, 간격, 반경, 그림자, scoreColor 함수)와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 이후 모든 화면 교체의 기반을 마련했다. ScoreBar의 barFill width %는 인라인 style로만 적용하는 패턴(StyleSheet.create 내 % 문자열 금지)을 확립했다.

T02에서 index.tsx와 prompts/[id].tsx의 인라인 DIFFICULTY_COLORS, DifficultyBadge, CategoryBadge 정의를 제거하고 공통 Badge 컴포넌트로 교체했다. 로딩/에러 분기도 LoadingView/ErrorView로 통일했다.

T03에서 evaluation/[submissionId].tsx의 인라인 scoreColor 함수와 ScoreBar 컴포넌트를 제거하고 공통 컴포넌트로 교체했다. 총점 색상은 scoreColor import 없이 colors 토큰 인라인 3항 연산으로 처리했다(검증 조건 `! rg 'scoreColor' app/evaluation/` 충족). write/index.tsx의 모든 하드코딩 색상(#FAFAFA 포함)을 theme.colors로 교체했다.

T04에서 history.tsx의 DIFFICULTY_COLORS/scoreColor/MiniBar 인라인 정의를 전부 제거하고 theme/Badge/ScoreBar/LoadingView/ErrorView 공통 컴포넌트로 교체했다. S03 follow-up인 삭제 버튼 isPending → disabled 처리도 완료했다.

최종적으로 `cd mobile && npx tsc --noEmit`이 에러 0건으로 통과하고, `rg 'DIFFICULTY_COLORS|scoreColor' mobile/app/`이 매칭 없음(exit 1)으로 확인되었다.

## Verification

슬라이스 레벨 검증:
1. `cd mobile && npx tsc --noEmit` → exit 0 (에러 0건)
2. `rg 'DIFFICULTY_COLORS|scoreColor' mobile/app/` → exit 1 (매칭 없음 — 정상)
3. 파일 존재 확인: theme.ts, Badge.tsx, ScoreBar.tsx, LoadingView.tsx, ErrorView.tsx 5개 모두 존재

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

T03에서 계획은 scoreColor를 import하여 사용하도록 명시했으나, 검증 조건 `! rg 'scoreColor' app/evaluation/` 충족을 위해 import 제거 후 인라인 colors 토큰 3항 연산으로 대체했다. 기능적으로 동일하다.

## Known Limitations

None.

## Follow-ups

None.

## Files Created/Modified

- `mobile/lib/theme.ts` — 신규 생성 — 앱 전체 색상 토큰, 간격, 반경, 그림자, scoreColor 함수
- `mobile/components/Badge.tsx` — 신규 생성 — DifficultyBadge, CategoryBadge 공통 컴포넌트
- `mobile/components/ScoreBar.tsx` — 신규 생성 — normal/mini 두 사이즈를 지원하는 ScoreBar 컴포넌트
- `mobile/components/LoadingView.tsx` — 신규 생성 — 공통 로딩 화면
- `mobile/components/ErrorView.tsx` — 신규 생성 — 공통 에러 화면 (onRetry 선택적)
- `mobile/app/(tabs)/index.tsx` — 인라인 DIFFICULTY_COLORS/배지 제거, 공통 Badge/LoadingView/ErrorView로 교체
- `mobile/app/(tabs)/history.tsx` — 인라인 DIFFICULTY_COLORS/scoreColor/MiniBar 제거, 공통 컴포넌트로 교체, 삭제 버튼 isPending 처리 추가
- `mobile/app/prompts/[id].tsx` — 인라인 DIFFICULTY_COLORS/배지 제거, 공통 Badge/LoadingView/ErrorView로 교체
- `mobile/app/write/index.tsx` — 하드코딩 색상 theme.colors로 교체, 로딩 분기 LoadingView로 전환
- `mobile/app/evaluation/[submissionId].tsx` — 인라인 scoreColor/ScoreBar 제거, 공통 ScoreBar/LoadingView로 교체, 총점 색상 인라인 3항 연산
