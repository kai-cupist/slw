# S03 — Research: UX 향상 — pull-to-refresh 및 자동 갱신

**Date:** 2026-04-01

## Summary

S01에서 TanStack Query 기반 hooks가 완전히 구축되어 있고, 각 화면에서 이미 `refetch`를 destructure하고 있다. S03는 두 가지 추가만 필요하다:

1. `index.tsx`, `history.tsx` FlatList에 `onRefresh` + `refreshing` props 연결 (refetch 함수가 이미 있음)
2. `mutations.ts`의 `useEvaluate` onSuccess에서 `evaluationHistory`, `scoreTrend` queryKey invalidate 추가

코드 변경량이 매우 작고 새로운 패턴이나 라이브러리 없음.

## Recommendation

세 파일에 최소 변경 적용. pull-to-refresh는 React Native FlatList의 `refreshing`/`onRefresh` props 표준 패턴 사용. mutation 후 자동 갱신은 TanStack Query `invalidateQueries` 호출로 처리.

## Implementation Landscape

### Key Files

- `mobile/app/(tabs)/index.tsx` — usePrompts()에서 `refetch` 이미 destructure됨. FlatList에 `refreshing={isLoading}` + `onRefresh={refetch}` 추가만 필요
- `mobile/app/(tabs)/history.tsx` — useEvaluationHistory()에서 `refetch` 이미 있음. FlatList에 동일하게 추가. TrendSection은 별도 useScoreTrend hook을 사용하므로 history.tsx가 별도 `refetchScoreTrend` prop을 받거나, TrendSection 내부에서 refetch를 노출해야 함 → 가장 단순한 방법: TrendSection을 FlatList ListHeaderComponent 대신 개별 useState 기반으로 refetch를 병렬 실행. 또는 history.tsx에서 useScoreTrend를 직접 호출하고 FlatList `onRefresh`에서 두 refetch를 동시에 실행
- `mobile/lib/hooks/mutations.ts` — `useEvaluate` hook에 onSuccess 추가: `queryClient.invalidateQueries({ queryKey: ['evaluationHistory'] })` + `queryClient.invalidateQueries({ queryKey: ['scoreTrend'] })`

### history.tsx 처리 방법

현재 `TrendSection`은 내부에서 `useScoreTrend()`를 직접 호출하는 독립 컴포넌트다. pull-to-refresh 시 두 쿼리를 함께 갱신하려면:
- `history.tsx` 상위 컴포넌트에서 `useScoreTrend()`도 함께 destructure하고 두 refetch를 동시에 호출하는 handleRefresh 함수 작성
- refreshing 상태는 `isFetching || scoreTrendFetching` (또는 단순히 `isFetching`)으로 설정
- TrendSection은 그대로 유지 (내부에서 자체 쿼리로 렌더링), 외부 refetch는 캐시 무효화 트리거 역할

### Build Order

T01 단일 태스크로 처리 가능:
1. `mutations.ts` — useEvaluate에 queryClient + onSuccess invalidate 추가
2. `index.tsx` — FlatList refreshing/onRefresh 추가
3. `history.tsx` — useScoreTrend 상위 수동 destructure + handleRefresh + FlatList props 추가
4. `npm run typecheck` 검증

### Verification Approach

```bash
cd mobile && npm run typecheck
# 0 errors
```

FlatList에 refreshing/onRefresh prop 존재 확인:
```bash
grep -n "refreshing\|onRefresh" mobile/app/\(tabs\)/index.tsx mobile/app/\(tabs\)/history.tsx
```

useEvaluate invalidate 확인:
```bash
grep -n "invalidateQueries\|evaluationHistory\|scoreTrend" mobile/lib/hooks/mutations.ts
```
