# S03: UX 향상 — pull-to-refresh 및 자동 갱신 — UAT

**Milestone:** M002
**Written:** 2026-04-01T05:04:26.570Z

**Milestone:** M002
**Written:** 2026-04-01

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: 변경 범위가 세 파일의 props/hook 연결에 국한되며, typecheck와 grep으로 삽입 위치와 타입 정확성을 정적으로 검증할 수 있다. 런타임 동작(제스처, 네트워크 응답)은 앱 실행 환경에서 추가 확인 권장.

## Preconditions

- `mobile/` 디렉토리에서 TypeScript 컴파일 환경 구성
- Expo 개발 서버 기동 및 백엔드 서버 연결 가능 상태 (런타임 테스트 시)

## Smoke Test

```bash
cd mobile && npm run typecheck
# → exit 0 이면 기본 구현 정상
```

## Test Cases

### 1. index.tsx pull-to-refresh props 삽입 확인

```bash
grep -n 'refreshing\|onRefresh' mobile/app/\(tabs\)/index.tsx
```

**Expected:** `refreshing={isFetching}` 및 `onRefresh={refetch}`가 FlatList props로 출력된다.

### 2. history.tsx pull-to-refresh props 삽입 확인

```bash
grep -n 'refreshing\|onRefresh' mobile/app/\(tabs\)/history.tsx
```

**Expected:** `refreshing={isFetching}` 및 `onRefresh={handleRefresh}`가 FlatList props로 출력된다.

### 3. mutations.ts 평가 후 캐시 자동 무효화 확인

```bash
grep -n 'invalidateQueries.*evaluationHistory\|invalidateQueries.*scoreTrend' mobile/lib/hooks/mutations.ts
```

**Expected:** `evaluationHistory`와 `scoreTrend` 두 queryKey에 대한 invalidateQueries 호출이 각각 출력된다.

### 4. 타입 검사 통과

```bash
cd mobile && npm run typecheck
```

**Expected:** exit 0, 오류 없음.

## Edge Cases

### isFetching 초기 마운트 시 스피너 표시 안 됨

- `isLoading`(최초 로딩)과 `isFetching`(백그라운드 재패칭)은 별개이므로, 초기 마운트 시 FlatList가 존재하지 않아 `refreshing` 스피너가 노출되지 않는 것은 정상 동작이다.

### TrendSection 갱신 경로

- `refetchTrend()`를 호출하면 `scoreTrend` queryKey 캐시가 무효화된다. TrendSection은 내부에서 `useScoreTrend()`를 호출하므로 별도 prop 변경 없이 자동으로 재패칭된다.

## Failure Signals

- `npm run typecheck` exit non-zero → 타입 에러 발생 (삽입 코드 오류)
- grep 결과 빈 출력 → 해당 props/핸들러가 파일에 없음

## Not Proven By This UAT

- 실제 pull-to-refresh 제스처 동작 (기기/시뮬레이터 런타임 필요)
- 평가 API 호출 후 이력·트렌드 데이터가 실제로 갱신되는지 (백엔드 연동 필요)
- `isFetching` 중 스피너가 시각적으로 표시되는지

## Notes for Tester

세 파일 모두 최소 변경(props 추가, hook destructure 확장)으로 구현됐다. 런타임 검증이 필요하다면 `npx expo start`로 앱을 실행하고 주제 목록 화면과 이력 화면에서 아래로 당기는 제스처로 확인한다.
