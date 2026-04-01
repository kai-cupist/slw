---
estimated_steps: 23
estimated_files: 2
skills_used: []
---

# T02: 주제 목록 & 주제 상세 화면에 theme/Badge 컴포넌트 적용

index.tsx와 prompts/[id].tsx에서 인라인 DIFFICULTY_COLORS, DifficultyBadge, CategoryBadge를 제거하고 theme와 Badge 컴포넌트로 교체한다.

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

## Inputs

- `mobile/lib/theme.ts`
- `mobile/components/Badge.tsx`
- `mobile/components/LoadingView.tsx`
- `mobile/components/ErrorView.tsx`
- `mobile/app/(tabs)/index.tsx`
- `mobile/app/prompts/[id].tsx`

## Expected Output

- `mobile/app/(tabs)/index.tsx`
- `mobile/app/prompts/[id].tsx`

## Verification

cd mobile && npx tsc --noEmit && ! rg 'DIFFICULTY_COLORS' app/\(tabs\)/index.tsx && ! rg 'DIFFICULTY_COLORS' app/prompts/
