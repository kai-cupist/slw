# S01: 네비게이션 UI 개선 (탭 아이콘·뒤로가기) — UAT

**Milestone:** M003
**Written:** 2026-04-01T06:37:10.570Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: 코드 변경이 레이아웃 파일 2개에 한정되고 tsc 타입 검사 + 코드 grep으로 정확성을 확인할 수 있다.

## Preconditions

- `/Users/cupist/workspace/slw/mobile` 디렉토리에서 `npx tsc --noEmit`이 통과해야 한다.
- `mobile/app/(tabs)/_layout.tsx`와 `mobile/app/_layout.tsx`가 존재해야 한다.

## Smoke Test

```bash
cd mobile && npx tsc --noEmit
```
exit 0이면 기본 동작 확인.

## Test Cases

### 1. 탭 아이콘 코드 존재 확인

1. `mobile/app/(tabs)/_layout.tsx` 파일을 연다.
2. `SymbolView` import가 `expo-symbols`에서 있는지 확인한다.
3. `index` Tabs.Screen options에 `tabBarIcon`이 있고 `list.bullet` 아이콘명이 포함되어 있는지 확인한다.
4. `history` Tabs.Screen options에 `tabBarIcon`이 있고 `clock.arrow.circlepath` 아이콘명이 포함되어 있는지 확인한다.
5. **Expected:** 두 탭 모두 tabBarIcon prop이 선언되어 있고, focused 여부에 따라 weight가 'semibold'/'regular'로 분기된다.

### 2. 뒤로가기 minimal 모드 코드 확인

1. `mobile/app/_layout.tsx` 파일을 연다.
2. `prompts/[id]` Stack.Screen options에 `headerBackButtonDisplayMode: 'minimal'`이 있는지 확인한다.
3. `write/index` Stack.Screen options에 동일 속성이 있는지 확인한다.
4. `evaluation/[submissionId]` Stack.Screen options에 동일 속성이 있는지 확인한다.
5. **Expected:** 세 화면 모두 headerBackButtonDisplayMode가 'minimal'로 설정되어 있다.

### 3. 타입 검사 통과

```bash
cd /Users/cupist/workspace/slw/mobile && npx tsc --noEmit
```
**Expected:** exit code 0, 에러 출력 없음.

## Edge Cases

### SymbolView name prop 타입

SymbolView의 name에 문자열이 아닌 `{ ios, android, web }` 객체를 전달하는 것이 expo-symbols API와 호환되는지 tsc가 검증한다. tsc 통과가 곧 타입 호환성 증명.

## Failure Signals

- tsc exit 1 → SymbolView 타입 불일치 또는 headerBackButtonDisplayMode 타입 에러
- tabBarIcon grep 실패 → 아이콘 미구현
- headerBackButtonDisplayMode grep 실패 → 뒤로가기 미정비

## Not Proven By This UAT

- 실기기/시뮬레이터에서 아이콘이 실제로 렌더링되는지
- Android에서 Material Icons 폴백 아이콘이 올바르게 표시되는지
- minimal 모드에서 뒤로가기 화살표만 노출되고 텍스트가 없는지 (시각적 검증)

## Notes for Tester

검증 스크립트의 grep은 반드시 `mobile/` 디렉토리 안에서 실행해야 한다. 프로젝트 루트(`slw/`)에서 실행하면 `app/(tabs)/_layout.tsx` 경로를 찾지 못해 false negative가 발생한다.
