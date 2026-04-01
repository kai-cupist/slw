# S02: Submissions 임시저장-이어쓰기 흐름 완성 — UAT

**Milestone:** M002
**Written:** 2026-04-01T04:58:27.631Z

## UAT Type

- UAT mode: artifact-driven
- Why this mode is sufficient: 서버 빌드(tsc) + 클라이언트 tsc + grep으로 핵심 구현 존재를 검증했다. 런타임 동작은 실제 디바이스/시뮬레이터에서만 확인 가능하며 S03 완료 후 통합 확인 권장.

## Preconditions

- `cd server && npm run build` 성공
- `cd mobile && npx tsc --noEmit` 성공
- Docker Compose로 PostgreSQL + NestJS 서버 기동 (실제 흐름 확인 시)
- Expo 개발 서버 기동 (실제 흐름 확인 시)

## Smoke Test

서버: `curl "http://localhost:3000/submissions?promptId=1&status=draft&limit=1"` → 빈 items 배열 또는 draft 항목 반환 (400 아님)

## Test Cases

### 1. GET /submissions?promptId 필터 동작 확인

1. 서버 기동 상태에서 특정 프롬프트에 draft 생성: `POST /submissions { promptId: 1 }`
2. `GET /submissions?promptId=1&status=draft&limit=1` 요청
3. **Expected:** items 배열에 promptId=1인 draft 1건만 반환, 다른 프롬프트의 draft는 포함되지 않음

### 2. 프롬프트 상세 — draft 없을 때 "작성 시작" 표시

1. 앱에서 draft가 없는 프롬프트 상세 화면으로 이동
2. draft 조회 로딩 완료 대기
3. **Expected:** 파란색 "작성 시작" 버튼 표시, 버튼 탭 시 새 submission 생성 후 /write/{id}로 이동

### 3. 프롬프트 상세 — draft 있을 때 "이어서 작성" 표시

1. 특정 프롬프트에 draft submission을 생성한 후 해당 프롬프트 상세 화면으로 이동
2. draft 조회 로딩 완료 대기
3. **Expected:** 초록색 "이어서 작성" 버튼 표시, 버튼 탭 시 새 submission 생성 없이 기존 draft의 /write/{draftId}로 이동

### 4. draft 조회 중 로딩 상태 표시

1. 프롬프트 상세 화면 진입 직후 (네트워크 느린 환경 또는 초기 로드)
2. **Expected:** "작성 시작" 버튼이 disabled 상태로 ActivityIndicator 표시, draft 조회 완료 후 버튼 활성화

### 5. 앱 재시작 후 draft 유지

1. 특정 프롬프트에서 draft 저장 후 앱 완전 종료
2. 앱 재시작 후 동일 프롬프트 상세 화면으로 이동
3. **Expected:** "이어서 작성" 버튼 표시 — draft가 서버에 저장되어 있으므로 앱 재시작 후에도 유지됨

## Edge Cases

### promptId 없이 조회

1. `GET /submissions` (promptId 파라미터 없음)
2. **Expected:** 기존과 동일하게 전체 submissions 반환 (promptId 필터 미적용)

### draft가 여러 개인 경우

1. 동일 프롬프트에 draft가 2개 이상인 경우 (비정상 상태)
2. **Expected:** usePromptDraft는 limit=1이므로 첫 번째 draft만 반환, "이어서 작성" 버튼은 해당 draft로 이동

## Failure Signals

- "작성 시작" 버튼이 항상 표시되고 "이어서 작성"이 표시되지 않음 → usePromptDraft hook이 호출되지 않거나 enabled:false
- 버튼 탭 시 새 submission이 중복 생성됨 → handleContinueWriting이 아닌 handleStartWriting이 호출됨
- promptId 필터를 포함한 API 호출이 400 에러 → GetSubmissionsDto 변환 실패 (@Type 데코레이터 누락 가능성)

## Not Proven By This UAT

- 실제 모바일 디바이스/시뮬레이터에서의 UX (artifact-driven 검증 한계)
- 제출(submit) 이후 "이어서 작성" → "작성 시작"으로 자동 전환 (S03 invalidateQueries 완성 후 검증)
- 네트워크 오류 시 draft 조회 실패 처리

## Notes for Tester

verification gate 실패는 grep 명령이 프로젝트 루트에서 실행된 경로 문제였다. mobile/ 디렉토리에서 실행하면 정상 동작한다. 실제 코드와 tsc 검증은 모두 통과했다.
