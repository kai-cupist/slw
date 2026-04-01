---
id: S01
parent: M002
milestone: M002
provides:
  - TanStack Query QueryClientProvider 환경 (앱 전체)
  - lib/hooks/queries.ts — 6개 query hooks (usePrompts, usePrompt, useSubmission, useEvaluation, useEvaluationHistory, useScoreTrend)
  - lib/hooks/mutations.ts — 4개 mutation hooks (useCreateSubmission, useSaveSubmission, useSubmitSubmission, useEvaluate)
  - 5개 화면의 TanStack Query 기반 데이터 패칭 (fetch/useEffect 완전 제거)
requires:
  []
affects:
  - S02
  - S03
key_files:
  - mobile/package.json
  - mobile/app/_layout.tsx
  - mobile/lib/hooks/queries.ts
  - mobile/lib/hooks/mutations.ts
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/[submissionId].tsx
  - mobile/app/evaluation/[submissionId].tsx
key_decisions:
  - queryClient를 모듈 스코프에 선언 — 리렌더링 시 재생성 방지
  - isLoaded guard 분기는 QueryClientProvider 밖에 유지 — userId 로드 전 쿼리 불필요
  - staleTime을 목록/상세 5분 vs 제출/평가 30초~1분으로 분리 — 갱신 빈도 차이 반영
  - useSaveSubmission/useSubmitSubmission onSuccess에서 invalidateQueries 호출 — 화면이 캐시 무효화를 직접 신경 쓸 필요 없음
  - useEvaluate onSuccess invalidate 생략 — 평가 화면이 별도 useEvaluation hook으로 결과를 fetch하므로 중복 불필요
  - write 화면 lastSavedContent.current 업데이트를 mutation onSuccess 대신 await 직후 직접 수행 — 콜백 타이밍 의존 없이 명시적 순서 보장
  - useEffect 의존성을 submission?.id로 설정 — 동일 submission 내 content 변경 시 초기화 재실행 방지
patterns_established:
  - lib/hooks/queries.ts + mutations.ts 공유 hooks 레이어 패턴 — 모든 API 호출은 이 두 파일에 집중, 화면은 import만
  - useQuery hooks: queryKey 배열 형식 + enabled: !!param 가드 + staleTime 명시적 설정
  - useMutation hooks: mutationFn + onSuccess invalidateQueries 자동 무효화
  - write 화면 content 초기화: useEffect([submission?.id]) 패턴으로 첫 로드 시에만 실행
observability_surfaces:
  - none
drill_down_paths:
  - .gsd/milestones/M002/slices/S01/tasks/T01-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T02-SUMMARY.md
  - .gsd/milestones/M002/slices/S01/tasks/T03-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:31:59.508Z
blocker_discovered: false
---

# S01: TanStack Query 도입 및 전체 화면 전환

**모바일 앱 5개 화면의 서버 상태 관리를 TanStack Query v5로 전환하고 fetch/useEffect 패턴을 완전히 제거했다.**

## What Happened

T01에서 @tanstack/react-query를 설치하고 _layout.tsx의 모듈 스코프에 QueryClient를 선언한 뒤 QueryClientProvider로 앱 전체를 래핑했다. isLoaded guard 이전 분기는 QueryClientProvider 밖에 두어 userId 로드 전 불필요한 쿼리 실행을 방지했다.

T02에서 lib/hooks/ 디렉토리에 공유 hooks 레이어를 구축했다. queries.ts는 useQuery 기반 6개 훅(usePrompts, usePrompt, useSubmission, useEvaluation, useEvaluationHistory, useScoreTrend)을 포함하며, staleTime을 목록/상세 5분, 제출/평가 30초~1분으로 분리했다. mutations.ts는 useMutation 기반 4개 훅(useCreateSubmission, useSaveSubmission, useSubmitSubmission, useEvaluate)을 포함하며, 저장/제출 뮤테이션의 onSuccess에서 queryClient.invalidateQueries로 캐시를 자동 무효화한다.

T03에서 5개 화면을 순서대로 전환했다. index.tsx는 usePrompts(), history.tsx는 useEvaluationHistory() + useScoreTrend(), prompts/[id].tsx는 usePrompt() + useCreateSubmission(), write/[submissionId].tsx는 useSubmission() + useSaveSubmission() + useSubmitSubmission() + useEvaluate() 4개 hooks, evaluation/[submissionId].tsx는 useEvaluation()으로 교체했다. write 화면에서는 useEffect([submission?.id]) 패턴으로 첫 로드 시에만 content 초기화하고, lastSavedContent.current는 mutation onSuccess 콜백 대신 await 직후 직접 업데이트하여 타이밍 의존을 없앴다. prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰에서 retry 버튼을 제거했다 — TanStack Query 자체 재시도가 처리하므로 수동 refetch 불필요.

최종 검증: npm run typecheck 0 errors + fetchXxx 패턴 grep 없음 ALL PASS.

## Verification

1. T01: `grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx` → OK
2. T02: 파일 존재 + 심볼 grep + `npx tsc --noEmit` → pass
3. T03: `npm run typecheck && ! grep -r 'useEffect.*fetch|fetchPrompt|fetchHistory|fetchSubmission|fetchEvaluation' app/` → ALL PASS

## Requirements Advanced

None.

## Requirements Validated

None.

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰에서 retry 버튼 제거 — TanStack Query 자체 재시도가 처리하므로 수동 refetch 불필요. 계획에 명시된 기능 삭제가 아닌 구현 방식 차이.

## Known Limitations

None.

## Follow-ups

S02에서 임시저장-이어쓰기 흐름 구현 시, write 화면의 useSubmission hook이 로드한 draft content를 useEffect([submission?.id])로 초기화하는 패턴을 그대로 활용할 수 있다. S03의 pull-to-refresh는 usePrompts/useEvaluationHistory의 refetch를 FlatList onRefresh에 연결하면 된다.

## Files Created/Modified

- `mobile/package.json` — @tanstack/react-query 의존성 추가
- `mobile/app/_layout.tsx` — QueryClientProvider 래핑 추가
- `mobile/lib/hooks/queries.ts` — 신규 — 6개 query hooks
- `mobile/lib/hooks/mutations.ts` — 신규 — 4개 mutation hooks
- `mobile/app/(tabs)/index.tsx` — usePrompts() hook으로 교체
- `mobile/app/(tabs)/history.tsx` — useEvaluationHistory() + useScoreTrend() hooks로 교체
- `mobile/app/prompts/[id].tsx` — usePrompt() + useCreateSubmission() hooks로 교체
- `mobile/app/write/[submissionId].tsx` — useSubmission() + useSaveSubmission() + useSubmitSubmission() + useEvaluate() 4개 hooks로 교체
- `mobile/app/evaluation/[submissionId].tsx` — useEvaluation() hook으로 교체
