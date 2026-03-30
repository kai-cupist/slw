# Phase 1: 인프라 및 기반 구축 - Discussion Log

> **Audit trail only.** Do not use as input to planning, research, or execution agents.
> Decisions are captured in CONTEXT.md — this log preserves the alternatives considered.

**Date:** 2026-03-30
**Phase:** 01-인프라 및 기반 구축
**Areas discussed:** Docker Compose 구성, 마이그레이션 시스템, API 응답 형식, 프로젝트 구조
**Mode:** Auto (all areas auto-selected, recommended defaults chosen)

---

## Docker Compose 구성

| Option | Description | Selected |
|--------|-------------|----------|
| Hot reload + 볼륨 마운트 | NestJS dev 서버를 컨테이너에서 hot reload로 실행, 소스 볼륨 마운트 | ✓ |
| 호스트에서 NestJS 실행 | PostgreSQL만 Docker, NestJS는 호스트에서 실행 | |
| 프로덕션 빌드 | 멀티스테이지 빌드로 프로덕션 이미지 생성 | |

**User's choice:** [auto] Hot reload + 볼륨 마운트 (recommended default)
**Notes:** 개발 환경 편의성 최우선. docker compose up 한 번으로 전체 환경 실행.

---

## 마이그레이션 시스템

| Option | Description | Selected |
|--------|-------------|----------|
| schema_migrations 테이블 + 실행 스크립트 | DB 테이블로 적용 이력 추적, 미적용 분만 순서대로 실행 | ✓ |
| 파일 기반 추적 | .applied 파일로 로컬 추적 | |
| 수동 실행 (추적 없음) | psql로 직접 실행, 개발자가 기억 | |

**User's choice:** [auto] schema_migrations 테이블 + 실행 스크립트 (recommended default)
**Notes:** 학습 목적에 가장 적합. 마이그레이션 자체를 직접 구현하는 경험.

---

## API 응답 형식

| Option | Description | Selected |
|--------|-------------|----------|
| Envelope 패턴 | { success, data/error } 일관된 래퍼, 인터셉터/필터로 통일 | ✓ |
| NestJS 기본 | 프레임워크 기본 응답 형식 사용 | |
| RFC 7807 Problem Details | 표준 에러 형식 | |

**User's choice:** [auto] Envelope 패턴 (recommended default)
**Notes:** 프론트엔드에서 일관되게 처리 가능. 인터셉터/필터 학습에도 좋은 기회.

---

## 프로젝트 구조

| Option | Description | Selected |
|--------|-------------|----------|
| 기능 기반 모듈 + DatabaseModule(Global) | 도메인별 모듈 분리, 전역 DB 모듈, Controller-Service-Repository 레이어 | ✓ |
| 레이어 기반 구조 | controllers/, services/, repositories/ 디렉토리 분리 | |
| 하이브리드 | 기능 기반이되 공통은 레이어 기반 | |

**User's choice:** [auto] 기능 기반 모듈 + DatabaseModule(Global) (recommended default)
**Notes:** NestJS 공식 권장 패턴. 리서치 결과와도 일치.

---

## Claude's Discretion

- 정확한 Docker Compose 버전 및 이미지 태그
- NestJS 프로젝트 생성 시 패키지 매니저 선택
- 헬스체크 엔드포인트 구현 방식
- 공통 DTO 유효성 검증 데코레이터 선택

## Deferred Ideas

None — discussion stayed within phase scope
