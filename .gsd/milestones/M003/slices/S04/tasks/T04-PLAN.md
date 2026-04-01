---
estimated_steps: 29
estimated_files: 1
skills_used: []
---

# T04: 이력 화면 스타일 교체 + 삭제 버튼 isPending 처리

history.tsx에서 DIFFICULTY_COLORS/scoreColor/MiniBar 인라인 정의를 제거하고 theme/Badge/ScoreBar 컴포넌트로 교체한다. 동시에 S03 follow-up인 삭제 버튼 isPending → disabled 처리를 추가한다.

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

## Inputs

- `mobile/lib/theme.ts`
- `mobile/components/Badge.tsx`
- `mobile/components/ScoreBar.tsx`
- `mobile/components/LoadingView.tsx`
- `mobile/components/ErrorView.tsx`
- `mobile/app/(tabs)/history.tsx`

## Expected Output

- `mobile/app/(tabs)/history.tsx`

## Verification

cd mobile && npx tsc --noEmit && ! rg 'DIFFICULTY_COLORS|scoreColor' app/
