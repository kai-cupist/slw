---
id: T02
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["mobile/lib/hooks/queries.ts", "mobile/lib/hooks/mutations.ts"]
key_decisions: ["useSaveSubmission / useSubmitSubmission의 onSuccess에서 queryClient.invalidateQueries 호출 — 화면이 캐시 무효화를 직접 신경 쓸 필요 없음", "useEvaluate는 onSuccess invalidate 생략 — 평가 화면이 별도 useEvaluation hook으로 결과를 fetch하는 구조이므로 중복 불필요"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "태스크 검증 명령(파일 존재 + 심볼 grep)과 TypeScript 컴파일(npx tsc --noEmit) 모두 통과."
completed_at: 2026-04-01T04:23:21.990Z
blocker_discovered: false
---

# T02: mobile/lib/hooks/ 디렉토리에 6개 query hooks와 4개 mutation hooks를 작성하여 5개 화면이 공유할 데이터 패칭 레이어 완성

> mobile/lib/hooks/ 디렉토리에 6개 query hooks와 4개 mutation hooks를 작성하여 5개 화면이 공유할 데이터 패칭 레이어 완성

## What Happened
---
id: T02
parent: S01
milestone: M002
key_files:
  - mobile/lib/hooks/queries.ts
  - mobile/lib/hooks/mutations.ts
key_decisions:
  - useSaveSubmission / useSubmitSubmission의 onSuccess에서 queryClient.invalidateQueries 호출 — 화면이 캐시 무효화를 직접 신경 쓸 필요 없음
  - useEvaluate는 onSuccess invalidate 생략 — 평가 화면이 별도 useEvaluation hook으로 결과를 fetch하는 구조이므로 중복 불필요
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:23:21.991Z
blocker_discovered: false
---

# T02: mobile/lib/hooks/ 디렉토리에 6개 query hooks와 4개 mutation hooks를 작성하여 5개 화면이 공유할 데이터 패칭 레이어 완성

**mobile/lib/hooks/ 디렉토리에 6개 query hooks와 4개 mutation hooks를 작성하여 5개 화면이 공유할 데이터 패칭 레이어 완성**

## What Happened

mobile/lib/hooks/queries.ts와 mutations.ts를 새로 생성했다. queries.ts는 useQuery 기반 6개 훅(usePrompts, usePrompt, useSubmission, useEvaluation, useEvaluationHistory, useScoreTrend)을 포함하며, staleTime을 목록/상세 5분 vs 제출/평가 30초~1분으로 분리했다. mutations.ts는 useMutation 기반 4개 훅(useCreateSubmission, useSaveSubmission, useSubmitSubmission, useEvaluate)을 포함하며, 저장/제출 뮤테이션은 onSuccess에서 queryClient.invalidateQueries로 캐시를 자동 무효화한다. 모든 타입은 lib/types.ts, API 호출은 lib/api.ts에서 import했다.

## Verification

태스크 검증 명령(파일 존재 + 심볼 grep)과 TypeScript 컴파일(npx tsc --noEmit) 모두 통과.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `test -f mobile/lib/hooks/queries.ts && test -f mobile/lib/hooks/mutations.ts && grep -q 'usePrompts' mobile/lib/hooks/queries.ts && grep -q 'useSaveSubmission' mobile/lib/hooks/mutations.ts && echo 'OK'` | 0 | ✅ pass | 50ms |
| 2 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 8000ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/lib/hooks/queries.ts`
- `mobile/lib/hooks/mutations.ts`


## Deviations
None.

## Known Issues
None.
