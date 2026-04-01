# S01: 디자인 토큰 + 공통 컴포넌트 + 전체 화면 리디자인

**Goal:** theme.ts 새 토큰 정의, 공통 컴포넌트 개선, 모든 화면 스타일 교체를 한 슬라이스에서 완료
**Demo:** After this: 앱 실행 시 Indigo 팔레트 기반 세련된 UI 표시

## Tasks
- [x] **T01: Indigo 팔레트 + 타이포그래피 시스템으로 theme.ts 완전 재작성** — Indigo(#5C6BC0) 기반 팔레트, 타이포그래피 시스템, 그림자 레벨, 애니메이션 토큰 정의
  - Estimate: 20m
  - Files: mobile/lib/theme.ts
  - Verify: tsc --noEmit
- [x] **T02: 새 Indigo 테마 토큰을 적용하여 Badge/ScoreBar/LoadingView/ErrorView 4개 공통 컴포넌트 리디자인 완료** — 새 테마 토큰 적용, ScoreBar 그라데이션 효과, LoadingView/ErrorView 업그레이드
  - Estimate: 30m
  - Files: mobile/components/Badge.tsx, mobile/components/ScoreBar.tsx, mobile/components/LoadingView.tsx, mobile/components/ErrorView.tsx
  - Verify: tsc --noEmit
- [x] **T03: _layout.tsx와 (tabs)/_layout.tsx에 shadow.bar 헤더, 탭바 높이 정제, 스플래시 색상 토큰화 적용** — _layout.tsx 헤더, 탭바 스타일 업그레이드
  - Estimate: 20m
  - Files: mobile/app/_layout.tsx, mobile/app/(tabs)/_layout.tsx
  - Verify: tsc --noEmit
- [ ] **T04: 주제 목록 + 주제 상세 화면 리디자인** — index.tsx (주제 목록), prompts/[id].tsx (주제 상세) 스타일 전면 교체
  - Estimate: 30m
  - Files: mobile/app/(tabs)/index.tsx, mobile/app/prompts/[id].tsx
  - Verify: tsc --noEmit
- [ ] **T05: 글쓰기 + 평가 결과 화면 리디자인** — write/index.tsx, evaluation/[submissionId].tsx 스타일 전면 교체
  - Estimate: 30m
  - Files: mobile/app/write/index.tsx, mobile/app/evaluation/[submissionId].tsx
  - Verify: tsc --noEmit
- [ ] **T06: 이력 화면 리디자인 + 전체 검증** — history.tsx 스타일 교체, 전체 tsc + 구 색상 하드코딩 제거 검증
  - Estimate: 30m
  - Files: mobile/app/(tabs)/history.tsx
  - Verify: tsc --noEmit && ! rg "'#2196F3'" mobile/app/ && ! rg "'#4CAF50'" mobile/app/
