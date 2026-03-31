# T01: 01-infra-setup 01

**Slice:** S01 — **Milestone:** M001

## Description

NestJS 프로젝트를 생성하고, Docker Compose로 PostgreSQL + NestJS 개발 환경을 구성하며, DatabaseModule(pg Pool 기반)을 구축한다.

Purpose: 모든 후속 기능 개발의 인프라 기반을 마련한다. docker compose up 한 번으로 DB 연결이 완료된 NestJS 앱이 실행되는 상태를 달성한다.
Output: server/ 디렉토리(NestJS 프로젝트), Docker Compose 설정, DatabaseModule, 환경 변수 관리

## Must-Haves

- [ ] "docker compose up 한 번으로 PostgreSQL과 NestJS 앱이 실행된다"
- [ ] "NestJS 앱이 PostgreSQL에 Raw SQL(pg Pool)로 연결되어 쿼리를 실행할 수 있다"
- [ ] "환경 변수(.env)로 DB 접속 정보가 관리되고, .env.example이 존재한다"
- [ ] "DatabaseService가 query, queryOne, withTransaction 메서드를 제공한다"

## Files

- `server/package.json`
- `server/tsconfig.json`
- `server/nest-cli.json`
- `server/src/main.ts`
- `server/src/app.module.ts`
- `server/src/app.controller.ts`
- `server/src/database/database.module.ts`
- `server/src/database/database.service.ts`
- `server/src/database/database.constants.ts`
- `docker-compose.yml`
- `Dockerfile`
- `.env`
- `.env.example`
- `.gitignore`
- `.dockerignore`
