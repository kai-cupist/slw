---
id: T05
parent: S01
milestone: M004
provides: []
requires: []
affects: []
key_files: ["mobile/app/write/index.tsx", "mobile/app/evaluation/[submissionId].tsx"]
key_decisions: ["statusBanner를 warningLight 배경 + 좌측 3px warning 보더로 재설계", "evaluation totalCard를 점수 구간별 light 배경색으로 동적 적용", "feedbackCard 배경을 primarySurface로 교체하여 Indigo 팔레트 통합", "K013 준수: scoreColor import 없이 인라인 3항 연산으로 총점 색상 처리", "evaluation에 ErrorView 컴포넌트 추가"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit 실행 결과 출력 없이 종료 코드 0. ! rg '#2196F3' / ! rg '#4CAF50' 모두 통과."
completed_at: 2026-04-01T07:41:40.673Z
blocker_discovered: false
---

# T05: write/index.tsx와 evaluation/[submissionId].tsx의 하드코딩 색상을 전부 Indigo 테마 토큰으로 교체하고 레이아웃 정제 완료

> write/index.tsx와 evaluation/[submissionId].tsx의 하드코딩 색상을 전부 Indigo 테마 토큰으로 교체하고 레이아웃 정제 완료

## What Happened
---
id: T05
parent: S01
milestone: M004
key_files:
  - mobile/app/write/index.tsx
  - mobile/app/evaluation/[submissionId].tsx
key_decisions:
  - statusBanner를 warningLight 배경 + 좌측 3px warning 보더로 재설계
  - evaluation totalCard를 점수 구간별 light 배경색으로 동적 적용
  - feedbackCard 배경을 primarySurface로 교체하여 Indigo 팔레트 통합
  - K013 준수: scoreColor import 없이 인라인 3항 연산으로 총점 색상 처리
  - evaluation에 ErrorView 컴포넌트 추가
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:41:40.674Z
blocker_discovered: false
---

# T05: write/index.tsx와 evaluation/[submissionId].tsx의 하드코딩 색상을 전부 Indigo 테마 토큰으로 교체하고 레이아웃 정제 완료

**write/index.tsx와 evaluation/[submissionId].tsx의 하드코딩 색상을 전부 Indigo 테마 토큰으로 교체하고 레이아웃 정제 완료**

## What Happened

write/index.tsx에서 '#fff', #FFF3E0/#E65100 하드코딩을 모두 제거. statusBanner를 warningLight 배경 + 좌측 3px warning 보더로 재설계. footer에 shadow.bar와 surface 배경 적용. evaluation/[submissionId].tsx에서 totalCard를 점수 구간별 light 배경색으로 동적 적용, feedbackCard 배경을 primarySurface로 교체, ErrorView 공통 컴포넌트 교체, K013 준수 인라인 3항 연산으로 총점 색상 처리.

## Verification

tsc --noEmit 실행 결과 출력 없이 종료 코드 0. ! rg '#2196F3' / ! rg '#4CAF50' 모두 통과.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 3100ms |
| 2 | `! rg "'#2196F3'" mobile/app/` | 0 | ✅ pass | 100ms |
| 3 | `! rg "'#4CAF50'" mobile/app/` | 0 | ✅ pass | 100ms |


## Deviations

evaluation/[submissionId].tsx에서 기존 인라인 에러 View를 ErrorView 컴포넌트로 교체 — 계획에는 명시되지 않았으나 T02에서 확립된 공통 컴포넌트 패턴 일관 적용.

## Known Issues

None.

## Files Created/Modified

- `mobile/app/write/index.tsx`
- `mobile/app/evaluation/[submissionId].tsx`


## Deviations
evaluation/[submissionId].tsx에서 기존 인라인 에러 View를 ErrorView 컴포넌트로 교체 — 계획에는 명시되지 않았으나 T02에서 확립된 공통 컴포넌트 패턴 일관 적용.

## Known Issues
None.
