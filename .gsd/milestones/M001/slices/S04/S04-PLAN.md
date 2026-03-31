# S04: 모바일 클라이언트

**Goal:** Expo 앱에서 쓰기 주제를 선택하고, 답안을 작성/제출하고, AI 평가 결과와 이력을 확인하는 전체 사용자 흐름이 동작한다
**Demo:** After this: Expo 앱에서 쓰기 주제를 선택하고, 답안을 작성/제출하고, AI 평가 결과와 이력을 확인하는 전체 사용자 흐름이 동작한다

## Tasks
- [x] **T01: Expo SDK 55 프로젝트를 mobile/에 생성하고, expo-router 탭+스택 레이아웃 구성, 서버 CORS 활성화 완료** — ## Description

Expo SDK 55 프로젝트를 `mobile/` 디렉토리에 생성하고, expo-router 기반 탭+스택 라우팅 레이아웃을 구성한다. NestJS 서버에 CORS를 활성화하여 모바일 앱에서 API 호출이 가능하도록 한다. 이 태스크가 끝나면 앱이 실행되고 탭 네비게이션이 보이는 빈 화면 상태가 된다.

## Steps

1. `npx create-expo-app@latest --template default@sdk-55 mobile`로 Expo 프로젝트 생성
2. `cd mobile && npx expo install expo-router expo-linking expo-constants expo-status-bar react-native-safe-area-context react-native-screens` 라우팅 의존성 설치
3. `mobile/.env` 파일 생성 — `EXPO_PUBLIC_API_URL=http://localhost:3100`
4. `mobile/app/_layout.tsx` 생성 — Root Stack Navigator (탭 그룹 + 모달 화면 그룹)
5. `mobile/app/(tabs)/_layout.tsx` 생성 — 2탭(주제/이력) Tab Navigator
6. `mobile/app/(tabs)/index.tsx` 생성 — 빈 주제 목록 placeholder
7. `mobile/app/(tabs)/history.tsx` 생성 — 빈 이력 placeholder
8. `server/src/main.ts`에 `app.enableCors()` 추가
9. `.gitignore`에 Expo/React Native 관련 항목 추가 (ios/, android/, .expo/ 등)
10. TypeScript 컴파일 확인

## Must-Haves

- [ ] Expo SDK 55 프로젝트가 `mobile/`에 생성됨
- [ ] expo-router 탭+스택 라우팅이 동작함
- [ ] 서버 CORS가 활성화됨
- [ ] `EXPO_PUBLIC_API_URL` 환경변수 설정됨
- [ ] TypeScript 에러 없음

## Verification

- `test -f mobile/package.json && grep -q expo mobile/package.json` — Expo 프로젝트 존재
- `test -f mobile/app/_layout.tsx && test -f mobile/app/(tabs)/_layout.tsx` — 라우팅 파일 존재
- `grep -q 'enableCors' server/src/main.ts` — CORS 활성화 확인
- `cd mobile && npx tsc --noEmit` — TypeScript 컴파일 성공
  - Estimate: 1h
  - Files: mobile/package.json, mobile/app/_layout.tsx, mobile/app/(tabs)/_layout.tsx, mobile/app/(tabs)/index.tsx, mobile/app/(tabs)/history.tsx, mobile/.env, server/src/main.ts, .gitignore
  - Verify: test -f mobile/app/_layout.tsx && test -f mobile/app/(tabs)/_layout.tsx && grep -q 'enableCors' server/src/main.ts && cd mobile && npx tsc --noEmit
- [ ] **T02: API 클라이언트 모듈 + Zustand userStore + userId 영구 관리** — ## Description

서버 API와 통신하는 공통 클라이언트 모듈(`lib/api.ts`)과 사용자 식별을 위한 Zustand 스토어(`stores/userStore.ts`)를 구현한다. 앱 최초 실행 시 UUID를 생성하여 AsyncStorage에 영구 저장하고, API 요청마다 X-User-Id 헤더를 자동 주입한다.

### 백엔드 API 응답 형식 (모든 엔드포인트 공통)
```typescript
// 성공: { success: true, data: T }
// 에러: { success: false, error: { code: string, message: string } }
// 페이지네이션: data 내부에 { items: T[], total, page, limit, totalPages }
```

### X-User-Id 헤더
- prompts 엔드포인트(GET /prompts, GET /prompts/:id)는 X-User-Id 불필요
- submissions/evaluations 엔드포인트는 X-User-Id 필수
- 서버는 헤더 없으면 400 에러 반환

## Steps

1. `cd mobile && npm install zustand @react-native-async-storage/async-storage` 의존성 설치
2. `mobile/lib/api.ts` 생성 — `EXPO_PUBLIC_API_URL` 기반 fetch 래퍼, 응답 envelope 파싱(`json.success` 체크), ApiError 클래스, X-User-Id 자동 주입
3. `mobile/stores/userStore.ts` 생성 — Zustand 스토어: userId(string|null), isLoaded(boolean), loadUserId(AsyncStorage에서 로드, 없으면 crypto.randomUUID()로 생성 후 저장)
4. `mobile/lib/types.ts` 생성 — API 응답 타입 정의 (Prompt, Submission, Evaluation, PaginatedResponse 등)
5. TypeScript 컴파일 확인

