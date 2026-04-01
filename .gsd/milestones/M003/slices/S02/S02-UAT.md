# S02: 제출 로딩 UX 개선 — UAT

**Milestone:** M003
**Written:** 2026-04-01T06:42:48.095Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: UI 로딩 상태는 코드 패턴(isSubmitting state, submitPhase 텍스트, ActivityIndicator 렌더)으로 충분히 검증 가능하며, 실제 앱 실행 환경 없이도 TypeScript 컴파일과 코드 리뷰로 의도한 동작을 확인할 수 있다.

## Preconditions

- Node.js 및 mobile 의존성 설치 완료 (`cd mobile && npm install`)
- `mobile/app/write/index.tsx` 파일 존재
- TypeScript 컴파일 통과

## Smoke Test

`cd mobile && npx tsc --noEmit` — exit 0이면 기본 동작 확인.

## Test Cases

### 1. isSubmitting state 존재 확인

1. `cd mobile && grep -n 'isSubmitting' app/write/index.tsx` 실행
2. **Expected:** `useState(false)` 선언과 `setIsSubmitting` 호출이 보인다.

### 2. submitPhase state 존재 확인

1. `cd mobile && grep -n 'submitPhase' app/write/index.tsx` 실행
2. **Expected:** `useState('')` 선언과 각 단계별 `setSubmitPhase('저장 중...')` / `setSubmitPhase('제출 중...')` / `setSubmitPhase('AI 평가 중...')` 호출이 보인다.

### 3. 버튼 UI에 ActivityIndicator 분기 확인

1. `cd mobile && grep -A5 'isSubmitting ?' app/write/index.tsx` 실행
2. **Expected:** `ActivityIndicator`와 `submitPhase` 텍스트를 Row로 묶는 분기 코드가 보인다.

### 4. finally 블록에서 state 초기화 확인

1. `cd mobile && grep -n 'setIsSubmitting(false)\|setSubmitPhase' app/write/index.tsx` 실행
2. **Expected:** finally 블록 안에 `setIsSubmitting(false)` 와 `setSubmitPhase('')` 가 포함된다.

### 5. TextInput editable 조건 확인

1. `cd mobile && grep -n 'editable=' app/write/index.tsx` 실행
2. **Expected:** `!isSubmitted && !isSubmitting` 조건이 사용된다 (구버전 `submitting` 없음).

## Edge Cases

### evaluate.isPending 구조분해 제거 확인

1. `cd mobile && grep -n 'isPending: submitting\|submitting' app/write/index.tsx` 실행
2. **Expected:** `isPending: submitting` 패턴이 없다. `submitting` 단독 참조도 없다.

## Failure Signals

- `tsc --noEmit`가 exit 1이면 타입 에러 존재 — 파일 수정 필요
- `grep -q 'submitting'`이 매칭되면 구버전 참조가 남아있음

## Not Proven By This UAT

- 실제 앱 실행 중 UI 애니메이션 렌더링 (Expo 앱 빌드 필요)
- 네트워크 지연 상황에서 단계별 텍스트 전환 타이밍

## Notes for Tester

검증 게이트 grep은 반드시 `mobile/` 디렉토리로 cd 한 후 실행해야 한다. 워킹 디렉토리가 프로젝트 루트면 `app/write/index.tsx` 경로를 찾지 못한다.
