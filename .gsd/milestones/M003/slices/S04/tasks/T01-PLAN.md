---
estimated_steps: 23
estimated_files: 5
skills_used: []
---

# T01: 디자인 토큰 파일 및 공통 UI 컴포넌트 4개 생성

이후 모든 화면 교체의 기반이 되는 theme.ts와 컴포넌트 파일 4개를 신규 생성한다.

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

## Inputs

- `mobile/app/(tabs)/index.tsx`
- `mobile/app/(tabs)/history.tsx`
- `mobile/app/evaluation/[submissionId].tsx`

## Expected Output

- `mobile/lib/theme.ts`
- `mobile/components/Badge.tsx`
- `mobile/components/ScoreBar.tsx`
- `mobile/components/LoadingView.tsx`
- `mobile/components/ErrorView.tsx`

## Verification

test -f mobile/lib/theme.ts && test -f mobile/components/Badge.tsx && test -f mobile/components/ScoreBar.tsx && test -f mobile/components/LoadingView.tsx && test -f mobile/components/ErrorView.tsx && cd mobile && npx tsc --noEmit
