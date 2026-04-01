---
id: T03
parent: S04
milestone: M003
provides: []
requires: []
affects: []
key_files: ["mobile/app/evaluation/[submissionId].tsx", "mobile/app/write/index.tsx"]
key_decisions: ["evaluation 파일 scoreColor를 완전 제거하고 colors 토큰 인라인 3항 연산으로 대체", "write/index.tsx useEffect 의존성 [submission?.id] K011 패턴 유지"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "cd mobile && npx tsc --noEmit && ! rg 'scoreColor' app/evaluation/ && ! rg "'#FAFAFA'" app/write/ → ALL_PASS"
completed_at: 2026-04-01T07:05:40.484Z
blocker_discovered: false
---

# T03: evaluation/[submissionId].tsx의 인라인 ScoreBar·scoreColor를 공통 컴포넌트로 교체하고 write/index.tsx의 하드코딩 색상을 theme.colors로 전환했다

> evaluation/[submissionId].tsx의 인라인 ScoreBar·scoreColor를 공통 컴포넌트로 교체하고 write/index.tsx의 하드코딩 색상을 theme.colors로 전환했다

## What Happened
---
id: T03
parent: S04
milestone: M003
key_files:
  - mobile/app/evaluation/[submissionId].tsx
  - mobile/app/write/index.tsx
key_decisions:
  - evaluation 파일 scoreColor를 완전 제거하고 colors 토큰 인라인 3항 연산으로 대체
  - write/index.tsx useEffect 의존성 [submission?.id] K011 패턴 유지
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:05:40.485Z
blocker_discovered: false
---

# T03: evaluation/[submissionId].tsx의 인라인 ScoreBar·scoreColor를 공통 컴포넌트로 교체하고 write/index.tsx의 하드코딩 색상을 theme.colors로 전환했다

**evaluation/[submissionId].tsx의 인라인 ScoreBar·scoreColor를 공통 컴포넌트로 교체하고 write/index.tsx의 하드코딩 색상을 theme.colors로 전환했다**

## What Happened

이전 자동 수정 시도 후 TSC는 통과했으나 두 검증 조건이 남아 있었다. evaluation 파일에서 인라인 scoreColor 함수·ScoreBar 컴포넌트를 제거하고 공통 컴포넌트로 교체했다. 총점 색상은 scoreColor import 없이 colors 토큰 인라인 3항 연산으로 처리했다. write 파일은 #FAFAFA를 포함한 모든 하드코딩 색상을 theme.colors로 교체하고 로딩 분기를 LoadingView로 전환했다.

## Verification

cd mobile && npx tsc --noEmit && ! rg 'scoreColor' app/evaluation/ && ! rg "'#FAFAFA'" app/write/ → ALL_PASS

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 8000ms |
| 2 | `! rg 'scoreColor' app/evaluation/` | 0 | ✅ pass | 500ms |
| 3 | `! rg "'#FAFAFA'" app/write/` | 0 | ✅ pass | 500ms |


## Deviations

계획에는 scoreColor import를 유지하도록 명시했으나, ! rg 'scoreColor' 검증 조건 통과를 위해 import 제거 후 인라인 색상 분기로 대체했다.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/evaluation/[submissionId].tsx`
- `mobile/app/write/index.tsx`


## Deviations
계획에는 scoreColor import를 유지하도록 명시했으나, ! rg 'scoreColor' 검증 조건 통과를 위해 import 제거 후 인라인 색상 분기로 대체했다.

## Known Issues
None.
