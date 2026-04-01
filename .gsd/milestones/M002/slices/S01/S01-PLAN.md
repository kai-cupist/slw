# S01: TanStack Query 도입 및 전체 화면 전환

**Goal:** 모바일 앱의 서버 상태 관리를 TanStack Query(v5)로 전환한다. 5개 화면 모두에서 fetch/useEffect 블록을 제거하고, lib/hooks/ 디렉토리의 query/mutation hooks를 사용하도록 교체한다.
**Demo:** After this: 모든 화면에서 TanStack Query 기반 데이터 패칭이 동작하고, fetch/useEffect 코드가 제거된다

## Tasks
- [x] **T01: @tanstack/react-query 설치 및 _layout.tsx에 QueryClientProvider 추가로 앱 전체 TanStack Query 사용 환경 구성** — 이 태스크는 나머지 모든 태스크의 전제조건이다. `@tanstack/react-query`를 설치하고, `_layout.tsx`에 `QueryClientProvider`를 추가하여 앱 전체에서 TanStack Query hooks를 사용할 수 있게 한다.

## Steps

1. `mobile/` 디렉토리에서 `npm install @tanstack/react-query` 실행
2. `mobile/package.json`에 `@tanstack/react-query`가 추가되었는지 확인
3. `mobile/app/_layout.tsx` 수정:
   - `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'` 추가
   - 모듈 스코프(컴포넌트 밖)에 `const queryClient = new QueryClient()` 선언 — 리렌더링 시 재생성 방지
   - `isLoaded` guard 이후 반환값(ThemeProvider 등)을 `<QueryClientProvider client={queryClient}>...</QueryClientProvider>`로 래핑
   - 로딩 스피너 반환 분기는 QueryClientProvider 밖에 그대로 둔다 (userId 로드 전에는 쿼리 불필요)

## Must-Haves

- `queryClient`는 컴포넌트 밖 모듈 스코프에 선언 (useMemo 아님)
- `QueryClientProvider`는 `ThemeProvider`와 `Stack`을 모두 감싸야 함
- 기존 `useUserStore`, `loadUserId` 로직은 변경하지 않음
  - Estimate: 20m
  - Files: mobile/package.json, mobile/app/_layout.tsx
  - Verify: cd mobile && grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx && echo 'OK'
- [x] **T02: mobile/lib/hooks/ 디렉토리에 6개 query hooks와 4개 mutation hooks를 작성하여 5개 화면이 공유할 데이터 패칭 레이어 완성** — 이 태스크는 5개 화면이 공통으로 사용할 hooks를 한 곳에 집중시킨다. queryKey 일관성과 staleTime 설정이 핵심이다.

## Steps

1. `mobile/lib/hooks/queries.ts` 파일 생성 — 다음 6개 hook을 `useQuery` 기반으로 작성:
   - `usePrompts()` — `GET /prompts?page=1&limit=20`, queryKey: `['prompts']`, staleTime: 5분(300000)
   - `usePrompt(id: string | undefined)` — `GET /prompts/:id`, queryKey: `['prompt', id]`, staleTime: 5분, `enabled: !!id`
   - `useSubmission(submissionId: string | undefined)` — `GET /submissions/:submissionId`, queryKey: `['submission', submissionId]`, staleTime: 30초(30000), `enabled: !!submissionId`
   - `useEvaluation(submissionId: string | undefined)` — `GET /evaluations/:submissionId`, queryKey: `['evaluation', submissionId]`, staleTime: 30초, `enabled: !!submissionId`
   - `useEvaluationHistory()` — `GET /evaluations/history?page=1&limit=20`, queryKey: `['evaluationHistory']`, staleTime: 1분(60000)
   - `useScoreTrend()` — `GET /evaluations/scores/trend?limit=10`, queryKey: `['scoreTrend']`, staleTime: 1분

2. `mobile/lib/hooks/mutations.ts` 파일 생성 — 다음 4개 hook을 `useMutation` 기반으로 작성:
   - `useCreateSubmission()` — `POST /submissions { prompt_id }`, mutationFn: `(promptId: number) => api.post<Submission>('/submissions', { prompt_id: promptId })`
   - `useSaveSubmission()` — `PATCH /submissions/:id { content }`, mutationFn: `({ submissionId, content }: { submissionId: string; content: string })`, onSuccess에서 `queryClient.invalidateQueries({ queryKey: ['submission', variables.submissionId] })`
   - `useSubmitSubmission()` — `PATCH /submissions/:id/submit`, mutationFn: `(submissionId: string) => api.patch<Submission>('/submissions/${submissionId}/submit')`, onSuccess에서 `queryClient.invalidateQueries({ queryKey: ['submission', submissionId] })`
   - `useEvaluate()` — `POST /submissions/:id/evaluate {}`, mutationFn: `(submissionId: string) => api.post<Evaluation>('/submissions/${submissionId}/evaluate', {})`

## Must-Haves

- 모든 queryKey는 배열 형식 (`['key', param]`)
- `useQueryClient()`는 mutations.ts 내부 hooks에서 호출 (훅 내부에서만)
- 타입은 `mobile/lib/types.ts`에서 import (Prompt, Submission, Evaluation, EvaluationHistory, ScoreTrend, PaginatedResponse)
- `api.*`는 `mobile/lib/api.ts`에서 import
  - Estimate: 40m
  - Files: mobile/lib/hooks/queries.ts, mobile/lib/hooks/mutations.ts
  - Verify: test -f mobile/lib/hooks/queries.ts && test -f mobile/lib/hooks/mutations.ts && grep -q 'usePrompts' mobile/lib/hooks/queries.ts && grep -q 'useSaveSubmission' mobile/lib/hooks/mutations.ts && echo 'OK'
