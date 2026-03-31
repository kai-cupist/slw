# 말하기 듣기 쓰기

## What This Is

사용자의 언어 능력(말하기, 듣기, 쓰기)을 향상시키는 학습 앱. v1에서는 쓰기 카테고리만 구현하여, 주제에 대해 텍스트를 작성하면 AI가 문법, 논리, 표현력 등을 평가하고 피드백을 제공한다. 프론트엔드 개발자가 백엔드 개발 경험을 쌓기 위한 학습 목적의 토이 프로젝트이다.

## Current State

**M001 (쓰기 평가 MVP) 완료.** "주제 선택 → 답안 작성 → 제출 → AI 평가 → 피드백 확인" 핵심 흐름이 백엔드 API + Expo 모바일 앱으로 끝까지 동작하는 v1이 완성되었다.

### 구현된 기능
- **백엔드 (NestJS):** 14개 REST API 엔드포인트 — 주제 2개, 답안 6개, 평가 4개, 헬스체크 1개, Swagger 1개
- **데이터베이스 (PostgreSQL 16):** 4개 테이블(schema_migrations, prompts, submissions, evaluations) + 30개 시드 데이터
- **AI 평가 (Groq LLM):** Llama 3.3 70B 기반 문법/논리/표현력/주제 적절성 4항목 평가
- **모바일 앱 (Expo SDK 55):** 7개 화면 — 주제 목록, 주제 상세, 답안 작성, 평가 결과, 이력/추이
- **인프라:** Docker Compose(PostgreSQL + NestJS), 수동 SQL 마이그레이션(6개 파일), Swagger UI

## Core Value

사용자가 쓰기 주제를 받고, 텍스트를 작성하여 제출하면, AI가 평가하고 의미 있는 피드백을 돌려주는 것 — 이 한 가지 흐름이 반드시 동작해야 한다.

**상태: ✅ 달성** — M001에서 전체 흐름 구현 및 검증 완료.

## Requirements

29개 전체 요구사항이 validated 상태. 상세 내역은 REQUIREMENTS.md 참조.

- ✅ INFRA-01~04: 인프라 기반 (Docker Compose, 마이그레이션, DatabaseModule, ConfigModule)
- ✅ PROMPT-01~04: 쓰기 주제 조회/상세/카테고리·난이도/시드 데이터
- ✅ SUB-01~06: 답안 CRUD + 상태 전환 + 페이지네이션 + soft delete
- ✅ EVAL-01~05: AI 평가 수행 + 4항목 점수 + 피드백 + 재시도 + DB 저장
- ✅ HIST-01~02: 평가 이력 + 점수 추이
- ✅ APP-01~04: 모바일 앱 전체 화면
- ✅ API-01~03: API 응답 형식 + SQL Injection 방지 + 입력 검증

## Out of Scope

- 인증/로그인 — v2에서 추가 예정 (현재 X-User-Id 헤더 기반)
- 말하기 카테고리 (음성 파일 업로드, STT) — v2 이후
- 듣기 카테고리 (오디오 콘텐츠 관리, 재생) — v2 이후
- 소셜 기능 (랭킹, 공유 등) — v2 이후
- ORM 사용 — 학습 목적으로 Raw SQL만 사용
- 자동 마이그레이션 도구 — 수동 SQL 스크립트로 관리

## Constraints

- **Tech Stack**: NestJS (백엔드), Expo/React Native (프론트엔드), PostgreSQL 16.11 (DB), Docker Compose (인프라)
- **ORM 금지**: Raw SQL만 사용 — SQL 동작 방식을 체득하기 위한 학습 제약
- **DB 마이그레이션**: 수동 SQL 스크립트 — 자동 마이그레이션 도구 사용 금지
- **비용**: 무료 또는 저비용 AI API — Groq 무료 티어 사용 중
- **편의 라이브러리**: 최소화 — 핵심 로직은 직접 구현, 도입 시 이유 설명 필수

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| v1은 쓰기 카테고리만 구현 | 텍스트 I/O만으로 백엔드 핵심 흐름을 빠르게 경험 | ✅ 완료 |
| Raw SQL 사용 (ORM 금지) | SQL 근본 동작 방식 체득 후 ORM 필요성 체감 | ✅ 적용됨 — 모든 Repository에서 파라미터 바인딩 Raw SQL 사용 |
| Groq 무료 티어 1순위 | Llama 3.3 70B, 일일 1,000 요청, 빠른 추론 속도 | ✅ 동작 확인 — E2E에서 실제 Groq API 호출 성공 |
| 인증 없이 시작 | v1 범위 최소화, v2에서 추가 | ✅ X-User-Id 헤더 기반으로 구현, v2에서 실제 인증 교체 필요 |
| Controller→Service→Repository 3계층 | NestJS 표준 패턴으로 관심사 분리 | ✅ 모든 feature 모듈에 일관 적용 |
| LLM 호출은 트랜잭션 밖에서 처리 | 커넥션 점유 최소화, API 실패 시 DB 상태 보전 | ✅ evaluations.service.ts에서 적용 |
| CNG 방식 Expo 프로젝트 | ios/android 디렉토리 gitignore, prebuild로 필요 시 생성 | ✅ mobile/ 디렉토리에 적용 |

## Follow-ups (v2 후보)

- 실제 인증 체계 도입 (JWT 등)
- TanStack Query 도입 (API 엔드포인트 증가 시)
- 오프라인 지원 및 캐싱 전략
- 차트 라이브러리 도입으로 점수 추이 시각화 개선
- 같은 주제에 대한 중복 draft 관리 정책

## Context

- 프론트엔드 개발자가 서버 쪽을 체계적으로 학습하기 위한 토이 프로젝트
- 초등학교 국어 교과서에서 앱 이름을 따옴
- v1은 텍스트 입출력만 다뤄서 백엔드 핵심 흐름(DB → API → 외부 API 연동)을 가장 빠르게 경험할 수 있음
- 학습 목적이므로 편의 라이브러리 최소화, 핵심 로직은 직접 구현 우선

---

_Last updated: 2026-03-31 after M001 (쓰기 평가 MVP) completion_
