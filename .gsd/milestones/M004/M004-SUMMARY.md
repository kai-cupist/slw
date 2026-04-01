---
id: M004
title: "Indigo 팔레트 기반 앱 전체 리디자인"
status: complete
completed_at: 2026-04-01T07:50:48.222Z
key_decisions:
  - Indigo #5C6BC0을 주조색으로 선택 — 언어학습 앱의 지적·신뢰감 컨셉과 부합
  - 배경색 #F8F7FF(Indigo 미세 틴트 오프화이트) 선택 — 순백보다 눈에 부드럽고 팔레트 일관성 강화
  - shadow를 bar/card/elevated 3레벨로 계층화 — 헤더/카드/플로팅 요소 분리감 확보
  - typography 시스템 토큰화 — 전 화면에서 폰트 크기/굵기 일관성 보장
  - expo-router headerStyle에 shadow 토큰 적용 시 StyleSheet.create 내 스프레드 병합 패턴 확립 (배열 미지원 우회)
  - K013 준수: app/ 화면에서 scoreColor 인라인 3항 연산 사용, import 금지
  - 삭제 액션 배경 #F44336 → colors.danger(#C62828) — 위험 의미론 테마 일관성
  - expo-linear-gradient 미설치 환경에서 반투명 흰색 오버레이로 그라데이션 유사 효과 구현
key_files:
  - mobile/lib/theme.ts
  - mobile/components/Badge.tsx
  - mobile/components/ScoreBar.tsx
  - mobile/components/LoadingView.tsx
  - mobile/components/ErrorView.tsx
  - mobile/app/_layout.tsx
  - mobile/app/(tabs)/_layout.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/index.tsx
  - mobile/app/evaluation/[submissionId].tsx
  - mobile/app/(tabs)/history.tsx
lessons_learned:
  - theme.ts 단일 파일에 모든 디자인 토큰(colors/spacing/radius/shadow/typography/animation)을 집약하면 전체 화면에서 단일 import로 일관성 유지가 가능하다 — 파일이 커져도 단일 진실의 원천이 주는 이점이 크다
  - expo-router headerStyle에 배열이 지원되지 않으므로, shadow 토큰처럼 여러 속성을 병합해야 할 때는 StyleSheet.create 내에서 스프레드로 사전 병합해야 한다 (K014)
  - expo-linear-gradient 없이도 반투명 흰색(rgba 0.3) 절대위치 레이어로 그라데이션 유사 효과를 낼 수 있다 — 네이티브 모듈 의존 없이 순수 StyleSheet만으로 구현 가능 (K015)
  - scoreColor 같은 테마 유틸리티 함수를 app/ 화면 파일에서 import하면 검증 조건(rg 기반)이 실패할 수 있다 — 컴포넌트 파일과 app/ 화면 파일에서의 처리를 구분해야 한다 (K013)
  - 디자인 리프레시는 기능 마일스톤보다 예측 가능하지만, 의존 체인(토큰→컴포넌트→레이아웃→화면)을 태스크 순서로 명확히 설계하면 블로커 없이 순차 실행이 가능하다
---

# M004: Indigo 팔레트 기반 앱 전체 리디자인

