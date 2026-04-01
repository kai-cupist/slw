---
id: M002
title: "TanStack Query 도입 및 UX 개선"
status: complete
completed_at: 2026-04-01T05:13:29.599Z
key_decisions:
  - TanStack Query QueryClient를 모듈 스코프에 선언하여 리렌더링 시 재생성 방지
  - lib/hooks/queries.ts + mutations.ts 공유 hooks 레이어 패턴 — 모든 API 호출은 두 파일에 집중, 화면은 import만
  - staleTime을 목록/상세 5분 vs 제출/평가 30초~1분으로 분리 — 갱신 빈도 차이 반영
  - write 화면 content 초기화 useEffect([submission?.id]) 패턴 — 동일 submission 내 content 변경 시 초기화 재실행 방지
  - draft 이어쓰기: existingDraft 유무로 단순 분기 — continueButton은 새 submission 생성 없이 기존 draft ID로 직접 이동
  - useEvaluate onSuccess에서 evaluationHistory·scoreTrend 두 캐시를 invalidate — 평가 후 이력/트렌드 자동 갱신
  - promptId 필터는 기존 paramIndex 카운터 패턴으로 동적 WHERE 절에 append — 서버 일관성 유지
key_files:
  - mobile/lib/hooks/queries.ts
  - mobile/lib/hooks/mutations.ts
  - mobile/app/_layout.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/[submissionId].tsx
  - mobile/app/evaluation/[submissionId].tsx
  - mobile/package.json
  - server/src/submissions/dto/get-submissions.dto.ts
  - server/src/submissions/submissions.repository.ts
  - server/src/submissions/submissions.service.ts
lessons_learned:
  - TanStack Query v5 뮤테이션 로딩 상태는 isPending (isLoading 제거됨) — v4 코드 마이그레이션 시 주의
  - write 화면 content 초기화 useEffect 의존성은 submission?.id 사용 — content를 의존성으로 쓰면 사용자 입력 중 서버 원본으로 덮어씌워짐
  - pull-to-refresh는 useQuery destructure에서 isFetching+refetch를 가져와 FlatList에 직접 연결하면 되어 추가 상태 관리 불필요
  - 공유 hooks 레이어(queries.ts/mutations.ts)는 슬라이스 진행 중 점진적으로 확장하기 좋은 패턴 — 각 슬라이스가 기존 파일에 훅만 추가하면 됨
---

# M002: TanStack Query 도입 및 UX 개선

**모바일 앱의 서버 상태 관리를 TanStack Query v5로 완전 전환하고, draft 이어쓰기 흐름과 pull-to-refresh·자동 갱신 UX를 완성했다.**

## What Happened

M002는 3개 슬라이스로 구성된 모바일 앱 품질 개선 마일스톤이었다.

S01에서 @tanstack/react-query를 설치하고 _layout.tsx에 QueryClientProvider를 추가했다. lib/hooks/queries.ts(6개 useQuery 훅)와 lib/hooks/mutations.ts(4개 useMutation 훅)로 공유 hooks 레이어를 구축한 뒤, 5개 화면(index, history, prompts/[id], write/[submissionId], evaluation/[submissionId]) 전체에서 fetch/useEffect 패턴을 제거했다. staleTime은 목록/상세 5분, 제출/평가 30초~1분으로 분리했고, 저장·제출 mutation onSuccess에서 invalidateQueries로 캐시를 자동 무효화했다.

S02에서 서버에 GET /submissions?promptId= 필터를 추가했다(GetSubmissionsDto에 @Type/@IsInt로 promptId 파라미터 추가, Repository 동적 WHERE 절에 paramIndex 패턴으로 s.prompt_id = $N 조건 append). 클라이언트에는 usePromptDraft hook을 추가하여 프롬프트 상세 화면에서 draft 유무에 따라 "이어서 작성"(기존 draft ID로 직접 이동) / "작성 시작"(새 submission 생성) 버튼을 분기 표시했다. draftLoading 중에는 버튼을 disabled+spinner로 처리하여 중복 submission 생성을 방지했다.

S03에서 세 파일에 최소 변경을 적용했다. mutations.ts의 useEvaluate에 onSuccess를 추가하여 평가 성공 시 evaluationHistory·scoreTrend 캐시를 invalidate했다. index.tsx에는 isFetching+refetch를 FlatList에 연결했고, history.tsx에는 useScoreTrend를 최상단에서 별도 호출하여 refetchTrend를 확보한 뒤 handleRefresh로 묶었다.

