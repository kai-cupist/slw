# Phase 2: 쓰기 주제 및 답안 관리 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 02-prompts-submissions
**Areas discussed:** DB 스키마 설계, 답안 상태 관리, 페이지네이션 방식, 사용자 식별, 시드 데이터 구성, API 엔드포인트 설계
**Mode:** --auto (모든 결정이 자동 선택됨)

---

## DB 스키마 설계

| Option                  | Description                              | Selected |
| ----------------------- | ---------------------------------------- | -------- |
| SERIAL (자동 증가 정수) | 직관적, 디버깅 용이, 학습 목적에 적합    | ✓        |
| UUID                    | 분산 시스템 적합, 보안적 이점, 구현 복잡 |          |

**User's choice:** [auto] SERIAL — 학습 프로젝트에서 직관성 우선
**Notes:** prompts, submissions 2개 테이블로 정규화된 기본 구조. 외래키로 연결.

---

## 답안 상태 관리

| Option                     | Description                        | Selected |
| -------------------------- | ---------------------------------- | -------- |
| VARCHAR + CHECK constraint | 마이그레이션 시 변경 용이, 유연함  | ✓        |
| PostgreSQL ENUM type       | 타입 안전, 변경 시 ALTER TYPE 필요 |          |
| 별도 status 테이블         | 정규화 극대화, 이 규모에서는 과도  |          |

**User's choice:** [auto] VARCHAR + CHECK constraint ('draft', 'submitted')
**Notes:** 단방향 전환만 허용 (draft → submitted). Soft delete는 deleted_at TIMESTAMP.

---

## 페이지네이션 방식

| Option       | Description                                | Selected |
| ------------ | ------------------------------------------ | -------- |
| offset/limit | SQL 기본, 직관적, 학습 적합, 소규모 데이터 | ✓        |
| cursor-based | 대규모 데이터 효율적, 구현 복잡            |          |

**User's choice:** [auto] offset/limit — 데이터 규모 작고 SQL 학습에 직관적
**Notes:** 기본 정렬 created_at DESC, 페이지 크기 10, 응답에 total 포함.

---

## 사용자 식별 (인증 없음)

| Option                  | Description                               | Selected |
| ----------------------- | ----------------------------------------- | -------- |
| X-User-Id 헤더          | 클라이언트 UUID 생성/로컬 저장, 구현 단순 | ✓        |
| 단일 사용자 (식별 없음) | 가장 단순, 멀티유저 불가                  |          |
| Session cookie          | 서버 상태 필요, v1에서 과도               |          |

**User's choice:** [auto] X-User-Id 헤더 — v2 인증 전까지 임시 식별자
**Notes:** 헤더 없으면 400 에러. user_id 컬럼은 VARCHAR로 UUID 문자열 저장.

---

## 시드 데이터 구성

| Option                           | Description                        | Selected |
| -------------------------------- | ---------------------------------- | -------- |
| 5개 카테고리 × 3난이도 (25-30개) | 균형 잡힌 구성, 초등 국어 기반     | ✓        |
| 3개 카테고리 × 3난이도 (15개)    | 최소 구성, 테스트에 부족할 수 있음 |          |

**User's choice:** [auto] 5개 카테고리 (일기, 편지, 감상문, 설명문, 논설문) × 3단계
**Notes:** 마이그레이션 SQL 파일로 관리.

---

## API 엔드포인트 설계

| Option              | Description                        | Selected |
| ------------------- | ---------------------------------- | -------- |
| RESTful 리소스 분리 | /prompts, /submissions 독립 리소스 | ✓        |
| 중첩 리소스         | /prompts/:id/submissions           |          |

**User's choice:** [auto] 독립 리소스 — /prompts (읽기 전용), /submissions (CRUD)
**Notes:** 주제 필터링은 쿼리 파라미터로. 제출은 별도 PATCH /submissions/:id/submit.

---

## Claude's Discretion

- SQL 인덱스 설계
- DTO 유효성 검증 규칙 (글자 수 제한 등)
- 필터링 쿼리 동적 WHERE 절 구성 방식
- 에러 코드 문자열

## Deferred Ideas

None — discussion stayed within phase scope
