---
estimated_steps: 28
estimated_files: 4
skills_used: []
---

# T02: API 클라이언트 모듈 + Zustand userStore + userId 영구 관리

## Description

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

## Inputs

- ``mobile/package.json` — T01에서 생성된 Expo 프로젝트`
- ``mobile/.env` — T01에서 생성된 EXPO_PUBLIC_API_URL`

## Expected Output

- ``mobile/lib/api.ts` — API 클라이언트 (fetch 래퍼, envelope 파싱, X-User-Id 자동 주입)`
- ``mobile/stores/userStore.ts` — Zustand userStore (AsyncStorage 연동 userId 관리)`
- ``mobile/lib/types.ts` — Prompt, Submission, Evaluation 등 API 타입 정의`
- ``mobile/package.json` — zustand, @react-native-async-storage/async-storage 의존성 추가`

## Verification

test -f mobile/lib/api.ts && test -f mobile/stores/userStore.ts && test -f mobile/lib/types.ts && cd mobile && npx tsc --noEmit
