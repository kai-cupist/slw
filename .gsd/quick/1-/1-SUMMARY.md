# Quick Task: 타입/린트/포맷 체크 순서대로 진행 및 커밋

**Date:** 2026-04-01
**Branch:** gsd/quick/1-

## What Changed

- `mobile/app/(tabs)/history.tsx`: renderRightActions 고차 함수 내부 익명 컴포넌트에 `react/display-name` eslint-disable 주석 추가 (의도적 패턴)
- `mobile/app/write/index.tsx`: useEffect dependency eslint-disable 위치 수정 — dependency array 바로 위에 배치, K011 패턴 설명 주석 명시
- `mobile/eslint.config.js`: `.expo/**` ignores 추가 (flat config v9 방식, 자동 생성 파일 제외)
- `server/src/submissions/dto/get-submissions.dto.ts`: prettier 포맷 자동 수정
- `server/src/submissions/submissions.service.ts`: prettier 포맷 자동 수정

## Files Modified

- `mobile/app/(tabs)/history.tsx`
- `mobile/app/write/index.tsx`
- `mobile/eslint.config.js`
- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/submissions/submissions.service.ts`

## Verification

| 체크 | mobile | server |
|------|--------|--------|
| `tsc --noEmit` | ✅ exit 0 | ✅ exit 0 |
| `eslint` | ✅ 에러/경고 0 | ✅ 에러/경고 0 |

## Notes

- `useEffect` 의존성에 `submission?.id`를 쓰는 것은 K011 의도적 패턴 — `submission`(객체 참조)을 넣으면 임시저장 후 refetch 시 새 객체로 effect 재실행되어 사용자 입력이 덮어써진다.
- `.expo/` 디렉토리는 Expo가 자동 생성하는 파일이므로 린트 검사 대상에서 제외했다.
