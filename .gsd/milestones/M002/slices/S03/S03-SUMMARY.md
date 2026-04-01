---
id: S03
parent: M002
milestone: M002
provides:
  - index.tsx FlatList pull-to-refresh (isFetching + refetch)
  - history.tsx FlatList pull-to-refresh (isFetching + handleRefresh)
  - useEvaluate 성공 시 evaluationHistory + scoreTrend 캐시 자동 무효화
requires:
  []
affects:
  []
key_files:
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
key_decisions:
  - useEvaluate onSuccess에서 evaluationHistory·scoreTrend 두 캐시를 invalidate하여 평가 후 이력/트렌드 자동 갱신
  - HistoryScreen에서 useScoreTrend()를 최상단에서 별도 호출해 refetchTrend 확보, handleRefresh로 묶어 FlatList에 연결
  - TrendSection 내부 수정 없이 캐시 무효화만으로 갱신 — 동일 queryKey 공유 덕분
patterns_established:
  - TanStack Query mutation onSuccess에서 관련 쿼리 캐시를 invalidateQueries로 무효화하여 UI를 자동 갱신하는 패턴
  - 화면 컴포넌트에서 useScoreTrend()를 명시적으로 추가 호출해 refetch 함수를 확보한 뒤 pull-to-refresh 핸들러에서 묶음 처리
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M002/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T05:04:26.570Z
blocker_discovered: false
---

# S03: UX 향상 — pull-to-refresh 및 자동 갱신

**목록·이력 화면에 pull-to-refresh 연결, 평가 후 evaluationHistory·scoreTrend 캐시 자동 무효화**

## What Happened

S03의 목표는 세 파일에 최소 변경을 적용하는 단일 태스크로 구성됐다.

T01에서 다음 세 곳을 수정했다.

1. **mutations.ts** — `useEvaluate()`에 `onSuccess` 핸들러 추가. 평가 성공 시 `invalidateQueries({ queryKey: ['evaluationHistory'] })`와 `invalidateQueries({ queryKey: ['scoreTrend'] })`를 순서대로 호출하여 이력 화면과 TrendSection이 자동으로 최신 데이터를 받도록 했다. `useQueryClient` import는 이미 파일 상단에 존재해 추가 불필요.

2. **index.tsx** — `usePrompts()` destructure에 `isFetching`을 추가하고, FlatList에 `refreshing={isFetching}` + `onRefresh={refetch}` 두 props를 연결했다.

3. **history.tsx** — `useEvaluationHistory()`에 `isFetching`을 추가하고, `useScoreTrend()`를 HistoryScreen 최상단에서 별도 호출해 `refetchTrend`를 확보. `handleRefresh` 콜백으로 `refetch()` + `refetchTrend()`를 묶어 FlatList에 연결했다. TrendSection 내부 `useScoreTrend()` 호출은 동일 queryKey를 공유하므로 캐시 무효화만으로 자동 갱신된다.

타입체크(`npm run typecheck`) exit 0, grep으로 삽입 위치 모두 확인.

## Verification

- `cd mobile && npm run typecheck` → exit 0 (타입 에러 없음)
- `grep -n 'refreshing\|onRefresh' app/(tabs)/index.tsx app/(tabs)/history.tsx` → index.tsx:98-99, history.tsx:177-178에서 각각 확인
- `grep -n 'invalidateQueries.*evaluationHistory\|invalidateQueries.*scoreTrend' lib/hooks/mutations.ts` → mutations.ts:65-66에서 두 캐시 무효화 확인

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

mutations.ts에 `useQueryClient` import가 이미 존재해 import 수정 불필요.

## Known Limitations

이 슬라이스에서 수동 기기 실행 테스트는 수행하지 않았다. typecheck + grep 기반 정적 검증만 완료됐다. 실제 pull-to-refresh 제스처와 평가 후 자동 갱신 동작은 앱 실행 환경에서 확인 필요.

## Follow-ups

None.

## Files Created/Modified

- `mobile/lib/hooks/mutations.ts` — useEvaluate에 onSuccess 추가 — evaluationHistory·scoreTrend 캐시 invalidate
- `mobile/app/(tabs)/index.tsx` — usePrompts isFetching 구조분해, FlatList에 refreshing+onRefresh 연결
- `mobile/app/(tabs)/history.tsx` — useEvaluationHistory isFetching 추가, useScoreTrend 별도 호출로 refetchTrend 확보, handleRefresh 추가, FlatList에 pull-to-refresh 연결
