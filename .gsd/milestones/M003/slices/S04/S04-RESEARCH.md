# S04 — 전체 UI 디자인 개선 Research

**Date:** 2026-04-01

## Summary

현재 앱은 6개 화면(주제 목록, 주제 상세, 글쓰기, 평가 결과, 이력)이 동작하고 있으며 기능적으로 완성됐지만, 스타일이 파일별로 분산되어 있고 공통 디자인 언어가 없다. 화면 배경(`#FAFAFA` 또는 흰색)이 카드(`#fff`)와 같아서 카드 사이 구분이 섀도우에만 의존한다. 색상 상수(`DIFFICULTY_COLORS`, `scoreColor`)와 Badge 컴포넌트가 3개 파일에 중복 정의되어 있다. S03 follow-up으로 삭제 버튼에 isPending 상태가 반영되지 않는 문제도 남아 있다.

이 슬라이스의 목표는 일관된 디자인 토큰 파일 + 공통 UI 컴포넌트 추출 → 각 화면 스타일 업데이트 순서로 진행한다. 화면 구조는 그대로 두고 시각적 일관성과 완성도만 높인다.

## Recommendation

1. `mobile/lib/theme.ts` — 색상, spacing, borderRadius, typography, shadow 토큰 정의  
2. `mobile/components/` 디렉토리 신설, 공통 컴포넌트 추출 (Badge, ScoreBar, LoadingView, ErrorView)  
3. 화면 배경을 `#F0F2F5`로 통일해 카드가 띄워 보이는 효과  
4. 각 화면의 StyleSheet를 토큰 기반으로 교체  
5. history.tsx의 삭제 버튼 isPending → disabled + 불투명도로 처리 (S03 follow-up)

직접 구현 우선 정책에 맞게 추가 라이브러리 없이 StyleSheet + 컴포넌트 추출만 사용한다.

## Implementation Landscape

### Key Files

- `mobile/app/(tabs)/index.tsx` — `DIFFICULTY_COLORS`, `DifficultyBadge`, `CategoryBadge` 인라인 정의. 공통 컴포넌트로 교체 대상
- `mobile/app/(tabs)/history.tsx` — `DIFFICULTY_COLORS`, `scoreColor` 중복 + 인라인 배지 스타일. 삭제 버튼 isPending 미처리
- `mobile/app/prompts/[id].tsx` — `DIFFICULTY_COLORS` 재정의, 배지 인라인 스타일
- `mobile/app/write/index.tsx` — 배경색 `#FAFAFA` 하드코딩
- `mobile/app/evaluation/[submissionId].tsx` — `scoreColor` 인라인 정의, 섹션별 카드 구조

**신규 생성 파일:**
- `mobile/lib/theme.ts` — 색상 팔레트, spacing 스케일, shadow preset, typography scale
- `mobile/components/Badge.tsx` — `DifficultyBadge` + `CategoryBadge` 통합
- `mobile/components/ScoreBar.tsx` — `ScoreBar` (evaluation 화면) + `MiniBar` (history TrendSection) — 동일 패턴이므로 size prop으로 구분
- `mobile/components/LoadingView.tsx` — 중앙 ActivityIndicator + 텍스트 (5개 화면 동일 패턴)
- `mobile/components/ErrorView.tsx` — 에러 텍스트 + 재시도 버튼 (index, history에서 사용)

### Build Order

1. **T01 — 디자인 토큰 및 공통 컴포넌트 추출** (`theme.ts` + `components/` 4개 파일)  
   → 이후 모든 화면 교체의 기반. 독립 작업
2. **T02 — 주제 목록 & 주제 상세 화면 스타일 업데이트** (`index.tsx`, `prompts/[id].tsx`)  
   → T01 depends. 공통 컴포넌트 최초 소비 검증
3. **T03 — 글쓰기 & 평가 화면 스타일 업데이트** (`write/index.tsx`, `evaluation/[submissionId].tsx`)  
   → T01 depends. T02와 독립 실행 가능하지만 순서대로 처리하는 게 검증 연속성에 좋음
4. **T04 — 이력 화면 스타일 업데이트 + 삭제 isPending 처리** (`history.tsx`)  
   → T01, T02 depends. ReanimatedSwipeable 구조 유지하면서 스타일만 교체, 삭제 버튼 disabled 추가

### Verification Approach

각 태스크 후: `cd mobile && npx tsc --noEmit` (exit 0) 확인  
전체 완료 후: `rg "DIFFICULTY_COLORS\|scoreColor" mobile/app` → 0건 (토큰 파일로 이동)

## Constraints

- `GestureHandlerRootView`가 `_layout.tsx` 최상위에 있으므로 건드리지 않는다
- `ReanimatedSwipeable` 구조(`renderRightActions` 고차 함수 패턴)는 변경 없이 스타일만 수정
- React Native StyleSheet 기반 — styled-components 등 추가 라이브러리 없음
- write 화면 `TextInput`의 `backgroundColor: '#FAFAFA'`는 theme 토큰으로 교체

## Common Pitfalls

- **`width: \`${percent}%\`` 타입** — `StyleSheet.create` 내부에서 % 문자열이 허용되지 않는 경우가 있다. ScoreBar에서 인라인 style로 적용 중인 현재 방식을 유지한다
- **공통 컴포넌트 파일 위치** — `mobile/components/`가 신규 디렉토리이므로 `tsconfig.json` path alias 불필요. 상대 경로로 import
