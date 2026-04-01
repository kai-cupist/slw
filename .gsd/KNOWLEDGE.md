# Knowledge

## K001 — Docker Compose에서 migrations/ 볼륨 마운트 필수

- **발견:** M001/S01/T02
- **내용:** server/ 디렉토리만 마운트하면 컨테이너 내에서 migrations/ 폴더에 접근할 수 없다. `./migrations:/usr/src/migrations` 볼륨 마운트를 별도로 추가해야 한다.
- **영향:** 마이그레이션 실행 실패

## K002 — MigrationService의 디렉토리 fallback 패턴

- **발견:** M001/S01/T02
- **내용:** `process.cwd()/migrations`와 `process.cwd()/../migrations` 두 경로를 순서대로 시도하여 로컬(server/ 디렉토리에서 실행)과 Docker(컨테이너 루트에서 실행) 환경 모두 지원한다.
- **영향:** 로컬 개발과 Docker 환경에서 동일한 코드로 마이그레이션 실행 가능

## K003 — docker-credential-desktop PATH 문제

- **발견:** M001/S01/T02
- **내용:** macOS에서 Docker Desktop의 credential helper가 PATH에 없으면 `docker compose up` 시 에러 발생. `/Applications/Docker.app/Contents/Resources/bin`을 PATH에 추가하면 해결된다.
- **영향:** 로컬 환경 설정 문제, 코드 변경 불필요

## K004 — @Global() DatabaseModule 패턴

- **발견:** M001/S01/T01
- **내용:** DatabaseModule에 `@Global()` 데코레이터를 적용하면 다른 모듈에서 import 없이 DatabaseService를 주입할 수 있다. 단, exports에 DatabaseService를 명시해야 한다.
- **영향:** 모든 Feature 모듈에서 DatabaseModule import 불필요

## K005 — NestJS 컨트롤러 라우트 충돌 방지

- **발견:** M001/S03/T03
- **내용:** 동일 컨트롤러에서 `@Get('history')`와 `@Get(':submissionId')` 같은 구체적 경로와 파라미터 경로가 공존할 때, 구체적 경로를 반드시 먼저 선언해야 한다. Express가 선언 순서대로 매칭하기 때문에 파라미터 경로가 먼저 오면 `history`를 submissionId로 인식한다.
- **영향:** 라우트가 의도하지 않은 핸들러로 매칭되는 버그 방지

## K006 — Repository에 PoolClient 선택적 파라미터로 트랜잭션 지원

- **발견:** M001/S03/T02
- **내용:** Repository 메서드에 `client?: PoolClient` 파라미터를 추가하면, 트랜잭션 내에서는 트랜잭션 client를 전달하고, 일반 호출에서는 DatabaseService.query()를 사용하는 패턴으로 트랜잭션 안/밖 모두 지원할 수 있다.
- **영향:** 서비스 레이어에서 트랜잭션 경계를 유연하게 제어 가능

## K007 — Groq JSON Object Mode 사용 시 프롬프트 내 스키마 명시 필수

- **발견:** M001/S03/T01
- **내용:** `response_format: { type: 'json_object' }`를 설정하더라도 프롬프트에 JSON 스키마를 명시적으로 기술해야 원하는 구조의 응답을 받을 수 있다. 스키마 없이 json_object만 설정하면 비결정적 구조가 반환된다. 응답 파싱 후 4항목 점수 범위(1~10)와 필수 필드 존재를 수동 검증해야 한다.
- **영향:** LLM 응답 파싱 실패율 감소

## K008 — Expo SDK 55 기본 템플릿은 src/app/ 구조 사용

- **발견:** M001/S04/T01
- **내용:** `create-expo-app --template default@sdk-55`로 생성하면 소스가 `src/app/`에 배치된다. expo-router 기본 root는 `app/`이므로, 커스텀 구조를 원하면 `src/`를 제거하고 `tsconfig.json` 경로 매핑을 수정해야 한다.
- **영향:** 프로젝트 생성 직후 구조 변환 작업 필요

## K009 — 서버 API 응답 구조는 계획 문서가 아닌 실제 응답 기준으로 구현

- **발견:** M001/S04/T04
- **내용:** 슬라이스 계획에서 feedback 필드를 중첩 객체(`{ grammar: { score, comment, suggestions } }`)로 기술했으나, 서버 실제 구현은 플랫 문자열 구조였다. 클라이언트 구현 시 반드시 실제 API 응답을 확인하고 맞춰야 한다.
- **영향:** 계획-구현 간 불일치로 인한 파싱 에러 방지

## K010 — TanStack Query v5 쿼리/뮤테이션 로딩 상태 네이밍 차이

- **발견:** M002/S01/T03
- **내용:** TanStack Query v5에서 쿼리(useQuery)의 로딩 상태는 `isLoading`, 뮤테이션(useMutation)의 로딩 상태는 `isPending`이다. v4와 달리 뮤테이션에서 `isLoading`이 제거되었다. 두 이름을 혼용하면 타입 에러가 발생한다.
- **영향:** v5 마이그레이션 또는 신규 hooks 작성 시 API 혼용 방지

## K011 — TanStack Query write 화면 useEffect 의존성은 submission?.id 사용

- **발견:** M002/S01/T03
- **내용:** write/[submissionId].tsx에서 서버에서 로드한 submission.content로 content state를 초기화할 때, useEffect 의존성을 `[submission?.content]`가 아닌 `[submission?.id]`로 설정해야 한다. content를 의존성으로 쓰면 사용자가 수정할 때마다 서버 원본으로 덮어써진다.
- **영향:** 사용자 입력 중 content 초기화 재실행 방지

## K012 — pull-to-refresh는 isFetching + refetch를 FlatList에 직접 연결

- **발견:** M002/S03/T01
- **내용:** TanStack Query에서 pull-to-refresh를 구현할 때 별도 상태가 필요 없다. `useQuery`의 destructure에서 `isFetching`과 `refetch`를 가져와 FlatList의 `refreshing={isFetching}` + `onRefresh={refetch}`에 직접 연결하면 된다. 여러 쿼리를 묶어 새로고침하려면 각 useQuery에서 refetch를 꺼내 handleRefresh 콜백으로 묶는다.
- **영향:** pull-to-refresh 구현 시 불필요한 useState/로딩 상태 추가 방지
