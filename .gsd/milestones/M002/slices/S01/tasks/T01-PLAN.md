---
estimated_steps: 13
estimated_files: 2
skills_used: []
---

# T01: TanStack Query 패키지 설치 및 QueryClientProvider 설정

이 태스크는 나머지 모든 태스크의 전제조건이다. `@tanstack/react-query`를 설치하고, `_layout.tsx`에 `QueryClientProvider`를 추가하여 앱 전체에서 TanStack Query hooks를 사용할 수 있게 한다.

## Steps

1. `mobile/` 디렉토리에서 `npm install @tanstack/react-query` 실행
2. `mobile/package.json`에 `@tanstack/react-query`가 추가되었는지 확인
3. `mobile/app/_layout.tsx` 수정:
   - `import { QueryClient, QueryClientProvider } from '@tanstack/react-query'` 추가
   - 모듈 스코프(컴포넌트 밖)에 `const queryClient = new QueryClient()` 선언 — 리렌더링 시 재생성 방지
   - `isLoaded` guard 이후 반환값(ThemeProvider 등)을 `<QueryClientProvider client={queryClient}>...</QueryClientProvider>`로 래핑
   - 로딩 스피너 반환 분기는 QueryClientProvider 밖에 그대로 둔다 (userId 로드 전에는 쿼리 불필요)

## Must-Haves

- `queryClient`는 컴포넌트 밖 모듈 스코프에 선언 (useMemo 아님)
- `QueryClientProvider`는 `ThemeProvider`와 `Stack`을 모두 감싸야 함
- 기존 `useUserStore`, `loadUserId` 로직은 변경하지 않음

## Inputs

- `mobile/package.json`
- `mobile/app/_layout.tsx`

## Expected Output

- `mobile/package.json`
- `mobile/app/_layout.tsx`

## Verification

cd mobile && grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx && echo 'OK'
