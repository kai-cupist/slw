# S04: 전체 UI 디자인 개선

**Goal:** 앱 전체 6개 화면에 통일된 디자인 토큰과 공통 컴포넌트를 적용하여 시각적 일관성을 확보하고, S03 follow-up인 삭제 버튼 isPending 처리를 완료한다.
**Demo:** After this: 앱 전체 화면을 스크롤해봤을 때 일관된 디자인이 느껴진다.

## Tasks
- [x] **T01: theme.ts와 공통 컴포넌트 4개(Badge, ScoreBar, LoadingView, ErrorView)를 신규 생성하여 T02–T04 화면 교체의 기반 확보** — 이후 모든 화면 교체의 기반이 되는 theme.ts와 컴포넌트 파일 4개를 신규 생성한다.

## Steps

1. `mobile/lib/theme.ts` 생성:
   - `colors`: primary(#2196F3), success(#4CAF50), warning(#FF9800), danger(#F44336), background(#F0F2F5), surface(#FFFFFF), inputBackground(#FAFAFA), textPrimary(#212121), textSecondary(#666), textMuted(#999), border(#E0E0E0), difficulty({ beginner, intermediate, advanced }), category(#2196F3)
   - `spacing`: xs(4), sm(8), md(12), lg(16), xl(20), xxl(24)
   - `radius`: sm(8), md(12), lg(16)
   - `shadow.card`: shadowColor #000, offset {width:0,height:1}, opacity 0.1, radius 3, elevation 2
   - `scoreColor(score: number): string` 함수 export — 8이상 success, 5이상 warning, 미만 danger

2. `mobile/components/Badge.tsx` 생성:
   - `DifficultyBadge({ difficulty }: { difficulty: string })` — `theme.colors.difficulty[difficulty] ?? '#9E9E9E'`로 배경색 결정
   - `CategoryBadge({ category }: { category: string })` — 배경색 `theme.colors.category`
   - 공통 뱃지 스타일: paddingHorizontal 10, paddingVertical 3, borderRadius 12, 텍스트 fontSize 12, color white, fontWeight 500

3. `mobile/components/ScoreBar.tsx` 생성:
   - `ScoreBar({ label, score, size? }: { label: string; score: number; size?: 'normal' | 'mini' })` 하나의 컴포넌트로 통합
   - size='normal'(기본): 라벨 width 80, 바 height 10, 값 width 28, fontSize 14/16
   - size='mini': 라벨 width 36, 바 height 6, 값 width 24, fontSize 12/12
   - width 계산은 인라인 style로 적용 (`style={{ width: \`${(score/10)*100}%\` }}`). StyleSheet.create 내에 % 문자열 넣지 않음 (기존 코드와 동일 패턴 유지)
   - `scoreColor`는 `theme.ts`에서 import

4. `mobile/components/LoadingView.tsx` 생성:
   - `LoadingView({ text }: { text?: string })` — flex:1 중앙 정렬 View + ActivityIndicator(large, theme.colors.primary) + 텍스트(옵션)

5. `mobile/components/ErrorView.tsx` 생성:
   - `ErrorView({ message, onRetry }: { message: string; onRetry?: () => void })` — 에러 텍스트 + onRetry 있으면 '다시 시도' 버튼
   - 버튼 스타일: backgroundColor theme.colors.primary, paddingHorizontal 24, paddingVertical 10, borderRadius 8
  - Estimate: 45m
  - Files: mobile/lib/theme.ts, mobile/components/Badge.tsx, mobile/components/ScoreBar.tsx, mobile/components/LoadingView.tsx, mobile/components/ErrorView.tsx
  - Verify: test -f mobile/lib/theme.ts && test -f mobile/components/Badge.tsx && test -f mobile/components/ScoreBar.tsx && test -f mobile/components/LoadingView.tsx && test -f mobile/components/ErrorView.tsx && cd mobile && npx tsc --noEmit
- [x] **T02: index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS·badge 코드를 공통 Badge/LoadingView/ErrorView 컴포넌트로 교체했다** — index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS, DifficultyBadge, CategoryBadge를 제거하고 theme와 Badge 컴포넌트로 교체한다.

## Steps

1. `mobile/app/(tabs)/index.tsx` 수정:
   - 상단 `DIFFICULTY_COLORS` 상수, `DifficultyBadge`, `CategoryBadge` 인라인 함수 제거
   - `import { DifficultyBadge, CategoryBadge } from '../../components/Badge'` 추가
   - `import { LoadingView } from '../../components/LoadingView'` 추가
   - `import { ErrorView } from '../../components/ErrorView'` 추가
   - 로딩 분기: 기존 `<View style={styles.center}>...</View>` → `<LoadingView text="주제를 불러오는 중..." />`
   - 에러 분기: `<ErrorView message={error.message} onRetry={refetch} />`
   - renderItem 내 `<CategoryBadge>`, `<DifficultyBadge>` 사용은 그대로 유지 (import 경로만 변경)
   - StyleSheet에서 center, loadingText, errorText, retryButton, retryButtonText 스타일 제거 (LoadingView/ErrorView로 이동됨)
   - badge, badgeText 스타일도 제거 (컴포넌트 내부로 이동됨)
   - FlatList contentContainerStyle의 list padding은 유지
   - 화면 배경을 명시적으로 설정하려면 container View style에 `backgroundColor: theme.colors.background` 추가 (현재는 SystemBackground 기본값 사용 중이므로 선택적)

2. `mobile/app/prompts/[id].tsx` 수정:
   - `DIFFICULTY_COLORS` 상수 제거
   - `import { DifficultyBadge, CategoryBadge } from '../../components/Badge'` 추가
   - `import { LoadingView } from '../../components/LoadingView'` 추가
   - 로딩 분기 → `<LoadingView text="주제를 불러오는 중..." />`
   - 에러 분기: 재시도 버튼이 없으므로 기존 인라인 유지 또는 ErrorView 사용 (onRetry 없이)
   - `const difficultyColor = DIFFICULTY_COLORS[prompt.difficulty] ?? '#9E9E9E'` 라인 제거
   - metaRow 내 인라인 badge View 2개를 `<CategoryBadge category={prompt.category} />`, `<DifficultyBadge difficulty={prompt.difficulty} />` 로 교체
   - badge, badgeText StyleSheet 스타일 제거
  - Estimate: 30m
  - Files: mobile/app/(tabs)/index.tsx, mobile/app/prompts/[id].tsx
  - Verify: cd mobile && npx tsc --noEmit && ! rg 'DIFFICULTY_COLORS' app/\(tabs\)/index.tsx && ! rg 'DIFFICULTY_COLORS' app/prompts/
- [ ] **T03: 글쓰기 & 평가 화면에 theme/ScoreBar 컴포넌트 적용** — write/index.tsx와 evaluation/[submissionId].tsx에서 하드코딩된 색상과 인라인 컴포넌트를 theme와 공통 컴포넌트로 교체한다.

## Steps

1. `mobile/app/write/index.tsx` 수정:
   - `import { colors } from '../../lib/theme'` 추가
   - `import { LoadingView } from '../../components/LoadingView'` 추가
   - 로딩 분기 → `<LoadingView text="답안을 불러오는 중..." />`
   - 에러 분기(submissionIdParam && !isLoading && !submission) → 기존 인라인 에러 텍스트 유지 (재시도 없는 단순 에러라 ErrorView 선택적)
   - `textInput` StyleSheet의 `backgroundColor: '#FAFAFA'` → `backgroundColor: colors.inputBackground`
   - 기타 하드코딩 색상(#2196F3, #E0E0E0 등)도 theme.colors로 교체하되, 구조 변경 없이 값만 교체
   - 로딩/에러 분기의 center, loadingText 스타일은 LoadingView로 대체된 경우 제거

2. `mobile/app/evaluation/[submissionId].tsx` 수정:
   - 인라인 `scoreColor` 함수 제거
   - 인라인 `ScoreBar` 컴포넌트 함수 제거
   - `import { scoreColor } from '../../lib/theme'` 추가
   - `import { ScoreBar } from '../../components/ScoreBar'` 추가
   - `import { LoadingView } from '../../components/LoadingView'` 추가
   - 로딩 분기 → `<LoadingView text="평가 결과를 불러오는 중..." />`
   - SCORE_KEYS.map ScoreBar 렌더링은 그대로 유지 (컴포넌트 인터페이스 동일)
   - scoreColor 호출 부분(`evaluation.total_score`, `color: scoreColor(...)`)은 import 경로 변경만
   - ScoreBar 관련 StyleSheet(scoreRow, scoreLabel, barContainer, barFill, scoreValue)는 컴포넌트 내부로 이동됐으므로 제거
  - Estimate: 30m
  - Files: mobile/app/write/index.tsx, mobile/app/evaluation/[submissionId].tsx
  - Verify: cd mobile && npx tsc --noEmit && ! rg 'scoreColor' app/evaluation/ && ! rg "'#FAFAFA'" app/write/
- [ ] **T04: 이력 화면 스타일 교체 + 삭제 버튼 isPending 처리** — history.tsx에서 DIFFICULTY_COLORS/scoreColor/MiniBar 인라인 정의를 제거하고 theme/Badge/ScoreBar 컴포넌트로 교체한다. 동시에 S03 follow-up인 삭제 버튼 isPending → disabled 처리를 추가한다.

## Steps

1. `mobile/app/(tabs)/history.tsx` import 정리:
   - `DIFFICULTY_COLORS` 상수, `scoreColor` 함수, `MiniBar` 컴포넌트 인라인 정의 제거
   - `import { scoreColor } from '../../lib/theme'` 추가
   - `import { DifficultyBadge } from '../../components/Badge'` 추가
   - `import { ScoreBar } from '../../components/ScoreBar'` 추가
   - `import { LoadingView } from '../../components/LoadingView'` 추가
   - `import { ErrorView } from '../../components/ErrorView'` 추가

2. TrendSection 내 MiniBar 교체:
   - `<MiniBar score={t.grammar_score} label="문법" />` → `<ScoreBar score={t.grammar_score} label="문법" size="mini" />`
   - logic, expression, relevance 동일하게 교체
   - MiniBar 관련 StyleSheet(miniBarRow, miniBarLabel, miniBarContainer, miniBarFill, miniBarValue) 제거

3. renderItem 내 diffBadge 교체:
   - `const diffColor = DIFFICULTY_COLORS[item.prompt_difficulty] ?? '#9E9E9E'` 라인 제거
   - `<View style={[styles.diffBadge, { backgroundColor: diffColor }]}>` + 내부 Text → `<DifficultyBadge difficulty={item.prompt_difficulty} />`
   - diffBadge, diffBadgeText StyleSheet 스타일 제거

4. 로딩/에러 분기 교체:
   - 로딩 분기 → `<LoadingView text="이력을 불러오는 중..." />`
   - 에러 분기 → `<ErrorView message={error.message} onRetry={refetch} />`
   - center, loadingText, errorText, retryButton, retryButtonText StyleSheet 스타일 제거

5. 삭제 버튼 isPending 처리 (S03 follow-up):
   - `renderRightActions` 내 Pressable에 `disabled={deleteMutation.isPending}` 추가
   - disabled 상태 스타일: `opacity: deleteMutation.isPending ? 0.5 : 1`을 style에 추가하거나 StyleSheet conditional 사용
   - 중복 탭 방지로 연속 삭제 요청 차단

6. scoreColor 호출 부분(`{ color: scoreColor(item.total_score) }`, `{ color: scoreColor(t.total_score) }` 등)은 import 경로 변경만

7. 최종 전체 검증:
   - `cd mobile && npx tsc --noEmit` (exit 0)
   - `rg 'DIFFICULTY_COLORS|scoreColor' mobile/app` → 0건
  - Estimate: 45m
  - Files: mobile/app/(tabs)/history.tsx
  - Verify: cd mobile && npx tsc --noEmit && ! rg 'DIFFICULTY_COLORS|scoreColor' app/
