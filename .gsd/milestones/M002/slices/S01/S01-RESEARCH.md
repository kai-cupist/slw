# M002/S01 — TanStack Query 도입 및 전체 화면 전환 Research

**Date:** 2026-04-01

## Summary

현재 mobile/ 앱은 5개 화면 모두에서 `useState` + `useEffect` + `api.*` 직접 호출 패턴으로 서버 상태를 관리한다. 각 화면이 독립적으로 loading/error/data 상태를 보유하고, 캐싱이 없어 화면 전환 시마다 API 재호출이 발생한다. `@tanstack/react-query`는 아직 설치되지 않았으며(npm 레지스트리 최신 v5.96.0 확인), `QueryClientProvider`도 `_layout.tsx`에 없다.

전환 범위는 명확하다: 패키지 설치 → `_layout.tsx`에 `QueryClientProvider` 추가 → `lib/hooks/` 디렉토리에 query/mutation hooks 추출 → 5개 화면에서 fetch/useEffect 블록을 hooks 호출로 교체. `lib/api.ts`가 이미 잘 추상화되어 있어 `queryFn`에서 그대로 재사용 가능하다.

이 슬라이스의 핵심 위험은 write 화면의 mutation 처리다. `useMutation`으로 전환 시 `lastSavedContent.current` ref 관리와 저장 후 쿼리 캐시 갱신을 올바르게 처리해야 한다.

## Recommendation

`@tanstack/react-query` v5를 설치하고, `lib/hooks/` 아래에 query hooks와 mutation hooks를 파일 2개로 분리한다. 각 화면은 hooks를 import하여 사용하고, fetch/useEffect 코드를 제거한다.

hooks를 별도 파일로 추출하는 이유: 동일한 queryKey를 여러 화면에서 공유(history 화면과 write 화면이 같은 submission 쿼리 캐시를 사용)하고, S02-S03 슬라이스에서 invalidation 추가가 한 곳에서 이루어지도록 하기 위해서다.

## Implementation Landscape

### Key Files

- `mobile/package.json` — `@tanstack/react-query` 추가 필요 (설치 전)
- `mobile/app/_layout.tsx` — `QueryClientProvider`로 전체 앱 래핑 필요. 현재 `ThemeProvider`만 있음
- `mobile/lib/api.ts` — query hooks의 `queryFn`에서 그대로 사용. 변경 없음
- `mobile/lib/types.ts` — 타입 변경 없음
- `mobile/app/(tabs)/index.tsx` — `GET /prompts?page=1&limit=20` → `usePrompts` hook으로 교체
- `mobile/app/(tabs)/history.tsx` — `GET /evaluations/history` + `GET /evaluations/scores/trend` 두 개 쿼리 → 각각 독립 hooks로 교체. `TrendSection` 컴포넌트는 현재 내부 상태 관리; TanStack Query hook으로 대체
- `mobile/app/prompts/[id].tsx` — `GET /prompts/:id` → `usePrompt(id)` hook, POST /submissions → `useCreateSubmission` mutation
- `mobile/app/write/[submissionId].tsx` — `GET /submissions/:id` → `useSubmission(id)` hook, PATCH save/submit → `useSaveSubmission`/`useSubmitSubmission` mutations. `lastSavedContent.current` ref는 유지
- `mobile/app/evaluation/[submissionId].tsx` — `GET /evaluations/:id` → `useEvaluation(submissionId)` hook

**신규 파일:**
- `mobile/lib/hooks/queries.ts` — `usePrompts`, `usePrompt`, `useSubmission`, `useEvaluation`, `useEvaluationHistory`, `useScoreTrend` (모두 `useQuery` 기반)
- `mobile/lib/hooks/mutations.ts` — `useCreateSubmission`, `useSaveSubmission`, `useSubmitSubmission`, `useEvaluate` (모두 `useMutation` 기반)

### Build Order

1. **T01: 패키지 설치 + QueryClientProvider 설정** — `npm install @tanstack/react-query`로 설치, `_layout.tsx`에서 `QueryClientProvider` + `QueryClient` 추가. `isLoaded` guard 안쪽에 provider를 위치시킨다 (userId 로드 전에 QueryClient 생성은 불필요). 이 작업이 완료되어야 나머지 hooks가 동작한다.

2. **T02: `lib/hooks/` 생성** — `queries.ts`와 `mutations.ts` 파일 작성. 각 hook에 적절한 `staleTime` 설정: prompts는 5분(자주 안 바뀜), submissions/evaluations는 30초, history/trend는 1분.

3. **T03: 5개 화면 전환** — 각 화면에서 `useState(loading/error/data)` + `useEffect` + `fetchXxx` 함수 블록 제거, hook import 및 `isLoading`/`error`/`data` 사용으로 교체. history 화면의 `TrendSection`은 `useScoreTrend` hook을 사용하도록 변경. write 화면에서 mutation의 `onSuccess`에서 `queryClient.invalidateQueries(['submission', submissionId])` 호출.

4. **T04: 타입 체크** — `npm run typecheck`로 컴파일 오류 없음 확인.

### Verification Approach

```bash
cd mobile && npm run typecheck
# 0 errors 확인

# 실행 확인 (선택 — Docker가 실행 중일 때)
# npx expo start --ios 로 앱 실행 후 화면 전환 시 캐시 동작 육안 확인
```

## Don't Hand-Roll

| Problem | Existing Solution | Why Use It |
|---------|------------------|------------|
| loading/error/refetch 상태 관리 | `useQuery` from @tanstack/react-query | 직접 구현하면 race condition, cleanup, 중복 요청 처리가 복잡. v5는 React Native에서 별도 설정 없이 동작 |
| mutation 상태 및 콜백 처리 | `useMutation` from @tanstack/react-query | isPending, onSuccess, onError 상태 자동 관리 |

## Constraints

- **Expo SDK 55 / React 19.2** — TanStack Query v5는 React 16.8+를 요구하므로 호환 문제 없음
- **React Native에서 QueryClientProvider** — 웹과 동일하게 동작. `focusManager`, `onlineManager` 등 추가 설정은 선택 사항이며 S01에서는 불필요
- **`write/[submissionId].tsx`의 `lastSavedContent.current` ref** — TanStack Query로 전환해도 이 ref는 "마지막으로 서버에 저장된 내용"을 추적하는 별도 목적이므로 유지해야 한다. mutation onSuccess에서 업데이트.

## Common Pitfalls

- **TanStack Query v5 API 변경** — v4에서 v5로 변경된 사항: `isLoading` (query 처음 로딩) vs `isFetching` 구분 명확화, mutation에서 `isLoading` → `isPending`. 화면에서 로딩 표시에 `isPending` 대신 `isLoading` 을 써야 할 수 있으므로 주의. (쿼리는 `isLoading`, mutation은 `isPending`이 올바름)
- **QueryClientProvider 위치** — `useUserStore`의 `loadUserId`가 `useEffect`에서 호출되므로, QueryClientProvider는 그 외부(상위)에 있어야 한다. `_layout.tsx`에서 `QueryClientProvider`를 최상위로 래핑하고, `QueryClient` 인스턴스는 컴포넌트 밖(모듈 스코프) 또는 `useMemo`로 생성해야 리렌더링 시 재생성되지 않음
- **queryKey 일관성** — 동일한 엔티티에 여러 화면이 접근할 때 queryKey가 다르면 캐시를 공유하지 못한다. `['submission', submissionId]` 형식으로 통일하고 `mutations.ts`에서도 동일 key로 invalidation
