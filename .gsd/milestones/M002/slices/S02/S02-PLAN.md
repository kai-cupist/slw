# S02: Submissions 임시저장-이어쓰기 흐름 완성

**Goal:** 서버에 `promptId` 필터를 추가하고, 클라이언트에서 해당 프롬프트의 기존 draft를 조회하여 "이어서 작성" 버튼을 표시한다
**Demo:** After this: 프롬프트 상세에서 기존 draft가 있으면 이어서 작성 버튼이 표시되고, 임시저장 후 앱 재시작 시에도 draft가 유지된다

## Tasks
- [x] **T01: GetSubmissionsDto에 promptId 쿼리 파라미터를 추가하고 Repository/Service까지 연결하여 GET /submissions?promptId={n} 필터 완성** — 서버 `GET /submissions` 엔드포인트가 `promptId` 쿼리 파라미터를 받아 특정 프롬프트의 답안만 필터링할 수 있도록 DTO → Repository → Service 3개 파일을 수정한다.

1. `GetSubmissionsDto`에 `@ApiPropertyOptional`, `@IsOptional()`, `@Type(() => Number)`, `@IsInt()` 데코레이터와 함께 `promptId?: number` 필드를 추가한다. `@Type(() => Number)`는 쿼리 파라미터 문자열→숫자 변환을 위해 필수 (기존 PaginationDto의 page/limit 패턴 동일하게 적용).
2. `SubmissionsRepository.findAllByUser` 시그니처의 `filters` 타입에 `promptId?: number`를 추가하고, 동적 WHERE 절 구성 블록에 `if (filters.promptId)` 분기를 추가하여 `s.prompt_id = $${paramIndex++}` 조건을 append한다. `params`에도 `filters.promptId`를 push한다. 기존 `paramIndex` 카운터 패턴을 그대로 따른다.
3. `SubmissionsService.findAll`에서 `submissionsRepository.findAllByUser` 호출 시 `filters`에 `promptId: dto.promptId`를 추가로 전달한다.
4. `cd server && npm run build`로 타입 에러 없이 빌드되는지 확인한다.
  - Estimate: 30m
  - Files: server/src/submissions/dto/get-submissions.dto.ts, server/src/submissions/submissions.repository.ts, server/src/submissions/submissions.service.ts
  - Verify: cd server && npm run build 2>&1 | tail -5 && echo 'BUILD OK'
- [x] **T02: usePromptDraft hook을 추가하고 prompts/[id].tsx에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시** — T01에서 서버에 추가된 `promptId` 필터를 활용하여 `usePromptDraft` hook을 구현하고, `prompts/[id].tsx` 화면에서 draft 유무에 따라 버튼을 분기한다.

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
  - Estimate: 45m
  - Files: mobile/lib/hooks/queries.ts, mobile/app/prompts/[id].tsx
  - Verify: cd mobile && npx tsc --noEmit 2>&1 | tail -10 && grep -q 'usePromptDraft' lib/hooks/queries.ts && grep -q '이어서 작성' app/prompts/\[id\].tsx && echo 'ALL PASS'
