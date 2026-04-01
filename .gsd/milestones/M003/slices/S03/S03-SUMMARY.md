---
id: S03
parent: M003
milestone: M003
provides:
  - GestureHandlerRootView 전체 앱 래핑 (이후 슬라이스에서 gesture 사용 가능)
  - useDeleteSubmission mutation hook
  - 이력 화면 스와이프 삭제 UI
requires:
  []
affects:
  - S04
key_files:
  - mobile/app/_layout.tsx
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/history.tsx
key_decisions:
  - renderRightActions를 item 클로저를 받는 고차 함수로 정의하여 useCallback 내에서 item별 삭제 핸들러를 생성했다
  - GestureHandlerRootView는 QueryClientProvider 바깥 최상위에 배치했다
patterns_established:
  - renderRightActions 고차 함수 패턴: (item) => () => <DeleteButton /> — renderItem useCallback 내에서 item별 액션 핸들러를 생성할 때 사용
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M003/slices/S03/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T06:51:29.943Z
blocker_discovered: false
---

# S03: 삭제 기능 완성

**이력 화면에서 왼쪽 스와이프로 빨간 삭제 버튼을 노출하고 확인 Alert 후 항목을 즉시 제거하는 스와이프 삭제 기능을 구현했다.**

## What Happened

T01 단일 태스크로 세 파일을 순서대로 수정하여 스와이프 삭제를 완성했다.

`_layout.tsx`: `GestureHandlerRootView`를 `QueryClientProvider` 바깥 최상위에 배치했다. 제스처 핸들러가 전체 앱을 감싸야 내부 어느 화면에서도 스와이프가 동작한다.

`mutations.ts`: `useDeleteSubmission` hook을 추가했다. `api.delete<{ deleted: boolean }>(`/submissions/${submissionId}`)` 를 `mutationFn`으로 사용하고, `onSuccess` 시 `evaluationHistory`와 `scoreTrend` 두 queryKey를 `invalidateQueries`해 목록이 자동 갱신된다.

`history.tsx`: `ReanimatedSwipeable`과 `Alert`를 import하고, `renderRightActions`를 item 클로저를 받는 고차 함수로 정의했다. 이 패턴은 `renderItem` useCallback 내에서 각 item별 삭제 핸들러를 생성하기 위해 필요했다. 삭제 버튼 onPress는 `Alert.alert`로 확인을 받은 뒤 `deleteMutation.mutate(item.submission_id)`를 호출한다. 기존 Pressable 카드를 `ReanimatedSwipeable`로 감싸고 `overshootRight={false}`로 오버슈트를 막았다.

## Verification

cd mobile && npx tsc --noEmit (exit 0), grep GestureHandlerRootView app/_layout.tsx (exit 0), grep useDeleteSubmission lib/hooks/mutations.ts (exit 0), grep ReanimatedSwipeable 'app/(tabs)/history.tsx' (exit 0) — 4개 검증 모두 통과.

## Requirements Advanced

None.

## Requirements Validated

- APP-04 — 이력 화면에서 스와이프 삭제 기능 구현 완료 — useDeleteSubmission + ReanimatedSwipeable + Alert 확인 흐름, tsc 컴파일 통과

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

renderRightActions를 item 클로저를 받는 고차 함수로 구현했다. 태스크 플랜은 단순 함수로 기술했으나 renderItem useCallback 내에서 item별 핸들러 생성을 위해 이 패턴이 필요했다.

## Known Limitations

삭제 중 deleteMutation.isPending 상태를 UI에 반영하지 않는다 — 삭제 버튼을 연속 탭하면 중복 요청이 발생할 수 있다. S04 디자인 개선 슬라이스에서 처리 가능하다.

## Follow-ups

삭제 버튼 isPending 상태 처리(로딩 인디케이터 또는 disabled) — S04에서 UX 개선 시 함께 처리 가능.

## Files Created/Modified

- `mobile/app/_layout.tsx` — GestureHandlerRootView를 QueryClientProvider 바깥 최상위에 추가
- `mobile/lib/hooks/mutations.ts` — useDeleteSubmission hook 추가 — DELETE /submissions/:id, onSuccess에서 evaluationHistory/scoreTrend invalidate
- `mobile/app/(tabs)/history.tsx` — ReanimatedSwipeable 스와이프 삭제 UI 추가 — renderRightActions 고차 함수, Alert 확인 다이얼로그
