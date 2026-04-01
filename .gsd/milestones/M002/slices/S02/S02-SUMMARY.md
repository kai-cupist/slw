---
id: S02
parent: M002
milestone: M002
provides:
  - GET /submissions?promptId={n} 필터 — S03에서 mutation 후 invalidateQueries 대상으로 활용 가능
  - usePromptDraft hook — 다른 화면에서 재사용 가능
  - prompts/[id].tsx draft 분기 UX — S03 자동 갱신의 기반
requires:
  - slice: S01
    provides: TanStack Query 기반 useQuery/useMutation 인프라, api 클라이언트, queries.ts/mutations.ts 파일 구조
affects:
  - S03
key_files:
  - mobile/lib/hooks/queries.ts
  - mobile/app/prompts/[id].tsx
  - server/src/submissions/dto/get-submissions.dto.ts
  - server/src/submissions/submissions.repository.ts
  - server/src/submissions/submissions.service.ts
key_decisions:
  - promptId 필터는 기존 status 필터와 동일한 paramIndex 카운터 패턴으로 동적 WHERE 절에 append
  - draftLoading 중 '작성 시작' 버튼 disabled+spinner 처리 — draft 조회 완료 전 중복 submission 생성 방지
  - existingDraft 유무로 단순 분기 — continueButton은 새 submission 생성 없이 기존 draft ID로 직접 /write/{id} 이동
patterns_established:
  - 서버 promptId 필터 패턴: DTO @Type(() => Number) + @IsInt(), Repository 동적 WHERE paramIndex append, Service 전달 — 동일 패턴으로 다른 필터 추가 가능
  - 클라이언트 draft 존재 확인 패턴: useQuery enabled:!!promptId + staleTime 30s + items[0] ?? null 추출
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M002/slices/S02/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S02/tasks/T02-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:58:27.631Z
blocker_discovered: false
---

# S02: Submissions 임시저장-이어쓰기 흐름 완성

**서버에 GET /submissions?promptId= 필터를 추가하고, 클라이언트에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시하는 흐름을 완성했다**

## What Happened

T01에서 서버 측 작업을 처리했다: GetSubmissionsDto에 @Type(() => Number) + @IsInt() 데코레이터로 promptId?: number 필드를 추가하고, SubmissionsRepository.findAllByUser의 동적 WHERE 절 빌더에 기존 paramIndex 카운터 패턴으로 s.prompt_id = $N 조건을 추가했으며, SubmissionsService.findAll에서 이를 전달하도록 연결했다. npm run build로 타입 에러 없이 빌드됨을 확인했다.

T02에서 클라이언트 측 흐름을 구현했다: mobile/lib/hooks/queries.ts에 usePromptDraft hook을 추가하여 /submissions?status=draft&promptId={id}&limit=1로 현재 프롬프트의 draft를 조회한다. prompts/[id].tsx에서 draftLoading 중에는 "작성 시작" 버튼을 disabled+spinner로 처리하고, 로딩 완료 후 existingDraft 유무에 따라 초록색 "이어서 작성" 버튼(→ /write/{draft.id} 직접 이동) 또는 파란색 "작성 시작" 버튼(→ createSubmission 후 이동)을 분기 표시한다.

verification gate 실패는 코드 자체의 문제가 아니었다 — grep 명령이 프로젝트 루트에서 실행되어 mobile/ 서브디렉토리의 상대 경로를 찾지 못했다. mobile/ 디렉토리 내에서 실행하면 두 grep 모두 성공하고, tsc --noEmit도 에러 없이 완료된다.

## Verification

T01: cd server && npm run build → 타입 에러 없이 빌드 성공 (exit 0)
T02: cd mobile && npx tsc --noEmit → 0 errors (exit 0)
T02: cd mobile && grep -q 'usePromptDraft' lib/hooks/queries.ts → exit 0
T02: cd mobile && grep -q '이어서 작성' 'app/prompts/[id].tsx' → exit 0

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

None.

## Known Limitations

draft 조회는 staleTime 30초로 설정되어 있어, 다른 기기에서 draft를 생성하거나 삭제했을 때 최대 30초간 UI가 실제 상태와 다를 수 있다. S03의 mutation 후 자동 갱신(invalidateQueries)이 완성되면 같은 기기 내에서는 즉각 반영된다.

## Follow-ups

S03에서 제출(submit) mutation 이후 promptDraft 쿼리를 invalidate하면 "이어서 작성" → 제출 완료 후 버튼이 "작성 시작"으로 자동 전환된다. 이 연결은 S03에서 자연스럽게 처리될 것이다.

## Files Created/Modified

- `server/src/submissions/dto/get-submissions.dto.ts` — promptId?: number 필드 추가 (@Type, @IsInt, @IsOptional, @ApiPropertyOptional)
- `server/src/submissions/submissions.repository.ts` — findAllByUser filters 타입에 promptId?: number 추가, 동적 WHERE 절에 s.prompt_id = $N 조건 append
- `server/src/submissions/submissions.service.ts` — findAllByUser 호출 시 promptId: dto.promptId 전달
- `mobile/lib/hooks/queries.ts` — usePromptDraft hook 추가 — /submissions?status=draft&promptId=&limit=1 조회
- `mobile/app/prompts/[id].tsx` — usePromptDraft import, draft 유무에 따른 '이어서 작성'/'작성 시작' 버튼 분기, continueButton 스타일 추가