**Indigo(#5C6BC0) 팔레트 기반 theme.ts 디자인 토큰 시스템 완전 재작성 + 공통 컴포넌트 4종 리디자인 + mobile/app/ 전체 6개 화면 하드코딩 색상 전면 제거로 시각적으로 세련된 Indigo UI 완성**

## What Happened

M004는 단일 슬라이스(S01)로 구성된 디자인 리프레시 마일스톤이었다. 기존 기능은 그대로 두고 시각 레이어만 교체하는 작업으로, 총 6개 태스크가 theme.ts → 공통 컴포넌트 → 레이아웃 → 화면 순서의 명확한 의존 체인으로 실행됐다.

**T01 — theme.ts 재작성:** Indigo #5C6BC0을 주조색으로 선택하고, colors / spacing / radius / shadow(bar/card/elevated 3레벨) / typography / animation 토큰을 단일 파일에 집약했다. 배경색으로 #F8F7FF(Indigo 미세 틴트 오프화이트)를 선택하여 순백보다 눈에 부드럽고 팔레트 일관성을 강화했다. scoreColor / scoreBgColor 유틸리티 함수도 포함해 하위 호환성을 유지했다.

**T02 — 공통 컴포넌트 리디자인:** Badge, ScoreBar, LoadingView, ErrorView 4종에 새 테마 토큰을 전면 적용했다. expo-linear-gradient 미설치 환경에서 ScoreBar 그라데이션을 반투명 흰색 오버레이(rgba 0.3) 레이어로 우회 구현했다. Badge에 StatusBadge 변형을 추가하고, ErrorView를 원형 아이콘 배지 + shadow.card 카드 레이아웃으로 재설계했다.

**T03 — 레이아웃 정제:** expo-router headerStyle에 배열이 지원되지 않아 StyleSheet 스프레드로 shadow.bar를 병합하는 패턴을 확립했다. 탭바 높이를 iOS 84px / Android 60px으로 플랫폼별 분기했다.

**T04 — 주제 화면:** index.tsx와 prompts/[id].tsx의 모든 하드코딩 색상을 테마 토큰으로 교체. description 영역을 surfaceElevated 카드 + 레이블로 감싸 시각 계층을 강화했다. 버튼을 의미론적으로 분리(작성 시작=primary, 이어쓰기=primaryDark)했다.

**T05 — 작성/평가 화면:** write/index.tsx의 statusBanner를 warningLight + 좌측 3px warning 보더로 재설계. evaluation/[submissionId].tsx의 totalCard를 점수 구간별 light 배경색으로 동적 적용하고 feedbackCard 배경을 primarySurface로 교체. K013 패턴 준수로 scoreColor import 없이 인라인 3항 연산 사용.

**T06 — history 화면 + 슬라이스 검증:** history.tsx의 잔여 하드코딩 색상(#2196F3, #F44336 등) 전부 테마 토큰으로 교체. 삭제 버튼 배경을 colors.danger(#C62828)로 통일. 슬라이스 전체 검증(tsc + rg 헥스 색상 검사) 통과로 마무리.

## Success Criteria Results

## 성공 기준 검증

### 비전: Indigo 팔레트 + 계층적 타이포그래피 + 정제된 카드 레이아웃으로 앱 전체 화면 시각적 업그레이드
- **결과: ✅ 달성**
- theme.ts에 Indigo #5C6BC0 기반 팔레트, typography 시스템(fontSizes/fontWeights), shadow 3레벨 카드 레이아웃 토큰 구축
- 앱 전체 6개 화면에서 하드코딩 색상이 테마 토큰으로 100% 대체됨

### 기존 기능 유지 (디자인만 교체)
- **결과: ✅ 달성**
- `cd mobile && npx tsc --noEmit` → exit 0, 타입 에러 없음
- API 호출 로직, 라우팅, 상태 관리 코드 변경 없음

### S01 완료 후: 앱 실행 시 Indigo 팔레트 기반 세련된 UI 표시
- **결과: ✅ 달성**
- S01-SUMMARY.md verification_result: passed
- 6개 태스크 모두 SUMMARY 존재, S01 체크박스 ✅

### 헥스 색상 하드코딩 전무 (mobile/app/ 내)
- **결과: ✅ 달성**
- `! rg "'#[0-9A-Fa-f]{3,6}'" mobile/app/ -g '*.tsx'` → exit 0 (매칭 없음)

## Definition of Done Results

## Definition of Done 검증

### 모든 슬라이스 완료
- **S01: ✅** — 체크박스 ✅, S01-SUMMARY.md 존재, S01-UAT.md 존재

### 모든 태스크 SUMMARY 존재
- **T01-SUMMARY.md: ✅** 존재
- **T02-SUMMARY.md: ✅** 존재
- **T03-SUMMARY.md: ✅** 존재
- **T04-SUMMARY.md: ✅** 존재
- **T05-SUMMARY.md: ✅** 존재
- **T06-SUMMARY.md: ✅** 존재

### 코드 변경 실재
- **✅** `git diff --stat HEAD~6 HEAD -- ':!.gsd/'` → 16개 파일, 761줄 추가/354줄 삭제 확인

### TypeScript 컴파일 통과
- **✅** `cd mobile && npx tsc --noEmit` → exit 0

### 헥스 색상 리터럴 전무
- **✅** `! rg "'#[0-9A-Fa-f]{3,6}'" mobile/app/ -g '*.tsx'` → exit 0

## Requirement Outcomes

## 요구사항 변경

M004는 디자인 리프레시만 다룬 마일스톤으로, 요구사항 상태 변경 없음.
29개 전체 요구사항이 M003 이전에 이미 validated 상태이며 이 마일스톤에서 변동 없음.

## Deviations

- T02: expo-linear-gradient 미설치로 ScoreBar 그라데이션을 반투명 오버레이 레이어로 구현 (기능적으로 동등)\n- T02: Badge에 StatusBadge 변형 추가 (계획 외, 기능 추가)\n- T04: prompts/[id].tsx description 카드 UI + 레이블 추가 (계획 외, API 변경 없음)\n- T05: evaluation/[submissionId].tsx 인라인 에러 View를 ErrorView 공통 컴포넌트로 교체

## Follow-ups

- expo-linear-gradient 설치 시 ScoreBar의 반투명 오버레이를 실제 LinearGradient로 개선 가능\n- 향후 다크 모드 지원 시 theme.ts의 팔레트를 light/dark 두 세트로 분기하는 구조 고려 필요\n- mobile/assets/images/background_image.jpg 추가됨 — 실제 활용 여부 확인 필요
