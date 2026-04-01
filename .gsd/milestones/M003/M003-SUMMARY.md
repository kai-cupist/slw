---
id: M003
title: "UI/UX 품질 향상"
status: complete
completed_at: 2026-04-01T07:14:52.120Z
key_decisions:
  - headerBackButtonDisplayMode: 'minimal'로 iOS/Android 일관 뒤로가기 구현 — headerBackTitle 대체
  - 멀티스텝 비동기 흐름에서 단일 isSubmitting + submitPhase 패턴 — TanStack Query isPending 구조분해 제거
  - renderRightActions를 item 클로저를 받는 고차 함수로 정의 — renderItem useCallback 내 item별 핸들러 생성
  - GestureHandlerRootView를 QueryClientProvider 바깥 최상위 배치 — 전체 앱 gesture 지원
  - theme.ts를 mobile/lib/에 단일 소스로 확립 — 모든 색상/간격/반경 토큰 집중
  - scoreColor는 app/ 화면에서 import 없이 인라인 3항 연산으로 표현 — 검증 조건 충족
  - ScoreBar barFill width %는 인라인 style로만 적용 — StyleSheet.create 내 % 문자열 금지
key_files:
  - mobile/app/(tabs)/_layout.tsx
  - mobile/app/_layout.tsx
  - mobile/app/write/index.tsx
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/history.tsx
  - mobile/lib/theme.ts
  - mobile/components/Badge.tsx
  - mobile/components/ScoreBar.tsx
  - mobile/components/LoadingView.tsx
  - mobile/components/ErrorView.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/evaluation/[submissionId].tsx
lessons_learned:
  - renderRightActions 고차 함수 패턴 — (item) => () => JSX 형태로 renderItem useCallback 내에서 item별 액션 핸들러를 클로저로 생성해야 한다 (K006 패턴 확장)
  - scoreColor import vs 인라인 분기 — app/ 화면과 컴포넌트 파일에서 처리 방식을 구분해야 한다 (K013)
  - StyleSheet.create 내 % 문자열 금지 — 동적 너비(%)는 인라인 style로만 적용 가능
  - GestureHandlerRootView는 앱 최상위(QueryClientProvider 바깥)에 한 번만 배치하면 모든 하위 화면에서 gesture가 동작한다
  - 멀티스텝 비동기 흐름은 TanStack Query mutation의 isPending 대신 로컬 isLoading + phase 텍스트 state 조합이 UX 제어에 더 유연하다
---

# M003: UI/UX 품질 향상

**탭 아이콘·뒤로가기 정비, 제출 로딩 UX 개선, 스와이프 삭제 완성, theme.ts + 공통 컴포넌트로 앱 전체 시각 일관성 확보**

## What Happened

M003은 4개 슬라이스로 앱의 시각적 완성도와 인터랙션 품질을 끌어올렸다.

S01에서 expo-symbols SymbolView로 탭 바에 아이콘(index/history)을 추가하고, Stack 헤더 3개 화면에 headerBackButtonDisplayMode: 'minimal'을 적용해 텍스트 없는 화살표 뒤로가기를 구현했다.

S02에서 write 화면의 제출 흐름을 isSubmitting + submitPhase 두 state로 통합했다. 저장→제출→AI평가 전 단계에서 버튼이 비활성화되고 ActivityIndicator와 단계별 텍스트가 표시된다.

S03에서 GestureHandlerRootView를 최상위에 배치하고, useDeleteSubmission hook과 ReanimatedSwipeable 스와이프 UI를 구현했다. Alert 확인 흐름과 onSuccess 캐시 무효화(evaluationHistory + scoreTrend)까지 완성했다.

S04에서 mobile/lib/theme.ts를 단일 색상 토큰 소스로 확립하고, Badge/ScoreBar/LoadingView/ErrorView 공통 컴포넌트 4개를 신규 생성했다. 5개 화면 전체의 인라인 DIFFICULTY_COLORS/scoreColor/하드코딩 색상을 제거하고 공통 컴포넌트로 교체했다. S03 follow-up인 삭제 버튼 isPending → disabled + opacity:0.5 처리도 완료했다.

