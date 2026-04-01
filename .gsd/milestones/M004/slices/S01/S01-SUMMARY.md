---
id: S01
parent: M004
milestone: M004
provides:
  - Indigo 팔레트 기반 theme.ts 디자인 토큰 시스템 (colors/spacing/radius/shadow/typography)
  - 리디자인된 공통 컴포넌트 4종 (Badge, ScoreBar, LoadingView, ErrorView)
  - 전 앱 화면 하드코딩 색상 제거 완료 — mobile/app/ .tsx 파일 내 헥스 색상 리터럴 전무
requires:
  []
affects:
  []
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
key_decisions:
  - Indigo #5C6BC0을 주조색으로 선택 — 언어학습 앱의 지적·신뢰감 컨셉과 부합
  - 배경색 #F8F7FF(Indigo 미세 틴트 오프화이트) — 순백보다 눈에 부드럽고 팔레트 일관성 강화
  - shadow를 bar/card/elevated 3레벨로 계층화 — 헤더/카드/플로팅 요소 분리감 확보
  - typography 시스템 토큰화 — 전 화면에서 폰트 크기/굵기 일관성 보장
  - expo-router headerStyle은 StyleSheet 내 스프레드로 shadow.bar 병합 — 배열 미지원 우회
  - K013 준수: app/ 화면에서 scoreColor 인라인 3항 연산 사용
  - 삭제 액션 배경 #F44336 → colors.danger(#C62828) — 위험 의미론 테마 일관성
patterns_established:
  - theme.ts 단일 파일에 colors/spacing/radius/shadow(3레벨)/typography/animation 토큰 집약 — 모든 화면이 이 파일 하나에서 import
  - expo-router headerStyle에 shadow 토큰 적용 시 StyleSheet.create 내 스프레드 병합 패턴
  - expo-linear-gradient 없이 반투명 흰색 오버레이(position:absolute)로 그라데이션 유사 효과 구현
  - 공통 컴포넌트(ErrorView)를 인라인 에러 View 대신 사용하는 일관성 확보
  - 버튼 의미론적 색상 분리: 신규 액션=primary, 계속 액션=primaryDark
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M004/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T03-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T04-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T05-SUMMARY.md
  - .gsd/milestones/M004/slices/S01/tasks/T06-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:46:09.583Z
blocker_discovered: false
---

# S01: 디자인 토큰 + 공통 컴포넌트 + 전체 화면 리디자인

**Indigo 팔레트 기반 theme.ts 완전 재작성 + 공통 컴포넌트 4종 리디자인 + 앱 전체 6개 화면 하드코딩 색상 전면 제거**

## What Happened

M004 S01은 단일 슬라이스에서 디자인 시스템 전체를 교체하는 작업이었다. 총 6개 태스크가 순차적으로 실행되었으며, 각 태스크 사이의 의존성(theme.ts → 공통 컴포넌트 → 레이아웃 → 화면)이 명확하게 설계되어 있었다.

