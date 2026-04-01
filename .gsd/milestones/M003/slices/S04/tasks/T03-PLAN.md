---
estimated_steps: 20
estimated_files: 2
skills_used: []
---

# T03: 글쓰기 & 평가 화면에 theme/ScoreBar 컴포넌트 적용

write/index.tsx와 evaluation/[submissionId].tsx에서 하드코딩된 색상과 인라인 컴포넌트를 theme와 공통 컴포넌트로 교체한다.

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

## Inputs

- `mobile/lib/theme.ts`
- `mobile/components/ScoreBar.tsx`
- `mobile/components/LoadingView.tsx`
- `mobile/app/write/index.tsx`
- `mobile/app/evaluation/[submissionId].tsx`

## Expected Output

- `mobile/app/write/index.tsx`
- `mobile/app/evaluation/[submissionId].tsx`

## Verification

cd mobile && npx tsc --noEmit && ! rg 'scoreColor' app/evaluation/ && ! rg "'#FAFAFA'" app/write/
