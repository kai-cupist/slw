---
estimated_steps: 59
estimated_files: 5
skills_used: []
---

# T03: 5개 화면 fetch/useEffect → TanStack Query hooks 전환 및 타입 체크

T01, T02 완료 후 실행. 5개 화면에서 `useState(loading/error/data)` + `useEffect` + 직접 API 호출 패턴을 T02에서 만든 hooks 호출로 교체한다. 마지막으로 `npm run typecheck`로 타입 오류 없음을 확인한다.

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

## Inputs

- `mobile/lib/hooks/queries.ts`
- `mobile/lib/hooks/mutations.ts`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/history.tsx`
- `mobile/app/prompts/[id].tsx`
- `mobile/app/write/[submissionId].tsx`
- `mobile/app/evaluation/[submissionId].tsx`

## Expected Output

- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/history.tsx`
- `mobile/app/prompts/[id].tsx`
- `mobile/app/write/[submissionId].tsx`
- `mobile/app/evaluation/[submissionId].tsx`

## Verification

cd mobile && npm run typecheck && ! grep -r 'useEffect.*fetch\|fetchPrompt\|fetchHistory\|fetchSubmission\|fetchEvaluation' app/ --include='*.tsx' && echo 'ALL PASS'
