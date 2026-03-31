---
estimated_steps: 24
estimated_files: 8
skills_used: []
---

# T01: Expo 프로젝트 생성 + expo-router 라우팅 레이아웃 + 서버 CORS 활성화

## Description

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

## Inputs

- ``server/src/main.ts` — CORS 추가 대상`
- ``.gitignore` — Expo 관련 항목 추가`

## Expected Output

- ``mobile/package.json` — Expo 프로젝트 매니페스트`
- ``mobile/app/_layout.tsx` — Root Stack Navigator`
- ``mobile/app/(tabs)/_layout.tsx` — Tab Navigator (주제/이력 2탭)`
- ``mobile/app/(tabs)/index.tsx` — 주제 목록 placeholder 화면`
- ``mobile/app/(tabs)/history.tsx` — 이력 placeholder 화면`
- ``mobile/.env` — EXPO_PUBLIC_API_URL 환경변수`
- ``server/src/main.ts` — CORS 활성화 추가`
- ``.gitignore` — ios/, android/ 등 Expo 관련 항목 추가`

## Verification

test -f mobile/app/_layout.tsx && test -f mobile/app/(tabs)/_layout.tsx && grep -q 'enableCors' server/src/main.ts && cd mobile && npx tsc --noEmit
