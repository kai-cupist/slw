# 말하기 듣기 쓰기

## What This Is

사용자의 언어 능력(말하기, 듣기, 쓰기)을 향상시키는 학습 앱. v1에서는 쓰기 카테고리만 구현하여, 주제에 대해 텍스트를 작성하면 AI가 문법, 논리, 표현력 등을 평가하고 피드백을 제공한다. 프론트엔드 개발자가 백엔드 개발 경험을 쌓기 위한 학습 목적의 토이 프로젝트이다.

## Core Value

사용자가 쓰기 주제를 받고, 텍스트를 작성하여 제출하면, AI가 평가하고 의미 있는 피드백을 돌려주는 것 — 이 한 가지 흐름이 반드시 동작해야 한다.

## Requirements

### Validated

- ✓ Docker Compose로 PostgreSQL + NestJS 개발 환경 실행 — Phase 1
- ✓ 수동 SQL 마이그레이션으로 DB 스키마 관리 — Phase 1
- ✓ NestJS에서 Raw SQL(pg Pool)로 DB 접근 — Phase 1
- ✓ 일관된 API 응답 형식 (Envelope 패턴) — Phase 1
- ✓ SQL 파라미터 바인딩으로 SQL Injection 방지 — Phase 1
- ✓ 쓰기 주제/프롬프트를 DB에서 조회하여 제공 — Phase 2
- ✓ 작성 중인 답안을 임시저장하고, 이어쓰기/수정할 수 있음 — Phase 2
- ✓ 임시저장된 답안 또는 새로 작성한 텍스트를 최종 제출 — Phase 2
- ✓ 제출한 답안을 삭제할 수 있음 — Phase 2

### Active

- [ ] 외부 LLM API를 호출하여 텍스트를 평가
- [ ] 점수와 상세 피드백을 사용자에게 반환
- [ ] 과거 제출 내역과 점수 추이를 확인

### Out of Scope

- 인증/로그인 — v2에서 추가 예정
- 말하기 카테고리 (음성 파일 업로드, STT) — v2 이후
- 듣기 카테고리 (오디오 콘텐츠 관리, 재생) — v2 이후
- 소셜 기능 (랭킹, 공유 등) — v2 이후
- ORM 사용 — 학습 목적으로 Raw SQL만 사용
- 자동 마이그레이션 도구 — 수동 SQL 스크립트로 관리

## Context

- 프론트엔드 개발자가 서버 쪽을 체계적으로 학습하기 위한 토이 프로젝트
- 초등학교 국어 교과서에서 앱 이름을 따옴
- v1은 텍스트 입출력만 다뤄서 백엔드 핵심 흐름(DB -> API -> 외부 API 연동)을 가장 빠르게 경험할 수 있음
- AI 평가 API 후보: Groq 무료 티어(1순위), Google Gemini API, OpenRouter, Ollama(로컬)
- 학습 목적이므로 편의 라이브러리 최소화, 핵심 로직은 직접 구현 우선

## Constraints

- **Tech Stack**: NestJS (백엔드), Expo/React Native (프론트엔드), PostgreSQL 16.11 (DB), Docker Compose (인프라) — 프로젝트 브리프에서 확정
- **ORM 금지**: Raw SQL만 사용 — SQL 동작 방식을 체득하기 위한 학습 제약
- **DB 마이그레이션**: 수동 SQL 스크립트 — 자동 마이그레이션 도구 사용 금지
- **비용**: 무료 또는 저비용 AI API — 토이 프로젝트이므로 무료 티어 우선
- **편의 라이브러리**: 최소화 — 핵심 로직은 직접 구현, 도입 시 이유 설명 필수

## Key Decisions

| Decision                  | Rationale                                       | Outcome   |
| ------------------------- | ----------------------------------------------- | --------- |
| v1은 쓰기 카테고리만 구현 | 텍스트 I/O만으로 백엔드 핵심 흐름을 빠르게 경험 | — Pending |
| Raw SQL 사용 (ORM 금지)   | SQL 근본 동작 방식 체득 후 ORM 필요성 체감      | — Pending |
| Groq 무료 티어 1순위      | Llama 3.3 70B, 일일 1,000 요청, 빠른 추론 속도  | — Pending |
| 인증 없이 시작            | v1 범위 최소화, v2에서 추가                     | — Pending |

## Evolution

This document evolves at phase transitions and milestone boundaries.

**After each phase transition** (via `/gsd:transition`):

1. Requirements invalidated? -> Move to Out of Scope with reason
2. Requirements validated? -> Move to Validated with phase reference
3. New requirements emerged? -> Add to Active
4. Decisions to log? -> Add to Key Decisions
5. "What This Is" still accurate? -> Update if drifted

**After each milestone** (via `/gsd:complete-milestone`):

1. Full review of all sections
2. Core Value check — still the right priority?
3. Audit Out of Scope — reasons still valid?
4. Update Context with current state

---

_Last updated: 2026-03-30 after Phase 2 completion_
