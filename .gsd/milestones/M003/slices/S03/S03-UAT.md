# S03: 삭제 기능 완성 — UAT

**Milestone:** M003
**Written:** 2026-04-01T06:51:29.943Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: 스와이프 삭제는 실기기/시뮬레이터에서만 gesture 동작을 확인할 수 있으나, 구현 정확성(import, hook 연결, 컴파일)은 정적 분석으로 검증 가능하다.

## Preconditions

1. `mobile/` 디렉토리에서 `npx tsc --noEmit`이 exit 0으로 통과할 것.
2. 서버(`docker compose up`)와 앱(`npx expo start`)이 실행 중이어야 실기기/시뮬레이터 테스트 가능.
3. 평가 이력이 최소 1건 이상 존재해야 한다 (주제 선택 → 답안 작성 → 제출 → 평가 완료).

## Smoke Test

`cd mobile && npx tsc --noEmit`이 에러 없이 통과하고, `grep -q 'GestureHandlerRootView' app/_layout.tsx`, `grep -q 'useDeleteSubmission' lib/hooks/mutations.ts`, `grep -q 'ReanimatedSwipeable' 'app/(tabs)/history.tsx'` 세 명령이 모두 exit 0을 반환하면 기본 구현이 존재한다.

## Test Cases

### 1. 스와이프 삭제 버튼 노출 확인

1. 앱에서 하단 탭 "이력" 화면으로 이동한다.
2. 이력 카드 중 하나를 왼쪽으로 스와이프한다.
3. **Expected:** 빨간색(#F44336) 배경의 "삭제" 텍스트 버튼(width 80)이 카드 오른쪽에 노출된다.

### 2. 삭제 확인 Alert 동작

1. 이력 카드를 왼쪽으로 스와이프해 삭제 버튼을 노출한다.
2. 빨간 "삭제" 버튼을 탭한다.
3. **Expected:** "이 이력을 삭제하시겠습니까?"라는 Alert가 표시되고, "취소"와 "삭제" 두 버튼이 보인다.

### 3. 취소 동작

1. 삭제 Alert에서 "취소" 버튼을 탭한다.
2. **Expected:** Alert가 닫히고 이력 카드가 목록에 그대로 남아 있다.

### 4. 삭제 확정 후 목록 갱신

1. 이력 카드를 스와이프해 "삭제" → Alert에서 "삭제"를 탭한다.
2. **Expected:** 해당 카드가 목록에서 사라진다. 점수 추이 섹션도 갱신된다(evaluationHistory + scoreTrend invalidate).

### 5. 삭제 후 서버 데이터 일치 확인

1. 삭제를 확정한다.
2. 앱을 완전히 재시작(force quit 후 재오픈)한다.
3. **Expected:** 삭제한 이력이 목록에 나타나지 않는다 (soft delete가 서버에 반영됨).

## Edge Cases

### GestureHandlerRootView 미래 슬라이스 호환성

1. S04에서 다른 화면에 gesture 기반 컴포넌트를 추가해도 동작해야 한다.
2. **Expected:** `_layout.tsx`의 GestureHandlerRootView가 앱 전체를 감싸므로 추가 래핑 없이 동작한다.

### 빈 이력 화면

1. 모든 이력을 삭제한다.
2. **Expected:** "아직 평가 이력이 없습니다." 빈 상태 메시지가 표시된다.

## Failure Signals

- 스와이프 시 아무것도 나타나지 않음 → GestureHandlerRootView가 누락되었거나 ReanimatedSwipeable import가 잘못됨.
- Alert가 뜨지 않고 즉시 삭제됨 → renderRightActions 내 Alert.alert 호출 누락.
- 삭제 후 목록이 갱신되지 않음 → useDeleteSubmission의 invalidateQueries가 잘못된 queryKey를 참조함.
- tsc 에러 → 타입 불일치 (submission_id 타입, mutate 인자 타입 등).

## Not Proven By This UAT

- 실기기에서의 실제 gesture 반응 속도 및 애니메이션 품질 (artifact-driven 검증의 한계).
- 삭제 중 네트워크 오류 처리 (onError 핸들러 미구현).
- 동시에 여러 항목 삭제 시 중복 요청 방지 (isPending UI 처리 미구현).

## Notes for Tester

- ReanimatedSwipeable은 react-native-gesture-handler 2.x에 포함된 컴포넌트다. `react-native-gesture-handler/ReanimatedSwipeable` 경로로 import한다.
- 시뮬레이터에서 스와이프 테스트 시 트랙패드 두 손가락 스와이프로 gesture를 시뮬레이션할 수 있다.
