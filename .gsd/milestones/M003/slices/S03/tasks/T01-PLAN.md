---
estimated_steps: 19
estimated_files: 3
skills_used: []
---

# T01: GestureHandlerRootView 래핑 + 스와이프 삭제 UI 연결

세 파일을 순서대로 수정하여 스와이프 삭제 기능을 완성한다.

1. `mobile/app/_layout.tsx` — GestureHandlerRootView 래핑
   - `react-native-gesture-handler`에서 GestureHandlerRootView를 import한다.
   - QueryClientProvider 바깥에서 GestureHandlerRootView로 전체를 감싼다 (style={{ flex: 1 }} 필요).
   - 기존 구조: `<QueryClientProvider>...<Stack>...</Stack>...</QueryClientProvider>`
   - 변경 후: `<GestureHandlerRootView style={{ flex: 1 }}><QueryClientProvider>...<Stack>...</Stack>...</QueryClientProvider></GestureHandlerRootView>`

2. `mobile/lib/hooks/mutations.ts` — useDeleteSubmission 추가
   - `api.delete<{ deleted: boolean }>(`/submissions/${submissionId}`)` 를 호출하는 useMutation을 추가한다.
   - mutationFn의 타입: `(submissionId: number) => Promise<{ deleted: boolean }>`
   - onSuccess 시 `evaluationHistory`와 `scoreTrend` 두 queryKey를 invalidateQueries한다.

3. `mobile/app/(tabs)/history.tsx` — ReanimatedSwipeable 스와이프 삭제 UI
   - `react-native-gesture-handler/ReanimatedSwipeable`에서 ReanimatedSwipeable, SwipeableMethods를 import한다.
   - `react-native`에서 Alert를 추가 import한다.
   - `useDeleteSubmission`을 import하고 컴포넌트 최상단에서 호출한다: `const deleteMutation = useDeleteSubmission()`
   - `renderRightActions` 함수를 정의한다 — Pressable 빨간 삭제 버튼을 반환한다 (width: 80, backgroundColor: '#F44336', 텍스트: '삭제').
   - 삭제 버튼 onPress 핸들러: `Alert.alert('삭제', '이 이력을 삭제하시겠습니까?', [{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive', onPress: () => deleteMutation.mutate(item.submission_id) }])`
   - `renderItem`에서 기존 Pressable 카드를 ReanimatedSwipeable로 감싼다: `<ReanimatedSwipeable renderRightActions={...} overshootRight={false}>...기존 카드...</ReanimatedSwipeable>`
   - ReanimatedSwipeable에서 스타일 충돌을 방지하기 위해 ref 불필요(단순 삭제 버튼이므로 자동 닫힘 불필요).
   - renderItem은 useCallback 내부이므로 deleteMutation을 의존성에 추가하지 않아도 되나, 안전을 위해 `deleteMutation.mutate`를 dep로 추가한다.

## Inputs

- `mobile/app/_layout.tsx`
- `mobile/lib/hooks/mutations.ts`
- `mobile/app/(tabs)/history.tsx`
- `mobile/lib/api.ts`
- `mobile/lib/types.ts`

## Expected Output

- `mobile/app/_layout.tsx`
- `mobile/lib/hooks/mutations.ts`
- `mobile/app/(tabs)/history.tsx`

## Verification

cd mobile && npx tsc --noEmit && grep -q 'GestureHandlerRootView' app/_layout.tsx && grep -q 'useDeleteSubmission' lib/hooks/mutations.ts && grep -q 'ReanimatedSwipeable' app/\(tabs\)/history.tsx

## Observability Impact

삭제 API 실패 시 Alert.alert으로 에러 메시지를 사용자에게 노출한다. onError 핸들러를 mutate 호출부에 추가하거나 mutation의 onError에서 Alert를 띄운다.
