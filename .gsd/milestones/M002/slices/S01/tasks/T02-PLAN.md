---
estimated_steps: 19
estimated_files: 2
skills_used: []
---

# T02: lib/hooks/ 디렉토리 생성 및 query/mutation hooks 작성

이 태스크는 5개 화면이 공통으로 사용할 hooks를 한 곳에 집중시킨다. queryKey 일관성과 staleTime 설정이 핵심이다.

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

## Inputs

- `mobile/lib/api.ts`
- `mobile/lib/types.ts`

## Expected Output

- `mobile/lib/hooks/queries.ts`
- `mobile/lib/hooks/mutations.ts`

## Verification

test -f mobile/lib/hooks/queries.ts && test -f mobile/lib/hooks/mutations.ts && grep -q 'usePrompts' mobile/lib/hooks/queries.ts && grep -q 'useSaveSubmission' mobile/lib/hooks/mutations.ts && echo 'OK'
