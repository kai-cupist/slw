---
id: S02
parent: M003
milestone: M003
provides:
  - write 화면 제출 버튼이 전체 제출 흐름(저장→제출→AI평가) 동안 비활성화되고 단계별 진행 텍스트를 표시하는 기능
requires:
  []
affects:
  - S04
key_files:
  - mobile/app/write/index.tsx
key_decisions:
  - evaluate.isPending 직접 구조분해 제거, 단일 isSubmitting state로 전체 제출 흐름 커버
  - 멀티스텝 비동기 흐름에서 단일 isLoading + phase 텍스트 state 패턴 적용
patterns_established:
  - 멀티스텝 비동기 흐름: 단일 isLoading state + phase 텍스트 state 조합으로 각 단계의 진행 상황을 UI에 표시하는 패턴
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M003/slices/S02/tasks/T01-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T06:42:48.095Z
blocker_discovered: false
---

# S02: 제출 로딩 UX 개선

**write 화면 제출 흐름 전체(저장→제출→AI평가)를 단일 isSubmitting + submitPhase state로 통합하고 단계별 진행 텍스트를 ActivityIndicator와 함께 표시**

## What Happened

기존 코드는 TanStack Query의 `evaluate.isPending`을 `submitting`으로 구조분해하여 제출 버튼 상태를 제어했다. 이 방식은 submitSubmission 단계 동안 버튼이 active 상태로 남는 문제가 있었다.

T01에서 `isSubmitting + submitPhase` 두 개의 로컬 state를 추가하고, handleSubmit 전체를 try/finally로 감싸 단계마다 submitPhase 텍스트(저장 중.../제출 중.../AI 평가 중...)를 갱신하도록 재구성했다. evaluate의 `isPending: submitting` 구조분해를 제거하고, 버튼 UI를 isSubmitting 분기로 교체하여 ActivityIndicator와 단계 텍스트를 Row로 표시한다. TextInput editable 조건과 임시저장 버튼 disabled 조건도 모두 isSubmitting으로 통일했다.

## Verification

cd mobile && npx tsc --noEmit → exit 0 (타입 에러 없음). grep으로 isSubmitting, submitPhase, 'AI 평가 중' 세 패턴 모두 mobile/app/write/index.tsx에서 확인.

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

None.

## Follow-ups

None.

## Files Created/Modified

- `mobile/app/write/index.tsx` — isSubmitting + submitPhase state 추가, handleSubmit 전체 흐름 통합, 제출 버튼 UI에 ActivityIndicator + 단계 텍스트 표시
