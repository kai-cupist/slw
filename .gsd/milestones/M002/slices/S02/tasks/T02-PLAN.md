---
estimated_steps: 18
estimated_files: 2
skills_used: []
---

# T02: 클라이언트 usePromptDraft hook 추가 및 prompts/[id].tsx draft 분기 버튼 구현

T01에서 서버에 추가된 `promptId` 필터를 활용하여 `usePromptDraft` hook을 구현하고, `prompts/[id].tsx` 화면에서 draft 유무에 따라 버튼을 분기한다.

1. `mobile/lib/hooks/queries.ts`에 `usePromptDraft(promptId: string | undefined)` hook을 추가한다:
   - queryKey: `['promptDraft', promptId]`
   - queryFn: `api.get<PaginatedResponse<SubmissionWithPrompt>>('/submissions?status=draft&promptId=' + promptId + '&limit=1')`
   - staleTime: 30_000 (제출 관련이므로 빠른 갱신)
   - enabled: `!!promptId`
   - import에 `SubmissionWithPrompt` 타입 추가 필요 (이미 `mobile/lib/types.ts`에 정의됨)

2. `mobile/app/prompts/[id].tsx`를 수정한다:
   - `usePromptDraft`를 import한다
   - 컴포넌트 내에서 `const { data: draftResult, isLoading: draftLoading } = usePromptDraft(id);`를 호출한다
   - `const existingDraft = draftResult?.items[0] ?? null;`로 첫 번째 draft를 추출한다
   - `handleContinueWriting` 핸들러를 추가한다: `router.push('/write/' + existingDraft!.id)` — 새 submission 생성 없이 직접 이동
   - footer 버튼을 draft 유무와 로딩 상태에 따라 분기한다:
     - `draftLoading` 중 → 버튼 `disabled` + ActivityIndicator 표시 (또는 버튼 텍스트 "확인 중...")
     - `existingDraft` 있음 → "이어서 작성" 버튼 (초록색 계열), `onPress={handleContinueWriting}`
     - `existingDraft` 없음 → "작성 시작" 버튼 (기존 파란색), `onPress={handleStartWriting}`
   - 두 버튼의 스타일을 StyleSheet에 추가한다 (continueButton: backgroundColor '#4CAF50')

3. `cd mobile && npx tsc --noEmit`으로 타입 에러 없음을 확인한다.

## Inputs

- `mobile/lib/hooks/queries.ts`
- `mobile/app/prompts/[id].tsx`
- `mobile/lib/types.ts`
- `mobile/lib/api.ts`

## Expected Output

- `mobile/lib/hooks/queries.ts`
- `mobile/app/prompts/[id].tsx`

## Verification

cd mobile && npx tsc --noEmit 2>&1 | tail -10 && grep -q 'usePromptDraft' lib/hooks/queries.ts && grep -q '이어서 작성' app/prompts/\[id\].tsx && echo 'ALL PASS'
