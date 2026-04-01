---
estimated_steps: 26
estimated_files: 3
skills_used: []
---

# T01: pull-to-refresh 및 평가 후 자동 갱신 연결

세 파일에 최소 변경을 적용한다.

1. `mobile/lib/hooks/mutations.ts`
   - 파일 상단에 `useQueryClient` import 추가 (이미 `useMutation`을 import하는 라인에 함께)
   - `useEvaluate()` 함수 본문에 `const queryClient = useQueryClient();` 추가
   - `useMutation` 옵션에 `onSuccess` 추가:
     ```ts
     onSuccess: () => {
       queryClient.invalidateQueries({ queryKey: ['evaluationHistory'] });
       queryClient.invalidateQueries({ queryKey: ['scoreTrend'] });
     },
     ```

2. `mobile/app/(tabs)/index.tsx`
   - `usePrompts()` destructure에 `isFetching` 추가: `const { data, isLoading, error, refetch, isFetching } = usePrompts();`
   - FlatList에 두 props 추가: `refreshing={isFetching}` + `onRefresh={refetch}`

3. `mobile/app/(tabs)/history.tsx`
   - `useEvaluationHistory()` destructure에 `isFetching` 추가
   - `useScoreTrend` import를 활용해 HistoryScreen 상단에 추가 호출: `const { refetch: refetchTrend } = useScoreTrend();`
   - handleRefresh 함수 추가:
     ```ts
     const handleRefresh = useCallback(() => {
       refetch();
       refetchTrend();
     }, [refetch, refetchTrend]);
     ```
   - FlatList에 `refreshing={isFetching}` + `onRefresh={handleRefresh}` 추가

주의: `TrendSection` 컴포넌트는 내부에서 이미 `useScoreTrend()`를 호출한다. HistoryScreen에서 추가 호출 후 `refetchTrend()`를 실행하면 동일 queryKey 캐시가 무효화되어 TrendSection의 데이터도 갱신된다. TrendSection 컴포넌트 자체는 수정하지 않는다.

## Inputs

- ``mobile/lib/hooks/mutations.ts` — useEvaluate 함수 (onSuccess 없음, queryClient 없음)`
- ``mobile/app/(tabs)/index.tsx` — usePrompts hook 사용, FlatList에 refreshing/onRefresh 없음`
- ``mobile/app/(tabs)/history.tsx` — useEvaluationHistory hook 사용, FlatList에 refreshing/onRefresh 없음, useScoreTrend는 TrendSection 내부에서만 사용`

## Expected Output

- ``mobile/lib/hooks/mutations.ts` — useEvaluate에 queryClient + onSuccess(invalidateQueries) 추가`
- ``mobile/app/(tabs)/index.tsx` — FlatList에 refreshing={isFetching} + onRefresh={refetch} 추가`
- ``mobile/app/(tabs)/history.tsx` — HistoryScreen에 useScoreTrend refetch 추가, handleRefresh, FlatList props 추가`

## Verification

cd mobile && npm run typecheck && grep -n 'refreshing\|onRefresh' app/\(tabs\)/index.tsx app/\(tabs\)/history.tsx && grep -n 'invalidateQueries.*evaluationHistory\|invalidateQueries.*scoreTrend' lib/hooks/mutations.ts