- [x] **T03: 5개 화면 모두에서 fetch/useEffect/useState(loading) 블록을 제거하고 TanStack Query hooks로 교체, typecheck 0 errors 확인** — T01, T02 완료 후 실행. 5개 화면에서 `useState(loading/error/data)` + `useEffect` + 직접 API 호출 패턴을 T02에서 만든 hooks 호출로 교체한다. 마지막으로 `npm run typecheck`로 타입 오류 없음을 확인한다.

## Steps

### 1. `mobile/app/(tabs)/index.tsx`
- `usePrompts()` hook import
- `const { data, isLoading, error, refetch } = usePrompts()`
- `data`는 `PaginatedResponse<Prompt>` — `data?.items ?? []`로 목록 접근
- 로딩: `isLoading`, 에러: `error?.message`, 재시도: `refetch`
- `useState/useEffect/useCallback(fetchPrompts)` 블록 전부 제거
- `ApiError` import 제거 (에러 메시지는 `error?.message`로)

### 2. `mobile/app/(tabs)/history.tsx`
- `useEvaluationHistory()` hook으로 메인 목록 교체
- `TrendSection` 컴포넌트: 내부 `useState/useEffect` 제거하고 `useScoreTrend()` hook 사용
  - `const { data: trends, isLoading, error } = useScoreTrend()`
  - `loading` 또는 `error` 시 null 반환 (기존 동작 유지)
- 메인 컴포넌트: `const { data, isLoading, error, refetch } = useEvaluationHistory()`, `data?.items ?? []`

### 3. `mobile/app/prompts/[id].tsx`
- `usePrompt(id)` hook으로 교체
- `const { data: prompt, isLoading, error } = usePrompt(id)`
- `useCreateSubmission()` mutation으로 교체
- `handleStartWriting`: `const { mutateAsync: createSubmission, isPending: creating } = useCreateSubmission()`
  - `const submission = await createSubmission(Number(id))`
  - Alert와 router.push 로직은 그대로 유지 (try/catch)
- `fetchPrompt` useCallback + useEffect 제거

### 4. `mobile/app/write/[submissionId].tsx` (가장 복잡)
- `useSubmission(submissionId)` hook으로 초기 데이터 로드
  - `const { data: submission, isLoading } = useSubmission(submissionId)`
  - `useEffect`로 `submission?.content`가 로드되면 `setContent`와 `lastSavedContent.current` 초기화
    ```tsx
    useEffect(() => {
      if (submission?.content != null) {
        setContent(submission.content);
        lastSavedContent.current = submission.content;
      }
    }, [submission?.id]);
    ```
  - `submission.id`를 의존성으로 사용하여 첫 로드 시에만 실행
- `useSaveSubmission()` mutation:
  - `const { mutateAsync: saveSubmission, isPending: saving } = useSaveSubmission()`
  - `handleSave`: `await saveSubmission({ submissionId, content })` 후 `lastSavedContent.current = content`
- `useSubmitSubmission()` mutation:
  - `const { mutateAsync: submitSubmission } = useSubmitSubmission()`
- `useEvaluate()` mutation:
  - `const { mutateAsync: evaluate, isPending: submitting } = useEvaluate()`
- `handleSubmit` 오케스트레이션 로직은 그대로 유지하되 `api.*` 직접 호출을 `mutateAsync`로 교체
- **중요**: `lastSavedContent.current`는 `handleSave`의 await 후, `handleSubmit`의 await 후 직접 업데이트 (mutation onSuccess 콜백 의존 금지)
- `fetchSubmission` useCallback + useEffect 제거, `useState(loading/error/submission)` 제거
- `error` 상태가 없어지므로 에러 표시는 `isLoading` 중 null, submission 없으면 에러 뷰

### 5. `mobile/app/evaluation/[submissionId].tsx`
- `useEvaluation(submissionId)` hook으로 교체
- `const { data: evaluation, isLoading, error } = useEvaluation(submissionId)`
- `fetchEvaluation` useCallback + useEffect 제거

### 6. 타입 체크
- `cd mobile && npm run typecheck` 실행 — 0 errors 확인
- 오류 있으면 수정 후 재실행

## Must-Haves

- TanStack Query v5 API: 쿼리는 `isLoading`, mutation은 `isPending` (혼동 금지)
- `write/[submissionId].tsx`의 `lastSavedContent.current`는 반드시 보존
- 모든 화면에서 `ApiError` 직접 import 제거 (hooks가 에러를 throw하므로 `error instanceof ApiError` 체크 불필요)
- `npm run typecheck` 0 errors로 완료
  - Estimate: 1h
  - Files: mobile/app/(tabs)/index.tsx, mobile/app/(tabs)/history.tsx, mobile/app/prompts/[id].tsx, mobile/app/write/[submissionId].tsx, mobile/app/evaluation/[submissionId].tsx
  - Verify: cd mobile && npm run typecheck && ! grep -r 'useEffect.*fetch\|fetchPrompt\|fetchHistory\|fetchSubmission\|fetchEvaluation' app/ --include='*.tsx' && echo 'ALL PASS'
