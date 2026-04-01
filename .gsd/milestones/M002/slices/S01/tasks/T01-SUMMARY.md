---
id: T01
parent: S01
milestone: M002
provides: []
requires: []
affects: []
key_files: ["mobile/package.json", "mobile/app/_layout.tsx"]
key_decisions: ["queryClient를 모듈 스코프에 선언하여 리렌더링 시 재생성 방지", "로딩 스피너 분기(isLoaded guard)는 QueryClientProvider 밖에 유지"]
patterns_established: []
drill_down_paths: []
observability_surfaces: []
duration: ""
verification_result: "슬라이스 계획 검증 명령 `cd mobile && grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx && echo 'OK'` 실행 결과 OK 출력."
completed_at: 2026-04-01T04:21:21.544Z
blocker_discovered: false
---

# T01: @tanstack/react-query 설치 및 _layout.tsx에 QueryClientProvider 추가로 앱 전체 TanStack Query 사용 환경 구성

> @tanstack/react-query 설치 및 _layout.tsx에 QueryClientProvider 추가로 앱 전체 TanStack Query 사용 환경 구성

## What Happened
---
id: T01
parent: S01
milestone: M002
key_files:
  - mobile/package.json
  - mobile/app/_layout.tsx
key_decisions:
  - queryClient를 모듈 스코프에 선언하여 리렌더링 시 재생성 방지
  - 로딩 스피너 분기(isLoaded guard)는 QueryClientProvider 밖에 유지
duration: ""
verification_result: passed
completed_at: 2026-04-01T04:21:21.545Z
blocker_discovered: false
---

# T01: @tanstack/react-query 설치 및 _layout.tsx에 QueryClientProvider 추가로 앱 전체 TanStack Query 사용 환경 구성

**@tanstack/react-query 설치 및 _layout.tsx에 QueryClientProvider 추가로 앱 전체 TanStack Query 사용 환경 구성**

## What Happened

`mobile/`에서 npm install로 패키지를 추가하고, `_layout.tsx` 모듈 스코프에 queryClient를 선언한 뒤 isLoaded guard 이후 반환값 전체를 QueryClientProvider로 래핑했다. 기존 useUserStore/loadUserId 로직은 변경 없음.

## Verification

슬라이스 계획 검증 명령 `cd mobile && grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx && echo 'OK'` 실행 결과 OK 출력.

## Verification Evidence

| # | Command | Exit Code | Verdict | Duration |
|---|---------|-----------|---------|----------|
| 1 | `cd mobile && grep -q '@tanstack/react-query' package.json && grep -q 'QueryClientProvider' app/_layout.tsx && echo 'OK'` | 0 | ✅ pass | 100ms |


## Deviations

None.

## Known Issues

None.

## Files Created/Modified

- `mobile/package.json`
- `mobile/app/_layout.tsx`


## Deviations
None.

## Known Issues
None.
