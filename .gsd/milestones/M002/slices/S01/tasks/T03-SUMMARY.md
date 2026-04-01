---
id: T03
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["mobile/app/(tabs)/index.tsx", "mobile/app/(tabs)/history.tsx", "mobile/app/prompts/[id].tsx", "mobile/app/write/[submissionId].tsx", "mobile/app/evaluation/[submissionId].tsx"]
key_decisions: ["write/[submissionId].tsx에서 lastSavedContent.current 업데이트를 mutation onSuccess 대신 await 직후 직접 수행 — 콜백 타이밍 의존 없이 명시적 순서 보장", "useEffect 의존성을 submission?.id로 설정 — 동일 submission 내 content 변경 시 초기화 재실행 방지", "prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰 retry 버튼 제거 — TanStack Query 자체 재시도로 처리"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "npm run typecheck 0 errors, grep으로 fetchPrompt/fetchHistory/fetchSubmission/fetchEvaluation 패턴 없음 확인 — 슬라이스 검증 명령 ALL PASS."
completed_at: 2026-04-01T04:29:52.571Z
blocker_discovered: false
---

# T03: 5개 화면 모두에서 fetch/useEffect/useState(loading) 블록을 제거하고 TanStack Query hooks로 교체, typecheck 0 errors 확인

> 5개 화면 모두에서 fetch/useEffect/useState(loading) 블록을 제거하고 TanStack Query hooks로 교체, typecheck 0 errors 확인

## What Happened
---
id: T03
parent: S01
milestone: M002
key_files:
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/[submissionId].tsx
  - mobile/app/evaluation/[submissionId].tsx
key_decisions:
  - write/[submissionId].tsx에서 lastSavedContent.current 업데이트를 mutation onSuccess 대신 await 직후 직접 수행 — 콜백 타이밍 의존 없이 명시적 순서 보장
  - useEffect 의존성을 submission?.id로 설정 — 동일 submission 내 content 변경 시 초기화 재실행 방지
  - prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰 retry 버튼 제거 — TanStack Query 자체 재시도로 처리
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:29:52.571Z
blocker_discovered: false
---

# T03: 5개 화면 모두에서 fetch/useEffect/useState(loading) 블록을 제거하고 TanStack Query hooks로 교체, typecheck 0 errors 확인

**5개 화면 모두에서 fetch/useEffect/useState(loading) 블록을 제거하고 TanStack Query hooks로 교체, typecheck 0 errors 확인**

## What Happened

5개 화면을 순서대로 전환했다. index.tsx는 usePrompts()로, history.tsx는 useEvaluationHistory() + useScoreTrend()로, prompts/[id].tsx는 usePrompt() + useCreateSubmission()으로, write/[submissionId].tsx는 useSubmission() + useSaveSubmission() + useSubmitSubmission() + useEvaluate() 4개 hooks로, evaluation/[submissionId].tsx는 useEvaluation()으로 교체. write 화면에서는 useEffect([submission?.id]) 패턴으로 첫 로드 시에만 content 초기화하고, lastSavedContent.current는 await 직후 직접 업데이트하여 mutation onSuccess 타이밍 의존을 없앴다. 모든 ApiError 직접 import와 useState(loading/error/data) 블록, fetchXxx useCallback + useEffect 패턴이 완전히 제거되었다.

## Verification

npm run typecheck 0 errors, grep으로 fetchPrompt/fetchHistory/fetchSubmission/fetchEvaluation 패턴 없음 확인 — 슬라이스 검증 명령 ALL PASS.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npm run typecheck` | 0 | ✅ pass | 2900ms |
| 2 | `cd mobile && npm run typecheck && ! grep -r 'useEffect.*fetch\|fetchPrompt\|fetchHistory\|fetchSubmission\|fetchEvaluation' app/ --include='*.tsx' && echo 'ALL PASS'` | 0 | ✅ pass | 2500ms |


## Deviations

prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰에서 retry 버튼 제거 — TanStack Query 자체 재시도가 처리하므로 수동 refetch 불필요.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/history.tsx`
- `mobile/app/prompts/[id].tsx`
- `mobile/app/write/[submissionId].tsx`
- `mobile/app/evaluation/[submissionId].tsx`


## Deviations
prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰에서 retry 버튼 제거 — TanStack Query 자체 재시도가 처리하므로 수동 refetch 불필요.

## Known Issues
None.
