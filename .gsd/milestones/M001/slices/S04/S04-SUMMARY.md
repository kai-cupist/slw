---
id: S04
parent: M001
milestone: M001
provides:
  - Expo SDK 55 모바일 앱 — 전체 쓰기 평가 사용자 흐름
  - 서버 API 클라이언트 (lib/api.ts) — envelope 파싱, 인증 자동 주입
  - 사용자 식별 스토어 (stores/userStore.ts) — AsyncStorage 영속 UUID
  - 서버 엔티티 미러 타입 (lib/types.ts)
requires:
  - slice: S03
    provides: AI 평가 API 엔드포인트 (POST /submissions/:id/evaluate, GET /evaluations/:submissionId, GET /evaluations/history, GET /evaluations/scores/trend)
  - slice: S02
    provides: 주제/답안 API 엔드포인트 (GET /prompts, GET /prompts/:id, POST /submissions, PATCH /submissions/:id, PATCH /submissions/:id/submit)
affects:
  []
key_files:
  - mobile/package.json
  - mobile/app/_layout.tsx
  - mobile/app/(tabs)/_layout.tsx
  - mobile/app/(tabs)/index.tsx
  - mobile/app/(tabs)/history.tsx
  - mobile/app/prompts/[id].tsx
  - mobile/app/write/[submissionId].tsx
  - mobile/app/evaluation/[submissionId].tsx
  - mobile/lib/api.ts
  - mobile/stores/userStore.ts
  - mobile/lib/types.ts
  - mobile/.env
  - server/src/main.ts
key_decisions:
  - SDK 55 기본 템플릿의 src/app/ 구조를 app/ 루트로 변환 — expo-router 기본값 및 계획에 맞춤
  - Date 타입을 클라이언트에서 string(ISO 8601)으로 정의 — JSON 직렬화 특성 반영
  - AsyncStorage 실패 시 인메모리 UUID 폴백으로 앱 동작 보장
  - 제출 시 미저장 변경사항 자동 저장 후 submit+evaluate 순차 호출 — 내용 유실 방지
  - 점수 추이를 차트 라이브러리 없이 미니 바로 구현 — v1 학습 목적에 맞게 외부 의존성 최소화
patterns_established:
  - fetch/useEffect 패턴으로 서버 상태 관리 — loading/error/data 3상태 + useCallback 의존성
  - lib/api.ts envelope 파싱 + ApiError 변환 + X-User-Id 자동 주입 패턴
  - Zustand + AsyncStorage 영속 스토어 패턴 (인메모리 폴백 포함)
  - expo-router Stack + Tabs 이중 레이아웃 패턴
observability_surfaces:
  - 앱에서 API 에러 시 사용자에게 에러 메시지 표시 (Alert 또는 인라인)
  - console.error로 API 실패 세부 정보 로깅
drill_down_paths:
  - .gsd/milestones/M001/slices/S04/tasks/T01-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T02-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T03-SUMMARY.md
  - .gsd/milestones/M001/slices/S04/tasks/T04-SUMMARY.md
duration: ""
verification_result: passed
completed_at: 2026-03-31T15:33:35.479Z
blocker_discovered: false
---

# S04: 모바일 클라이언트

**Expo SDK 55 + expo-router 기반 모바일 앱을 구축하여 주제 선택 → 답안 작성/임시저장/제출 → AI 평가 결과 확인 → 이력/점수 추이 조회 전체 사용자 흐름을 완성했다.**

## What Happened

M001의 마지막 슬라이스로, S01~S03에서 구축한 백엔드 API 위에 Expo React Native 앱을 올려 전체 사용자 흐름을 완성했다.

T01에서 Expo SDK 55 프로젝트를 mobile/에 생성하고, 기본 템플릿의 src/app/ 구조를 app/ 루트로 변환했다. Root Stack Navigator + 2탭(주제/이력) Tab Navigator를 구성하고, 서버에 CORS를 활성화했다.

T02에서 서버 통신 인프라를 구축했다. lib/api.ts는 EXPO_PUBLIC_API_URL 기반 fetch 래퍼로 envelope 파싱, ApiError 변환, X-User-Id 자동 주입을 처리한다. stores/userStore.ts는 Zustand + AsyncStorage로 UUID를 영구 관리하며, AsyncStorage 실패 시 인메모리 폴백을 지원한다. lib/types.ts에 서버 엔티티 미러링 타입을 정의했다.

T03에서 사용자 흐름 전반부를 구현했다. (tabs)/index.tsx가 FlatList로 주제 목록을 표시하고, prompts/[id].tsx에서 주제 상세를 보고 '작성 시작'으로 답안을 생성하며, write/[submissionId].tsx에서 답안 작성/임시저장/제출을 처리한다. 제출 시 미저장 변경사항 자동 저장 후 submit+evaluate 순차 호출하여 내용 유실을 방지한다.

