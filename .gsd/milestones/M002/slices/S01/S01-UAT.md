# S01: TanStack Query 도입 및 전체 화면 전환 — UAT

**Milestone:** M002
**Written:** 2026-04-01T04:31:59.508Z

## UAT: S01 — TanStack Query 도입 및 전체 화면 전환

### 전제 조건

- 서버가 실행 중이거나, 모바일 앱이 실제 서버 없이 타입 체크만으로 검증 가능한 상태
- `cd mobile && npm install` 완료
- TypeScript 컴파일 환경 준비

---

### T01: TanStack Query 설치 및 QueryClientProvider 설정

**TC-01-01: 패키지 설치 확인**
```
cd mobile && grep '@tanstack/react-query' package.json
```
- 기대값: `"@tanstack/react-query"` 항목이 dependencies에 존재

**TC-01-02: QueryClientProvider 래핑 확인**
```
grep -n 'QueryClientProvider\|queryClient' mobile/app/_layout.tsx
```
- 기대값: 모듈 스코프에 `const queryClient = new QueryClient()` 선언, `<QueryClientProvider client={queryClient}>` 래핑 존재

**TC-01-03: queryClient 모듈 스코프 선언 확인**
```
grep -A2 -B2 'new QueryClient' mobile/app/_layout.tsx
```
- 기대값: 함수/컴포넌트 바깥(모듈 스코프)에 선언 — `export default function` 또는 `const Root` 이전에 위치

---

### T02: 공유 hooks 레이어 완성

**TC-02-01: 파일 존재 확인**
```
test -f mobile/lib/hooks/queries.ts && test -f mobile/lib/hooks/mutations.ts && echo 'FILES OK'
```
- 기대값: `FILES OK`

**TC-02-02: queries.ts 6개 hook 심볼 확인**
```
grep -E 'export function use(Prompts|Prompt|Submission|Evaluation|EvaluationHistory|ScoreTrend)' mobile/lib/hooks/queries.ts
```
- 기대값: 6개 함수 모두 export 확인

**TC-02-03: mutations.ts 4개 hook 심볼 확인**
```
grep -E 'export function use(CreateSubmission|SaveSubmission|SubmitSubmission|Evaluate)' mobile/lib/hooks/mutations.ts
```
- 기대값: 4개 함수 모두 export 확인

**TC-02-04: staleTime 설정 확인**
```
grep 'staleTime' mobile/lib/hooks/queries.ts
```
- 기대값: 여러 staleTime 값 존재 (300000, 60000, 30000 등)

**TC-02-05: invalidateQueries 캐시 무효화 확인**
```
grep 'invalidateQueries' mobile/lib/hooks/mutations.ts
```
- 기대값: useSaveSubmission과 useSubmitSubmission의 onSuccess에서 invalidateQueries 호출 확인

---

### T03: 5개 화면 TanStack Query 전환

**TC-03-01: 슬라이스 검증 명령 (최종 통합 검증)**
```
cd mobile && npm run typecheck && ! grep -r 'useEffect.*fetch\|fetchPrompt\|fetchHistory\|fetchSubmission\|fetchEvaluation' app/ --include='*.tsx' && echo 'ALL PASS'
```
- 기대값: `ALL PASS` (typecheck 0 errors + 구 fetch 패턴 없음)

**TC-03-02: 각 화면별 hook import 확인**
```
grep 'usePrompts\|useEvaluationHistory\|usePrompt\|useSubmission\|useEvaluation' mobile/app/(tabs)/index.tsx mobile/app/(tabs)/history.tsx mobile/app/prompts/\[id\].tsx mobile/app/write/\[submissionId\].tsx mobile/app/evaluation/\[submissionId\].tsx
```
- 기대값: 각 파일에서 해당 화면에 맞는 hook import 확인

**TC-03-03: useState(loading) / 직접 fetch 패턴 제거 확인**
```
grep -r 'setLoading\|setError.*ApiError\|ApiError' mobile/app/ --include='*.tsx'
```
- 기대값: 출력 없음 (0 matches)

**TC-03-04: write 화면 content 초기화 패턴 확인**
```
grep -A5 'useEffect' mobile/app/write/\[submissionId\].tsx | head -20
```
- 기대값: `[submission?.id]` 의존성 배열 확인

**TC-03-05: write 화면 lastSavedContent 업데이트 위치 확인**
```
grep -n 'lastSavedContent' mobile/app/write/\[submissionId\].tsx
```
- 기대값: `lastSavedContent.current = content` 업데이트가 mutation onSuccess 콜백이 아닌 await 직후에 존재

---

### 엣지 케이스

**EC-01: usePrompt에 undefined id 전달 시 enabled 가드 동작**
```
grep 'enabled.*!!id\|enabled.*!!submissionId' mobile/lib/hooks/queries.ts
```
- 기대값: `enabled: !!id` 또는 `enabled: !!submissionId` 확인 — undefined 시 쿼리 실행 안 함

**EC-02: TanStack Query v5 API 네이밍 — isPending vs isLoading**
```
grep 'isPending' mobile/lib/hooks/mutations.ts mobile/app/write/\[submissionId\].tsx mobile/app/prompts/\[id\].tsx
```
- 기대값: mutation 상태는 `isPending` 사용 확인 (v5 API)
```
grep 'isLoading' mobile/lib/hooks/queries.ts mobile/app/(tabs)/index.tsx
```
- 기대값: query 상태는 `isLoading` 사용 확인 (v5 API)

