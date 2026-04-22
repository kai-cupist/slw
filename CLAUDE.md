# CLAUDE.md

## Project

**말하기 듣기 쓰기** — 6학년 국어 교과서를 모티브로 한 AI 언어 학습 앱. 현재 v1은 "쓰기"만 구현 (주제 제시 → 작성 → Groq LLM 평가).
**목적은 학습**이다: 프론트 개발자가 백엔드를 직접 짜보려는 토이 프로젝트. 생산성보다 이해가 우선.

## Stack & Layout

- `server/` — NestJS 11 + **pg (Raw SQL)** + PostgreSQL 16
- `mobile/` — Expo SDK 55 + TanStack Query v5 + Zustand
- `migrations/` — 수동 SQL 스크립트 (`NNN_*.sql`, 순차 실행)

구조·실행법 상세는 README.md, 요구사항·기술 선정 근거는 PROJECT_BRIEF.md

## Non-negotiable Constraints (학습 목적)

- **편의 라이브러리 도입 전 이유를 먼저 설명**할 것. "직접 구현"이 기본값.

## Language

- AI 에이전트의 응답·문서·코드 주석·커밋 메시지: **한국어**.
- 변수·함수·클래스 등 **코드 식별자는 영어**.

## Commands

```bash
docker compose up -d                                # DB + 서버 기동
docker compose exec api npm run migration:run       # 마이그레이션 (반드시 컨테이너 안에서)
(cd server && npm run lint && npm test)             # 서버 검증
(cd mobile && npx expo start)                       # 모바일 앱
# Swagger: http://localhost:3100/api-docs
```

> `migration:run`을 호스트에서 직접 돌리면 DB 포트 충돌로 실패한다.

## Conventions

- 파일·폴더: **kebab-case** (`submissions.controller.ts`). 클래스: **PascalCase**. 변수·함수: **camelCase**.
- Mobile 스타일은 `mobile/lib/theme.ts`의 `colors / spacing / radius / shadow / typography` 토큰만 사용. 하드코딩 색상·픽셀 금지.
- 공통 UI는 `mobile/components/` 재사용. 인라인 중복 구현 지양.
- TanStack Query: `queryKey: ['resource', id]` 패턴. 변이 후 관련 키를 `invalidateQueries`로 무효화.

## Workflow

- 미정

## Scope Guards

- 요청받지 않은 리팩터·추상화·주석을 덧붙이지 말 것. 세 줄의 중복은 섣부른 추상화보다 낫다.
- 에러 처리·폴백은 **외부 경계**(외부 API, 사용자 입력)에서만. 내부 호출에 불필요한 방어 금지.