T04에서 사용자 흐름 후반부를 완성했다. evaluation/[submissionId].tsx는 4항목 점수 프로그레스 바 + 총점 + feedback 텍스트를 표시한다. history.tsx는 FlatList 이력 목록 + TrendSection 점수 추이 미니 바를 표시한다. 모든 화면에서 loading/error/empty 상태를 처리하고, Pressable/StyleSheet.create/Text 래핑 등 React Native 베스트 프랙티스를 적용했다.

## Verification

6개 검증 항목 모두 통과:
1. Expo 프로젝트 존재 (package.json + expo 의존성)
2. 라우팅 파일 존재 (_layout.tsx, (tabs)/_layout.tsx, index.tsx, history.tsx)
3. 화면 파일 존재 (prompts/[id].tsx, write/[submissionId].tsx, evaluation/[submissionId].tsx)
4. 라이브러리 파일 존재 (lib/api.ts, stores/userStore.ts, lib/types.ts)
5. CORS 활성화 확인 (grep enableCors server/src/main.ts)
6. TypeScript 컴파일 성공 (npx tsc --noEmit exit 0)

## Requirements Advanced

- APP-01 — FlatList 기반 주제 목록 화면 구현, 카테고리/난이도 뱃지, Pressable 네비게이션
- APP-02 — write/[submissionId] 화면으로 답안 작성/임시저장/제출 구현
- APP-03 — evaluation/[submissionId] 화면으로 4항목 점수 프로그레스 바 + 피드백 표시
- APP-04 — history.tsx로 FlatList 이력 목록 + TrendSection 점수 추이 미니 바 구현

## Requirements Validated

- APP-01 — 주제 목록 FlatList 렌더링, 카테고리/난이도 뱃지 표시, tsc 컴파일 통과
- APP-02 — 답안 생성(POST), 임시저장(PATCH), 제출(PATCH submit) API 호출 체인 구현, tsc 컴파일 통과
- APP-03 — 4항목 점수 프로그레스 바 + 총점 + feedback 텍스트 표시, tsc 컴파일 통과
- APP-04 — 이력 FlatList + TrendSection 점수 추이 미니 바 구현, tsc 컴파일 통과

## New Requirements Surfaced

None.

## Requirements Invalidated or Re-scoped

None.

## Deviations

- SDK 55 기본 템플릿이 src/app/ 구조를 사용했으나 app/ 루트로 변환 (T01)
- api.ts에 patch 메서드 추가 — 원래 계획에 없었으나 PATCH 엔드포인트 호출에 필수 (T03)
- feedback 구조를 계획(중첩 객체)이 아닌 서버 실제 구현(플랫 문자열)에 맞춰 구현 (T04)

## Known Limitations

- E2E 수동 테스트는 서버 + Expo 동시 기동이 필요하여 자동화 검증 범위에 포함되지 않음
- 차트 라이브러리 없이 점수 추이를 미니 바로 표현 — 시각적으로 제한적이나 v1 목적에 충분

## Follow-ups

- TanStack Query 도입 검토 (v2에서 API 엔드포인트 증가 시)
- 오프라인 지원 및 캐싱 전략 (v2)
- 차트 라이브러리 도입으로 점수 추이 시각화 개선 (v2)

## Files Created/Modified

- `mobile/package.json` — Expo SDK 55 프로젝트 의존성 — expo, expo-router, zustand, async-storage 등
- `mobile/app/_layout.tsx` — Root Stack Navigator — 탭 그룹 + 모달 화면 등록, userStore.loadUserId() 호출
- `mobile/app/(tabs)/_layout.tsx` — 2탭(주제/이력) Tab Navigator 레이아웃
- `mobile/app/(tabs)/index.tsx` — 주제 목록 화면 — GET /prompts, FlatList, 카테고리/난이도 뱃지
- `mobile/app/(tabs)/history.tsx` — 이력 목록 화면 — GET /evaluations/history FlatList + TrendSection 점수 추이
- `mobile/app/prompts/[id].tsx` — 주제 상세 화면 — GET /prompts/:id, '작성 시작' → POST /submissions
- `mobile/app/write/[submissionId].tsx` — 답안 작성 화면 — 임시저장(PATCH), 제출(PATCH submit + POST evaluate)
- `mobile/app/evaluation/[submissionId].tsx` — 평가 결과 화면 — 4항목 점수 프로그레스 바 + 총점 + feedback
- `mobile/lib/api.ts` — 서버 API 클라이언트 — fetch 래퍼, envelope 파싱, ApiError, X-User-Id 주입
- `mobile/stores/userStore.ts` — Zustand 스토어 — AsyncStorage 연동 UUID 영속 관리
- `mobile/lib/types.ts` — 서버 엔티티 미러링 타입 정의
- `mobile/.env` — EXPO_PUBLIC_API_URL 환경변수
- `server/src/main.ts` — app.enableCors() 추가
- `.gitignore` — Expo/React Native 빌드 아티팩트 패턴 추가
