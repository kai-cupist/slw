---
id: T02
parent: S02
milestone: M002
provides: []
requires: []
affects: []
key_files: ["mobile/lib/hooks/queries.ts", "mobile/app/prompts/[id].tsx"]
key_decisions: ["draftLoading 중에는 '작성 시작' 버튼을 disabled+spinner 처리하여 draft 조회 완료 전 중복 생성 방지", "existingDraft 유무로 단순 조건 분기 — 로딩 완료 후 draft 있으면 continueButton, 없으면 startButton"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd mobile && npx tsc --noEmit (0 errors) + grep 확인 — ALL PASS"
completed_at: 2026-04-01T04:56:51.598Z
blocker_discovered: false
---

# T02: usePromptDraft hook을 추가하고 prompts/[id].tsx에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시

> usePromptDraft hook을 추가하고 prompts/[id].tsx에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시

## What Happened
---
id: T02
parent: S02
milestone: M002
key_files:
  - mobile/lib/hooks/queries.ts
  - mobile/app/prompts/[id].tsx
key_decisions:
  - draftLoading 중에는 '작성 시작' 버튼을 disabled+spinner 처리하여 draft 조회 완료 전 중복 생성 방지
  - existingDraft 유무로 단순 조건 분기 — 로딩 완료 후 draft 있으면 continueButton, 없으면 startButton
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:56:51.599Z
blocker_discovered: false
---

# T02: usePromptDraft hook을 추가하고 prompts/[id].tsx에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시

**usePromptDraft hook을 추가하고 prompts/[id].tsx에서 draft 유무에 따라 "이어서 작성"/"작성 시작" 버튼을 분기 표시**

## What Happened

mobile/lib/hooks/queries.ts에 usePromptDraft hook 추가 — T01에서 추가된 서버 promptId 필터를 활용하여 /submissions?status=draft&promptId={id}&limit=1로 조회. prompts/[id].tsx에서 draft 유무에 따라 초록색 "이어서 작성" / 파란색 "작성 시작" 버튼을 분기 표시하고, draftLoading 중에는 "작성 시작" 버튼을 disabled+spinner로 처리하여 중복 생성 방지.

## Verification

cd mobile && npx tsc --noEmit (0 errors) + grep 확인 — ALL PASS

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit 2>&1 | tail -10` | 0 | ✅ pass | 2700ms |
| 2 | `grep -q 'usePromptDraft' lib/hooks/queries.ts` | 0 | ✅ pass | 5ms |
| 3 | `grep -q '이어서 작성' app/prompts/\[id\].tsx` | 0 | ✅ pass | 5ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/lib/hooks/queries.ts`
- `mobile/app/prompts/[id].tsx`


## Deviations
None.

## Known Issues
None.