## Success Criteria Results

## 성공 기준 달성 결과

### ✅ 모든 화면에서 TanStack Query 기반 데이터 패칭이 동작하고 fetch/useEffect 코드가 제거된다
- `grep -rn "useEffect.*fetch|fetchPrompt|fetchHistory|fetchSubmission|fetchEvaluation" mobile/app/` → 결과 없음
- lib/hooks/queries.ts에 8개 useQuery 훅, mutations.ts에 4개 useMutation 훅 구축 확인
- 5개 화면 모두 TanStack Query 훅으로 교체 완료

### ✅ 프롬프트 상세에서 기존 draft가 있으면 이어서 작성 버튼이 표시된다
- `grep -n "이어서 작성" mobile/app/prompts/[id].tsx` → line 96에서 확인
- usePromptDraft hook이 /submissions?status=draft&promptId={id}&limit=1로 조회
- draft 유무에 따른 버튼 분기 로직 존재 확인

### ✅ 목록 화면에서 당겨서 새로고침이 동작한다
- `grep -n "refreshing|onRefresh" mobile/app/(tabs)/index.tsx` → line 98-99에서 isFetching+refetch 연결 확인
- `grep -n "refreshing|onRefresh" mobile/app/(tabs)/history.tsx` → line 177-178에서 isFetching+handleRefresh 연결 확인

### ✅ 답안 제출 후 이력 화면이 자동으로 갱신된다
- `grep -n "invalidateQueries.*evaluationHistory|invalidateQueries.*scoreTrend" mobile/lib/hooks/mutations.ts` → line 65-66에서 두 캐시 무효화 확인

### ✅ 타입체크 통과
- `cd mobile && npx tsc --noEmit` → exit 0, 에러 없음

## Definition of Done Results

## Definition of Done 달성 결과

### ✅ 모든 슬라이스 완료
- S01: ✅ (completed_at: 2026-04-01T04:31:59)
- S02: ✅ (completed_at: 2026-04-01T04:58:27)
- S03: ✅ (completed_at: 2026-04-01T05:04:26)

### ✅ 모든 슬라이스 SUMMARY.md 존재
- .gsd/milestones/M002/slices/S01/S01-SUMMARY.md ✅
- .gsd/milestones/M002/slices/S02/S02-SUMMARY.md ✅
- .gsd/milestones/M002/slices/S03/S03-SUMMARY.md ✅

### ✅ 실제 코드 변경 존재
- git diff e99ecba HEAD -- ':!.gsd/' → 14개 파일, +439/-302 라인 변경 확인

### ✅ 크로스 슬라이스 통합 확인
- S01의 queries.ts/mutations.ts 공유 훅 레이어가 S02(usePromptDraft 추가)·S03(useEvaluate onSuccess 추가)에서 올바르게 확장됨
- S02의 서버 promptId 필터가 S01에서 구축한 api 클라이언트 패턴과 호환됨
- S03의 캐시 무효화가 S01의 쿼리 키 네이밍 규약('evaluationHistory', 'scoreTrend')을 그대로 사용함

## Requirement Outcomes

## 요구사항 상태 전환

M002에서 새로 전환된 요구사항은 없다. 29개 전체 요구사항이 M001에서 이미 validated 상태였으며, M002는 기존 validated 요구사항의 UX 품질을 개선하는 마일스톤이었다.

M002에서 달성한 개선사항:
- APP-01~APP-04: 기존에 validated된 앱 화면들이 TanStack Query 기반으로 재구현되어 데이터 패칭 안정성 향상
- APP-02: 임시저장-이어쓰기 흐름이 서버 promptId 필터 + usePromptDraft hook으로 더 견고하게 동작

## Deviations

- prompts/[id].tsx와 evaluation/[submissionId].tsx 에러 뷰에서 수동 retry 버튼 제거 — TanStack Query 자체 재시도가 처리하므로 불필요
- mutations.ts의 useQueryClient import가 이미 존재하여 S03에서 import 수정 불필요

## Follow-ups

- 수동 기기 실행 테스트 미수행 (S03 Known Limitations) — pull-to-refresh 제스처와 평가 후 자동 갱신은 앱 실행 환경에서 확인 필요
- draft 조회 staleTime 30초 — 다른 기기에서 draft 변경 시 최대 30초 지연 가능
- 같은 주제에 대한 중복 draft 관리 정책 미정 (v2 후보)
- PROJECT.md의 Follow-ups에 TanStack Query 도입 완료됨 업데이트 필요
