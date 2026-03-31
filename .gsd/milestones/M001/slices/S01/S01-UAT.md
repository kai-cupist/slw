# S01: Infra Setup — UAT

**Milestone:** M001
**Written:** 2026-03-31T03:09:04.248Z

# S01: Infra Setup — UAT

**Milestone:** M001
**Written:** 2026-03-31

## UAT Type

- UAT mode: live-runtime
- Why this mode is sufficient: 인프라 슬라이스이므로 Docker Compose 환경에서 실제 서비스 실행과 API 호출로 검증해야 한다.

## Preconditions

- Docker Desktop이 실행 중이어야 한다.
- 프로젝트 루트에 `.env` 파일이 존재해야 한다 (`.env.example` 참고하여 생성).
- 포트 5434(DB)와 3100(API)이 사용 가능해야 한다.

## Smoke Test

```bash
cd /Users/cupist/workspace/slw
docker compose up -d
curl http://localhost:3100/health
```
응답: `{ "success": true, "data": { "status": "ok", "database": "connected" } }`

## Test Cases

### 1. Docker Compose 환경 기동

1. `docker compose up -d` 실행
2. `docker compose ps`로 db, api 서비스 상태 확인
3. **Expected:** db는 healthy, api는 running 상태

### 2. 헬스체크 엔드포인트

1. `curl http://localhost:3100/health`
2. **Expected:** `{ "success": true, "data": { "status": "ok", "database": "connected" } }`

### 3. 마이그레이션 실행

1. `docker compose exec api npm run migration:run`
2. `docker compose exec db psql -U slw_user -d slw_db -c "SELECT * FROM schema_migrations;"`
3. **Expected:** schema_migrations 테이블에 000_create_schema_migrations.sql 이력이 존재

### 4. API Envelope 응답 — 성공

1. `curl http://localhost:3100/health`
2. **Expected:** 응답이 `{ "success": true, "data": ... }` 형식으로 래핑됨

### 5. API Envelope 응답 — 에러 (404)

1. `curl http://localhost:3100/nonexistent`
2. **Expected:** `{ "success": false, "error": { "code": "NOT_FOUND", "message": "Cannot GET /nonexistent" } }`

### 6. Swagger UI 접근

1. 브라우저에서 `http://localhost:3100/api-docs` 접근
2. **Expected:** Swagger UI 페이지가 표시되며 "말하기 듣기 쓰기 API" 제목과 GET /health 엔드포인트가 보임

### 7. ValidationPipe 동작 확인

1. 이후 슬라이스에서 DTO가 추가되면 확인 가능. 현재는 ValidationPipe가 전역 등록된 상태만 확인.
2. `curl -X POST http://localhost:3100/health -H "Content-Type: application/json" -d '{"unknown": "field"}'`
3. **Expected:** POST /health는 존재하지 않으므로 404 에러 반환 (ValidationPipe는 DTO가 있는 엔드포인트에서 동작)

## Edge Cases

### DB 컨테이너 미기동 시 헬스체크

1. `docker compose stop db`
2. `curl http://localhost:3100/health`
3. **Expected:** 503 응답 `{ "success": false, "error": { "code": "SERVICE_UNAVAILABLE", "message": "데이터베이스 연결 실패" } }`

### 마이그레이션 중복 실행

1. `docker compose exec api npm run migration:run` 2회 연속 실행
2. **Expected:** 이미 실행된 마이그레이션은 건너뛰고, 새 마이그레이션만 실행. schema_migrations에 중복 이력 없음.

## Failure Signals

- `docker compose up` 실패 시: Docker Desktop 미실행, 포트 충돌, .env 파일 누락
- GET /health가 503 반환 시: DB 컨테이너 미기동 또는 DB 연결 정보 오류
- 마이그레이션 실패 시: migrations/ 볼륨 마운트 누락 또는 SQL 구문 오류

## Not Proven By This UAT

- 실제 비즈니스 테이블(prompts, submissions) 마이그레이션 — S02에서 검증
- ValidationPipe가 DTO 필드를 거부하는 동작 — DTO가 추가되는 S02 이후에 검증
- API 파라미터 바인딩으로 SQL Injection 방지 — 비즈니스 SQL이 추가되는 S02 이후에 검증

## Notes for Tester

- macOS에서 docker-credential-desktop PATH 문제가 발생하면 `/Applications/Docker.app/Contents/Resources/bin`을 PATH에 추가한다.
- DB_HOST_PORT 기본값은 5434, API_HOST_PORT 기본값은 3100이다. .env에서 변경 가능.