## Must-Haves

- [ ] `lib/api.ts`가 EXPO_PUBLIC_API_URL을 사용하고 envelope을 파싱함
- [ ] X-User-Id 헤더가 자동 주입됨
- [ ] ApiError 클래스가 서버 에러 응답을 구조화함
- [ ] userStore가 AsyncStorage에 userId를 영구 저장/로드함
- [ ] API 응답 타입이 서버 실제 응답 구조와 일치함
- [ ] TypeScript 에러 없음

## Verification

- `test -f mobile/lib/api.ts && test -f mobile/stores/userStore.ts && test -f mobile/lib/types.ts`
- `cd mobile && npx tsc --noEmit`
  - Estimate: 45m
  - Files: mobile/lib/api.ts, mobile/stores/userStore.ts, mobile/lib/types.ts, mobile/package.json
  - Verify: test -f mobile/lib/api.ts && test -f mobile/stores/userStore.ts && test -f mobile/lib/types.ts && cd mobile && npx tsc --noEmit
- [ ] **T03: 주제 목록/상세 + 답안 작성/제출 화면 구현 (APP-01, APP-02)** — ## Description

사용자 흐름의 전반부를 구현한다: 주제 목록 → 주제 상세 → 답안 작성 → 임시저장/제출. 앱 진입 시 userId가 로드되도록 Root Layout에서 userStore.loadUserId()를 호출한다.

### 화면 라우팅 구조 (expo-router)
```
app/(tabs)/index.tsx    → 주제 목록 (GET /prompts)
app/prompts/[id].tsx    → 주제 상세 (GET /prompts/:id) + "작성 시작" 버튼
app/write/[submissionId].tsx → 답안 작성/수정 (PATCH /submissions/:id, PATCH /:id/submit)
```

### 백엔드 API 엔드포인트
- GET /prompts?page=1&limit=10 — 주제 목록 (X-User-Id 불필요)
- GET /prompts/:id — 주제 상세 (X-User-Id 불필요)
- POST /submissions { prompt_id, content? } — 답안 생성, X-User-Id 필수
- PATCH /submissions/:id { content } — 답안 수정, X-User-Id 필수, draft만 가능
- PATCH /submissions/:id/submit — 제출, X-User-Id 필수, body 없음
- POST /submissions/:id/evaluate — 평가 요청, X-User-Id 필수, body 없음

### vercel-react-native-skills 적용
- `ui-pressable`: TouchableOpacity 대신 Pressable 사용
- `ui-styling`: StyleSheet.create 사용
- `rendering-text-in-text-component`: 모든 문자열을 Text 컴포넌트로 래핑
- `rendering-no-falsy-and`: 조건부 렌더링 시 `count > 0 &&` 패턴
- `list-performance-virtualize`: FlatList 사용 (데이터 적으므로 FlashList 불필요)

## Steps

1. `mobile/app/_layout.tsx` 수정 — 앱 시작 시 `userStore.loadUserId()` 호출, isLoaded가 false이면 로딩 표시
2. `mobile/app/(tabs)/index.tsx` 구현 — GET /prompts 호출, FlatList, 카테고리/난이도 뱃지 표시, Pressable로 주제 상세 이동, 로딩/에러 상태 처리
3. `mobile/app/prompts/[id].tsx` 생성 — GET /prompts/:id 호출, 주제 설명 표시, "작성 시작" 버튼 → POST /submissions → write/[submissionId]로 router.push
4. `mobile/app/write/[submissionId].tsx` 생성 — GET /submissions/:id로 기존 내용 로드, TextInput(multiline), "임시저장" 버튼(PATCH /submissions/:id), "제출" 버튼(PATCH submit → POST evaluate → evaluation/[submissionId]로 이동), 제출 중 로딩 UI
5. TypeScript 컴파일 확인

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| GET /prompts | 에러 메시지 표시 + 재시도 안내 | 동일 | 빈 목록 표시 |
| POST /submissions | Alert로 에러 표시 | 로딩 해제 + 에러 표시 | Alert 에러 |
| PATCH submit + POST evaluate | 로딩 해제 + 에러 표시, 다시 시도 가능 | 동일 | 동일 |

## Must-Haves

- [ ] 주제 목록이 FlatList로 표시되고 카테고리/난이도 뱃지가 보임
- [ ] 주제 탭 → 상세 → 작성 시작으로 네비게이션이 연결됨
- [ ] 답안 작성/임시저장/제출이 동작함
- [ ] 제출 시 자동으로 평가 요청 후 결과 화면으로 이동
- [ ] 로딩/에러 상태가 모든 화면에서 처리됨
- [ ] Pressable, StyleSheet.create, Text 래핑 등 RN 베스트 프랙티스 준수

## Verification

