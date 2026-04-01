---
id: T01
parent: S01
milestone: M004
provides: []
requires: []
affects: []
key_files: ["mobile/lib/theme.ts"]
key_decisions: ["Indigo #5C6BC0을 주조색으로 선택 — 언어학습 앱의 지적·신뢰감 컨셉과 부합", "배경색을 #F8F7FF(Indigo 미세 틴트 오프화이트)로 설정 — 순백보다 눈에 부드럽고 색 일관성 강화", "그림자 색상도 Indigo 계열(#3949AB)로 통일하여 배경과 카드 간 분리감 고급스럽게 처리", "typography 시스템 토큰화 — 각 화면에서 일관된 폰트 크기/굵기 사용"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "tsc --noEmit 통과 (출력 없음)"
completed_at: 2026-04-01T07:26:17.986Z
blocker_discovered: false
---

# T01: Indigo 팔레트 + 타이포그래피 시스템으로 theme.ts 완전 재작성

> Indigo 팔레트 + 타이포그래피 시스템으로 theme.ts 완전 재작성

## What Happened
---
id: T01
parent: S01
milestone: M004
key_files:
  - mobile/lib/theme.ts
key_decisions:
  - Indigo #5C6BC0을 주조색으로 선택 — 언어학습 앱의 지적·신뢰감 컨셉과 부합
  - 배경색을 #F8F7FF(Indigo 미세 틴트 오프화이트)로 설정 — 순백보다 눈에 부드럽고 색 일관성 강화
  - 그림자 색상도 Indigo 계열(#3949AB)로 통일하여 배경과 카드 간 분리감 고급스럽게 처리
  - typography 시스템 토큰화 — 각 화면에서 일관된 폰트 크기/굵기 사용
duration: ""
verification_result: passed
completed_at: 2026-04-01T07:26:17.986Z
blocker_discovered: false
---

# T01: Indigo 팔레트 + 타이포그래피 시스템으로 theme.ts 완전 재작성

**Indigo 팔레트 + 타이포그래피 시스템으로 theme.ts 완전 재작성**

## What Happened

Indigo 기반 새 디자인 토큰 시스템 정의. 색상 팔레트, 간격, 반경, 그림자(3레벨), 타이포그래피 시스템을 theme.ts에 집약. 기존 colors/spacing/radius/shadow API와 호환성 유지하면서 새 토큰 추가. scoreColor/scoreBgColor 함수 제공.

## Verification

tsc --noEmit 통과 (출력 없음)

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && npx tsc --noEmit` | 0 | ✅ pass | 4200ms |


## Deviations

scoreBgColor 함수 추가 (평가 화면 배경 활용 목적), typography 시스템 추가

## Known Issues

없음

## Files Created/Modified

- `mobile/lib/theme.ts`


## Deviations
scoreBgColor 함수 추가 (평가 화면 배경 활용 목적), typography 시스템 추가

## Known Issues
없음
