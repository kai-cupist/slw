# M002/S02 — Research: Submissions 임시저장-이어쓰기 흐름 완성

**Date:** 2026-04-01

## Summary

S02의 목표는 두 가지다. 첫째, 프롬프트 상세 화면에서 해당 프롬프트에 대한 기존 draft가 있으면 "이어서 작성" 버튼을 표시하고 기존 submission으로 이동한다. 둘째, 임시저장 후 앱 재시작 시에도 draft가 유지된다 — 이는 서버 DB에 content가 이미 저장되어 있으므로, 프롬프트 화면에서 기존 draft를 정확히 찾아주는 로직이 핵심이다.

현재 `prompts/[id].tsx`는 "작성 시작" 버튼 하나만 있으며 항상 새 submission을 생성한다. 서버 `GET /submissions`는 `status` 필터를 지원하지만 `prompt_id` 필터가 없어, 특정 프롬프트의 draft를 직접 조회할 수 없다. 이 두 가지 갭을 메우는 것이 S02 전체 작업이다.

## Recommendation

서버에 `prompt_id` 필터를 추가하는 방향이 가장 깔끔하다. 클라이언트에서 모든 draft를 가져와 필터링하는 방법은 draft가 많아지면 불필요한 데이터를 전송한다. 서버 수정은 GetSubmissionsDto에 필드 추가 + Repository 동적 WHERE에 조건 한 줄이므로 범위가 작다.

## Implementation Landscape

### Key Files

**서버 (변경 필요):**
- `server/src/submissions/dto/get-submissions.dto.ts` — `@IsOptional() @IsInt() promptId?: number` 필드 추가
- `server/src/submissions/submissions.repository.ts` — `findAllByUser` 메서드의 동적 WHERE에 `promptId` 조건 추가. 기존 `paramIndex` 카운터 패턴을 그대로 따른다.
- `server/src/submissions/submissions.service.ts` — `findAll`에서 `dto.promptId`를 `filters`에 전달

**클라이언트 (변경 필요):**
- `mobile/lib/hooks/queries.ts` — `usePromptDraft(promptId)` hook 추가. `GET /submissions?status=draft&prompt_id={promptId}&limit=1` 호출. `PaginatedResponse<SubmissionWithPrompt>` 반환. `enabled: !!promptId`
- `mobile/app/prompts/[id].tsx` — `usePromptDraft(id)` 호출 후 draft 유무에 따라 버튼 분기:
  - draft 있음 → "이어서 작성" 버튼 (기존 submission.id로 `router.push`)
  - draft 없음 → "작성 시작" 버튼 (기존 로직 유지: createSubmission 후 이동)

**변경 없는 파일:**
- `mobile/lib/hooks/mutations.ts` — useCreateSubmission 그대로 사용
- `mobile/app/write/[submissionId].tsx` — write 화면 자체는 변경 없음. draft든 신규든 submissionId로 동일하게 동작한다.
- `mobile/stores/userStore.ts` — userId AsyncStorage 영속화 이미 구현됨. draft 영속화는 서버 DB에 위임하므로 클라이언트 측 persist 불필요.

### Build Order

T01 먼저 서버 `prompt_id` 필터를 추가한다. T02에서 클라이언트 hook과 화면을 함께 구현한다. 서버 변경 없이는 클라이언트 hook을 정확히 검증할 수 없으므로 이 순서가 맞다.

T01: 서버 — `GetSubmissionsDto`, `SubmissionsRepository`, `SubmissionsService` 3파일 수정 (범위 최소)
T02: 클라이언트 — `queries.ts`에 `usePromptDraft` 추가 + `prompts/[id].tsx` 화면 업데이트

### Verification Approach

```bash
# T01 — 서버 타입 검사
cd server && npm run build

# T01 — API 동작 확인 (Docker 기동 중 가정)
curl -s "http://localhost:3100/submissions?status=draft&prompt_id=1" \
  -H "X-User-Id: test-user"

# T02 — 클라이언트 타입 검사
cd mobile && npx tsc --noEmit

# T02 — usePromptDraft hook grep 확인
grep -n 'usePromptDraft' mobile/lib/hooks/queries.ts
grep -n 'usePromptDraft\|이어서 작성' mobile/app/prompts/\[id\].tsx
```

## Constraints

- 서버 `findAllByUser`의 동적 WHERE는 `paramIndex` 카운터 방식으로 구현되어 있다 — 새 조건 추가 시 동일 패턴을 따라야 한다 (K006의 PoolClient 패턴과 별개, 단순 paramIndex 관리)
- `Submission` 타입에는 `prompt_id`가 있으나, `GET /submissions` 응답이 `SubmissionWithPrompt`이므로 queries.ts의 반환 타입을 `PaginatedResponse<SubmissionWithPrompt>`로 맞춰야 한다
- K009: 서버 실제 응답 구조가 계획과 다를 수 있다 — 실제 API 응답 기준으로 타입을 확인하고 맞춰야 한다

## Common Pitfalls

- **prompt_id 필터명 일치** — DTO 필드명은 `promptId` (camelCase)이고 HTTP 쿼리 파라미터도 `prompt_id`(snake_case) 또는 NestJS 기본 변환에 따라 결정된다. NestJS ValidationPipe의 `transform: true`가 전역 활성화되어 있으므로 camelCase 쿼리 파라미터(`promptId`)를 사용해야 한다. DTO 필드명과 클라이언트 쿼리 문자열을 일치시켜야 한다.
- **draft 복수 처리** — 사용자가 같은 프롬프트에 대해 draft를 여러 개 가질 수 있다 (이론상). limit=1로 최신 draft 하나만 가져오고, `ORDER BY created_at DESC`가 기본값이므로 가장 최근 draft가 반환된다.
- **usePromptDraft 로딩 처리** — prompts/[id].tsx에서 prompt 로딩과 draft 조회가 동시에 진행된다. draft 쿼리는 `isLoading` 중에도 버튼을 비활성화하거나 "확인 중" 상태를 표시해야 UX가 깔끔하다.
