# S03: 삭제 기능 완성 — Research

**Date:** 2026-04-01

## Summary

서버 측 `DELETE /submissions/:id` API는 이미 완전히 구현되어 있다(soft delete). 클라이언트 `api.delete()` 헬퍼도 있다. 남은 작업은 순수 프론트엔드: (1) `mutations.ts`에 `useDeleteSubmission` 뮤테이션 추가, (2) `history.tsx` 카드에 삭제 UI 연결이다.

삭제 UI는 스와이프 방식과 버튼 방식 두 갈래가 있다. `react-native-gesture-handler` v2.30.1이 이미 설치되어 있고 `ReanimatedSwipeable` 컴포넌트가 `react-native-gesture-handler/ReanimatedSwipeable` 경로로 접근 가능하다. 단, `ReanimatedSwipeable`은 `GestureHandlerRootView`로 앱 루트를 감싸야 동작한다 — 현재 `_layout.tsx`에는 없다.

## Recommendation

**스와이프 + 삭제 버튼 병행 방식을 권장한다.** 스와이프로 빨간 "삭제" 액션 패널이 드러나고, 탭하면 `Alert.alert` 확인 후 삭제 실행. 이력 아이템에는 `submission_id`가 있어 `DELETE /submissions/{submission_id}`를 직접 호출할 수 있다. `ReanimatedSwipeable`을 쓰면 Reanimated 워크렛 기반의 부드러운 애니메이션이 무료로 따라온다.

단, `_layout.tsx`에 `GestureHandlerRootView` 래핑이 없으면 제스처가 인식되지 않으므로, 이 작업이 선행되어야 한다.

## Implementation Landscape

### Key Files

- `mobile/app/_layout.tsx` — 루트 레이아웃. `GestureHandlerRootView`로 QueryClientProvider를 감싸야 ReanimatedSwipeable이 동작한다.
- `mobile/lib/hooks/mutations.ts` — `useDeleteSubmission` 뮤테이션 추가. 성공 시 `evaluationHistory`와 `scoreTrend` 캐시를 무효화한다.
- `mobile/app/(tabs)/history.tsx` — `renderItem` 안의 `Pressable` 카드를 `ReanimatedSwipeable`로 감싸고 오른쪽 스와이프에 삭제 액션 패널을 노출한다.

### Build Order

1. `_layout.tsx` — `GestureHandlerRootView` 래핑 추가 (이것 없으면 제스처 전혀 동작 안 함)
2. `mutations.ts` — `useDeleteSubmission` 추가
3. `history.tsx` — 스와이프 삭제 UI 연결

각 단계가 독립적이지 않다. 1번이 없으면 3번 검증 불가.

### Verification Approach

- `cd mobile && npx tsc --noEmit` → exit 0
- Expo Go 또는 시뮬레이터에서 이력 카드를 왼쪽으로 스와이프 → 빨간 삭제 버튼 노출 → 탭 → Alert 확인 → 목록에서 사라짐

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| 스와이프 제스처 + 애니메이션 | `ReanimatedSwipeable` (react-native-gesture-handler v2.30.1 내장) | 이미 설치됨. Reanimated 워크렛 기반으로 부드럽고 별도 설치 불필요 |
| 삭제 확인 다이얼로그 | `Alert.alert` (React Native 내장) | write.tsx에서 이미 패턴 사용 중, 일관성 유지 |

## Constraints

- `ReanimatedSwipeable`은 `react-native-gesture-handler/ReanimatedSwipeable` 경로로 import — 메인 `react-native-gesture-handler` 패키지 index에서는 미노출
- `GestureHandlerRootView`는 `react-native-gesture-handler`에서 import 가능
- `EvaluationHistory` 타입에는 `submission_id` 필드가 있어 삭제 API 호출에 직접 사용 가능
- 삭제 후 `evaluationHistory` 쿼리뿐 아니라 `scoreTrend`도 무효화해야 추이 데이터가 갱신됨

## Common Pitfalls

- **GestureHandlerRootView 누락** — 없으면 스와이프 제스처가 완전히 무시된다. _layout.tsx의 최상위를 감싸야 한다.
- **삭제 후 낙관적 업데이트 vs 캐시 무효화** — 낙관적 업데이트는 무한 스크롤 InfiniteQuery에서 pages 구조를 직접 조작해야 해서 복잡하다. 단순 `invalidateQueries`로 서버 재요청을 트리거하는 것이 안전하다. 약간의 깜빡임이 있지만 이 앱 수준에서는 허용 가능하다.
- **ReanimatedSwipeable renderRightActions 시그니처** — `(progress: SharedValue<number>, translation: SharedValue<number>, swipeableMethods: SwipeableMethods) => ReactNode` — 첫 두 인자가 SharedValue임을 주의. 단순 삭제 버튼 렌더링이라면 두 인자를 쓰지 않아도 된다.