**T01** — theme.ts를 Indigo(#5C6BC0) 기반으로 완전 재작성. colors, spacing, radius, shadow(bar/card/elevated 3레벨), typography 시스템, 애니메이션 토큰, scoreColor/scoreBgColor 함수를 한 파일에 집약. 기존 API와 호환성을 유지하면서 새 토큰을 추가해 하위 호환성 보장. 배경색으로 #F8F7FF(Indigo 미세 틴트 오프화이트)를 선택하여 순백보다 눈에 부드럽고 팔레트 일관성을 강화했다.

**T02** — theme.ts 토큰을 Badge, ScoreBar, LoadingView, ErrorView 4개 공통 컴포넌트에 전면 적용. expo-linear-gradient 미설치 상황에서 ScoreBar 그라데이션을 반투명 흰색 오버레이 레이어로 우회 구현했다. Badge에 StatusBadge 변형 추가, ErrorView를 원형 아이콘 배지 + shadow.card 카드 레이아웃으로 재설계했다.

**T03** — _layout.tsx(루트 레이아웃)와 (tabs)/_layout.tsx(탭 레이아웃) 정제. expo-router headerStyle은 배열을 지원하지 않으므로 StyleSheet 내 스프레드로 shadow.bar를 병합하는 패턴을 확립했다. 탭바 높이를 iOS 84px / Android 60px으로 플랫폼별 분기하고, 스플래시 하드코딩 색상을 테마 토큰으로 교체했다.

**T04** — index.tsx(주제 목록)와 prompts/[id].tsx(주제 상세)의 모든 하드코딩 색상을 테마 토큰으로 교체. 주제 상세 화면의 description 영역을 surfaceElevated 카드 + 레이블로 감싸 시각 계층을 강화했다(계획 외 추가이나 API 변경 없음). 버튼 두 종류(작성 시작: primary, 이어서 작성: primaryDark)를 색으로 구분했다.

**T05** — write/index.tsx(답안 작성)와 evaluation/[submissionId].tsx(평가 결과)의 하드코딩 색상 전면 제거. statusBanner를 warningLight 배경 + 좌측 3px warning 보더로 재설계, evaluation totalCard를 점수 구간별 light 배경색으로 동적 적용, feedbackCard 배경을 primarySurface로 교체. K013 패턴을 준수하여 scoreColor import 없이 인라인 3항 연산으로 총점 색상을 처리했다.

**T06** — history.tsx의 #2196F3(ActivityIndicator), #F44336(삭제 버튼), 기타 수치 리터럴 모두 테마 토큰으로 교체. 슬라이스 전체 검증(tsc + rg 헥스 색상 검사)을 통과하며 마무리했다. mobile/app/ 디렉토리 내 .tsx 파일에서 헥스 색상 하드코딩이 단 하나도 남지 않았다.

## Verification

슬라이스 레벨 검증 3종 모두 통과:
1. `cd mobile && npx tsc --noEmit` → exit 0, 출력 없음
2. `! rg "'#2196F3'" mobile/app/` → exit 0 (해당 문자열 없음)
3. `! rg "'#4CAF50'" mobile/app/` → exit 0 (해당 문자열 없음)
4. `! rg "'#[0-9A-Fa-f]{3,6}'" mobile/app/ -g '*.tsx'` → exit 0 (헥스 색상 하드코딩 전무)

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

- T02: expo-linear-gradient 미설치로 ScoreBar 그라데이션을 반투명 오버레이 레이어로 구현 (기능적으로 동등)
- T02: Badge에 StatusBadge 변형 추가
- T04: prompts/[id].tsx description 카드 UI + 레이블 추가 (계획 외, API 변경 없음)
- T05: evaluation/[submissionId].tsx 인라인 에러 View를 ErrorView 공통 컴포넌트로 교체

## Known Limitations

expo-linear-gradient가 설치되면 ScoreBar의 그라데이션 효과를 실제 LinearGradient로 개선할 수 있다. 현재는 반투명 오버레이로 유사 효과를 냄.

## Follow-ups

없음. 이 슬라이스는 M004의 유일한 슬라이스이므로 마일스톤 전체가 완료된다.

## Files Created/Modified

- `mobile/lib/theme.ts` — Indigo 팔레트 기반 디자인 토큰 시스템 완전 재작성
- `mobile/components/Badge.tsx` — 새 테마 토큰 적용, StatusBadge 변형 추가
- `mobile/components/ScoreBar.tsx` — 테마 토큰 적용, 반투명 오버레이 그라데이션 효과 추가
- `mobile/components/LoadingView.tsx` — shadow.card 카드 래퍼로 업그레이드
- `mobile/components/ErrorView.tsx` — 원형 아이콘 배지 + 카드 레이아웃으로 재설계
- `mobile/app/_layout.tsx` — shadow.bar 헤더 적용, 스플래시 색상 토큰화, AppTheme notification 완성
- `mobile/app/(tabs)/_layout.tsx` — shadow.bar 헤더, 플랫폼별 탭바 높이 적용
- `mobile/app/(tabs)/index.tsx` — 모든 하드코딩 색상/수치를 테마 토큰으로 교체
- `mobile/app/prompts/[id].tsx` — 테마 토큰 교체, description 카드 UI 추가
- `mobile/app/write/index.tsx` — 테마 토큰 교체, statusBanner 재설계
- `mobile/app/evaluation/[submissionId].tsx` — 테마 토큰 교체, 점수 구간별 동적 배경, ErrorView 컴포넌트 교체
- `mobile/app/(tabs)/history.tsx` — 모든 하드코딩 색상/수치를 테마 토큰으로 교체