- `test -f mobile/app/prompts/[id].tsx && test -f mobile/app/write/[submissionId].tsx`
- `cd mobile && npx tsc --noEmit`
  - Estimate: 1h30m
  - Files: mobile/app/_layout.tsx, mobile/app/(tabs)/index.tsx, mobile/app/prompts/[id].tsx, mobile/app/write/[submissionId].tsx
  - Verify: test -f mobile/app/prompts/[id].tsx && test -f mobile/app/write/[submissionId].tsx && cd mobile && npx tsc --noEmit
- [ ] **T04: 평가 결과 + 이력 화면 구현 + 전체 흐름 E2E 검증 (APP-03, APP-04)** — ## Description

사용자 흐름의 후반부를 구현하고 M001 전체 흐름을 검증한다: 평가 결과 확인 + 이력 목록 + 점수 추이. 이 태스크가 완료되면 앱에서 "주제 선택 → 답안 작성 → 제출 → AI 평가 → 피드백 확인 → 이력 조회" 전체 흐름이 동작한다.

### 화면 라우팅 구조 (expo-router)
```
app/evaluation/[submissionId].tsx → 평가 결과 (GET /evaluations/:submissionId)
app/(tabs)/history.tsx            → 이력 목록 (GET /evaluations/history)
```

### 백엔드 API 엔드포인트
- GET /evaluations/:submissionId — 평가 결과 조회, X-User-Id 필수. 응답: { id, submission_id, grammar_score, logic_score, expression_score, relevance_score, total_score, feedback(JSONB), created_at }
- GET /evaluations/history?page=1&limit=10 — 이력 목록, X-User-Id 필수. 응답: { items: [{ id, submission_id, prompt_title, category, difficulty, grammar_score, logic_score, expression_score, relevance_score, total_score, created_at }], total, page, limit, totalPages }
- GET /evaluations/scores/trend?limit=20 — 점수 추이, X-User-Id 필수. 응답: [{ total_score, grammar_score, logic_score, expression_score, relevance_score, evaluated_at }]

### 평가 결과 화면 상세
- 4항목(문법/논리/표현력/주제 적절성) 각각의 점수를 프로그레스 바 또는 숫자로 표시
- 총점(total_score) 강조 표시
- feedback JSONB에서 항목별 상세 피드백 텍스트 표시
- feedback 구조: { grammar: { score, comment, suggestions }, logic: { ... }, expression: { ... }, relevance: { ... }, overall_comment }

### 이력 화면 상세
- FlatList로 평가 이력 목록 표시 (주제 제목, 총점, 날짜)
- 각 항목 Pressable → evaluation/[submissionId]로 이동
- 점수 추이: v1에서는 차트 라이브러리 없이 숫자 목록 또는 간단한 바 표현

### vercel-react-native-skills 적용
- `ui-pressable`: Pressable 사용
- `ui-styling`: StyleSheet.create
- `rendering-text-in-text-component`: Text 래핑
- `rendering-no-falsy-and`: 조건부 렌더링 패턴
- `list-performance-virtualize`: FlatList 사용

## Steps

1. `mobile/app/evaluation/[submissionId].tsx` 생성 — GET /evaluations/:submissionId 호출, 4항목 점수 바 표시, 총점, feedback 텍스트, 로딩/에러 상태
2. `mobile/app/(tabs)/history.tsx` 구현 — GET /evaluations/history 호출, FlatList, 각 항목 Pressable → 평가 결과 화면 이동, 로딩/에러/빈 상태 처리
3. 점수 추이 섹션을 history 화면 상단에 추가 — GET /evaluations/scores/trend 호출, 간단한 숫자 목록 또는 수평 바 표시 (차트 라이브러리 없이)
4. TypeScript 컴파일 확인
5. 전체 흐름 E2E 검증: Docker Compose 서버 기동 상태에서 앱 실행 → 주제 선택 → 답안 작성 → 제출 → 평가 결과 확인 → 이력 탭에서 확인

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| GET /evaluations/:id | 에러 메시지 표시 | 동일 | 빈 결과 표시 |
| GET /evaluations/history | 에러 메시지 표시 | 동일 | 빈 목록 표시 |
| GET /evaluations/scores/trend | 추이 섹션 숨김 | 동일 | 동일 |

## Must-Haves

- [ ] 평가 결과 화면에 4항목 점수 + 총점 + 피드백이 표시됨
- [ ] 이력 목록이 FlatList로 표시되고 탭하면 평가 결과로 이동
- [ ] 점수 추이가 표시됨 (차트 없이 숫자/바)
- [ ] 모든 화면에서 로딩/에러/빈 상태가 처리됨
- [ ] TypeScript 에러 없음
- [ ] 전체 사용자 흐름이 서버 연동 상태에서 동작

## Verification

- `test -f mobile/app/evaluation/[submissionId].tsx`
- `cd mobile && npx tsc --noEmit`
- `grep -q 'enableCors' server/src/main.ts`
- E2E 수동 검증: 주제 선택 → 답안 작성 → 제출 → 평가 결과 → 이력 전체 흐름
  - Estimate: 1h30m
  - Files: mobile/app/evaluation/[submissionId].tsx, mobile/app/(tabs)/history.tsx
  - Verify: test -f mobile/app/evaluation/[submissionId].tsx && cd mobile && npx tsc --noEmit
