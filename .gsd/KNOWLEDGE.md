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