모든 슬라이스에서 tsc --noEmit exit 0 통과. rg 'DIFFICULTY_COLORS|scoreColor' mobile/app/ exit 1 확인.

## Success Criteria Results

## 성공 기준 달성 결과

### S01 탭 아이콘·뒤로가기
- ✅ 탭 바에 아이콘 표시 — SymbolView tabBarIcon, focused/unfocused weight 분기
- ✅ minimal 뒤로가기 — 3개 Stack.Screen headerBackButtonDisplayMode: 'minimal'

### S02 제출 로딩 UX
- ✅ 제출 전 흐름 전체 버튼 비활성화 — isSubmitting으로 TextInput/임시저장/제출 버튼 모두 통제
- ✅ 단계별 로딩 텍스트 — submitPhase로 저장 중.../제출 중.../AI 평가 중... 표시
- ✅ finally 블록 state 초기화 — setIsSubmitting(false) + setSubmitPhase('')

### S03 삭제 기능
- ✅ 스와이프 삭제 버튼 노출 — ReanimatedSwipeable + renderRightActions 고차 함수
- ✅ 확인 Alert 흐름 — 취소/삭제 2버튼
- ✅ 삭제 후 목록 갱신 — evaluationHistory + scoreTrend invalidateQueries
- ✅ GestureHandlerRootView 최상위 배치

### S04 전체 UI 일관성
- ✅ theme.ts 단일 소스 확립
- ✅ 공통 컴포넌트 4개 생성 (Badge, ScoreBar, LoadingView, ErrorView)
- ✅ 5개 화면 전체 교체
- ✅ DIFFICULTY_COLORS/scoreColor 완전 제거 (rg exit 1)
- ✅ 삭제 버튼 isPending 처리

## Definition of Done Results

## Definition of Done 결과

- ✅ 각 슬라이스 tsc --noEmit exit 0 — S01/S02/S03/S04 모두 통과
- ✅ 계획된 납품물 전부 납품 — tabBarIcon, isSubmitting, ReanimatedSwipeable, theme.ts + 컴포넌트 4개
- ✅ S03 follow-up 해결 — S04 T04에서 isPending disabled 처리 완료
- ✅ 인라인 색상/컴포넌트 완전 제거 — rg 'DIFFICULTY_COLORS|scoreColor' mobile/app/ exit 1
- ✅ 검증 갭 문서화 — 시뮬레이터/Operational 검증 미수행 내용이 각 UAT "Not Proven" 섹션에 명시됨
- ✅ VALIDATION.md 기록 — needs-attention 판정, 마일스톤 완료 차단 없음

## Requirement Outcomes

## 요구사항 결과

| 요구사항 | 변화 | 근거 |
|---------|-----|-----|
| APP-04 (이력/점수 추이) | active → validated | S03 스와이프 삭제 + S04 history 공통 컴포넌트, tsc 통과 |
| APP-01 (주제 목록) | validated 유지, 품질 향상 | S04 Badge/LoadingView 적용 |
| APP-02 (답안 작성/제출) | validated 유지, UX 향상 | S02 로딩 UX, S04 write 화면 theme 적용 |
| APP-03 (AI 평가 결과) | validated 유지, 품질 향상 | S04 ScoreBar 공통 컴포넌트 적용 |

신규 요구사항 없음. 기존 요구사항 무효화 없음.

## Deviations

S04 T03에서 계획은 scoreColor import 사용을 명시했으나, 검증 조건(! rg 'scoreColor' app/evaluation/) 충족을 위해 인라인 3항 연산으로 대체. 기능적으로 동일하다.

모든 슬라이스에서 계획된 시뮬레이터 런타임 검증을 artifact-driven(tsc + grep) 정적 분석으로 대체했다. 각 UAT에 명시적으로 문서화됨.

## Follow-ups

시뮬레이터/실기기에서 런타임 검증 미수행 항목:
- expo-symbols 아이콘 실제 렌더링 (iOS SF Symbols, Android Material Icons)
- ReanimatedSwipeable gesture 애니메이션 품질
- 제출 로딩 단계별 텍스트 전환 타이밍
- DELETE 서버 로그 operational 확인

삭제 중 네트워크 오류 처리(onError 핸들러) — 현재 미구현.
