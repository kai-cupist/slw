# 프로젝트 연구 요약

**프로젝트:** 말하기 듣기 쓰기 (v1 - 쓰기 평가)
**도메인:** 언어 학습 앱 (AI 기반 쓰기 평가)
**조사일:** 2026-03-30
**신뢰도:** HIGH

## 핵심 요약

"말하기 듣기 쓰기"는 자유 작문에 대한 AI 다차원 평가를 제공하는 언어 학습 앱으로, v1은 쓰기 카테고리에 집중한다. 이 앱의 핵심 흐름은 "주제 선택 -> 답안 작성 -> 제출 -> LLM 평가 -> 피드백 확인"이며, 이 흐름이 완전히 동작하는 것이 v1의 유일한 목표다. NestJS + PostgreSQL(Raw SQL) + Groq API 조합이 연구를 통해 확정되었으며, 백엔드 학습이 주목적이므로 ORM, 자동 마이그레이션, 서버 상태 관리 라이브러리는 의도적으로 배제한다.

아키텍처는 기능 기반 모듈 구조(PromptsModule, SubmissionsModule, EvaluationsModule, LlmModule)를 따르며, Service-Repository 레이어 분리와 LLM 프로바이더 추상화가 핵심 패턴이다. Raw SQL을 직접 다루므로 Repository 레이어에서 SQL을 캡슐화하고 DatabaseService를 통해 pg Pool을 전역 모듈로 관리하는 패턴이 권장된다. LLM 호출을 DB 트랜잭션 밖에서 처리하는 것(외부 API는 롤백 불가)이 가장 중요한 아키텍처 결정이다.

가장 큰 위험은 두 가지다. 첫째, LLM 평가 품질: 구조화된 JSON 응답 강제, 상세 채점 루브릭 프롬프트 설계, temperature 최소화로 일관성을 확보해야 한다. 둘째, Groq 무료 티어의 일일 1,000 요청 제한: 개발 중에는 llama-3.1-8b-instant(RPD 14,400)를 사용하고, 429 에러에 대한 폴백과 재시도 로직을 반드시 LlmModule에 내장해야 한다. SQL Injection 방지(파라미터 바인딩), 커넥션 풀 관리(finally 블록의 release()), 수동 마이그레이션 추적 시스템도 Phase 1부터 확립해야 한다.

## 주요 발견 사항

### 권장 스택

백엔드는 NestJS 11 + pg(node-postgres) + Groq SDK 조합으로 확정되었다. NestJS 11은 모듈/서비스/컨트롤러 패턴 학습에 최적이며, pg 라이브러리는 Raw SQL을 직접 다루기 위한 사실상의 표준이다. Groq 무료 티어(llama-3.3-70b-versatile, RPD 1,000)가 AI 평가의 1순위이며, 개발 중에는 RPD가 14,400인 llama-3.1-8b-instant를 사용하는 전략이 효율적이다. 프론트엔드는 Expo SDK 55 + expo-router + Zustand 조합으로, v1에서는 fetch/useEffect 패턴으로 직접 API 호출을 구현한다(TanStack Query는 v2에서 도입).

**핵심 기술:**
- NestJS 11.x: 백엔드 프레임워크 — 모듈/서비스/컨트롤러 패턴 학습 최적. Express 5 기반
- pg 8.20.x: PostgreSQL 클라이언트 — Raw SQL 실행, Pool 기반 커넥션 관리
- groq-sdk 1.1.x: Groq API 클라이언트 — 빠른 추론, 무료 티어 RPD 1,000(프로덕션) / 14,400(개발)
- Expo SDK 55: 모바일 클라이언트 — React Native 0.83, New Architecture
- Zustand 5.x: 클라이언트 상태 관리 — Provider 없는 훅 기반, v1 앱 구조에 충분
- PostgreSQL 16.11: DB — JSONB 타입으로 LLM 원본 응답 저장
- Docker Compose v2: 인프라 — PostgreSQL + NestJS 컨테이너 통합 관리

### 예상 기능

v1의 7가지 핵심 기능은 모두 "주제 -> 작성 -> 제출 -> 평가 -> 피드백"이라는 단일 흐름을 완성하는 데 집중된다. 특히 다차원 평가 루브릭(문법/논리/표현력/주제 적절성)은 필수 기능이며, 단순 점수가 아닌 항목별 피드백 + 개선 제안이 이 앱의 핵심 가치다.

**반드시 구현해야 하는 기능 (v1 Table Stakes):**
- 쓰기 주제 제공 — 앱의 시작점. DB 시드 데이터 20-30개 + 목록/상세 API
- 텍스트 입력 및 제출 — 임시저장(draft) -> 최종 제출(submitted) 상태 전환
- AI 평가 및 점수 — LLM API 호출. 문법/논리/표현력/적절성 4항목 루브릭
- 상세 피드백 반환 — 항목별 점수 + 개선 제안. 학습 효과의 핵심
- 임시저장 — 수동 저장 버튼. Upsert 패턴으로 draft 상태 답안 관리
- 제출 이력 조회 — 과거 제출 목록/상세 + 날짜순 정렬. 페이지네이션 필요
- 답안 삭제 — Soft delete 권장. 연관 평가 데이터 ON DELETE CASCADE

**개선 기능 (v1.x - 핵심 흐름 검증 후):**
- 난이도별 주제 필터링 — DB 컬럼(difficulty_level) 설계 시 미리 추가
- 주제 카테고리 필터링 — DB 컬럼(category) 설계 시 미리 추가
- 점수 추이 데이터 API — 제출 데이터 충분히 쌓인 후. SQL 집계 쿼리 연습
- 평가 항목별 약점 분석 — 다차원 루브릭 데이터 기반

**v2 이후로 연기:**
- 사용자 인증(JWT) — 인증 없이는 기기 간 동기화 불가. v2 핵심 과제
- 실시간 자동저장 — 인증 기반 사용자 식별 선행 필요
- 소셜 기능(랭킹/공유) — 인증 없이 의미 없음
- AI 대화형 피드백 — 세션 관리, 대화 히스토리 등 복잡도 급증

### 아키텍처 접근 방식

3개 도메인 모듈(PromptsModule, SubmissionsModule, EvaluationsModule)이 DatabaseModule(Global)과 LlmModule을 공유하는 구조다. 기능 기반 모듈 구성이 핵심이며, 각 모듈 내에 Controller-Service-Repository 레이어를 분리한다. `migrations/` 폴더를 프로젝트 루트에 두고 번호 순서로 수동 SQL 마이그레이션을 관리한다.

**주요 컴포넌트:**
1. DatabaseModule (Global) — pg Pool 싱글턴 관리, query/queryOne 래퍼 제공
2. LlmModule — Groq API 추상화, 프롬프트 조립, JSON 파싱, 재시도 로직 캡슐화
3. PromptsModule — 쓰기 주제 CRUD, 목록/상세 조회 API
4. SubmissionsModule — 답안 임시저장/제출/이력 조회/삭제, 상태 전이(draft -> submitted -> evaluated)
5. EvaluationsModule — LLM 평가 요청, 결과 파싱/검증/저장
6. CommonModule — GlobalExceptionFilter, ResponseTransformInterceptor, ValidationPipe

### 핵심 주의사항

연구를 통해 식별된 최우선 위험 7가지:

1. **SQL Injection** — 동적 쿼리 구성 시 `${}` 문자열 결합 대신 반드시 `$1`, `$2` 파라미터 바인딩 사용. 식별자(컬럼명)는 화이트리스트 방식으로 검증
2. **DB 커넥션 풀 고갈** — `pool.connect()` 사용 시 `try/finally { client.release() }` 패턴 필수. 단순 쿼리는 `pool.query()` 사용(자동 release)
3. **LLM API 응답 지연/타임아웃** — HTTP 클라이언트에 30-60초 타임아웃 설정. 재시도 + 지수 백오프(3회). v1은 동기 처리로 시작 가능
4. **LLM 평가 점수 비일관성** — 상세 채점 루브릭 프롬프트, JSON 스키마 강제(`response_format: {type: "json_object"}`), `temperature: 0`으로 편차 최소화
5. **Groq Rate Limit 미대비** — 429 에러 핸들링, 폴백 provider(Gemini), 개발 중 모킹 전략 필수
6. **수동 마이그레이션 추적 실패** — `schema_migrations` 추적 테이블, 번호 순서 네이밍 규칙, 직접 psql ALTER 금지
7. **LLM API 호출을 DB 트랜잭션 안에 포함** — 외부 API 호출은 반드시 트랜잭션 밖에서 처리(롤백 불가)

## 로드맵 시사점

아키텍처 연구에서 도출된 의존성 기반 권장 구현 순서:

### Phase 1: 인프라 및 DB 기반 구축
**근거:** 모든 기능이 의존하는 기반. 나중에 변경 시 비용이 가장 큰 영역.
**산출물:** Docker Compose 환경, DatabaseModule, 마이그레이션 스크립트(3개 테이블), CommonModule(에러 필터, 응답 포맷)
**구현 기능:** 없음 (기반 인프라만)
**예방 피트폴:** SQL Injection 방어 패턴 확립, 커넥션 풀 관리, 마이그레이션 추적 시스템, 환경 변수 관리(.env + ConfigModule)

### Phase 2: 쓰기 주제 관리 (PromptsModule)
**근거:** 답안(submissions)이 주제(prompts)를 FK로 참조하므로, 주제 없이는 답안 테스트가 불가능함. 가장 단순한 CRUD로 NestJS 패턴 학습 시작
**산출물:** PromptsModule(Controller + Service + Repository), 시드 데이터 20-30개, REST API 테스트
**구현 기능:** 쓰기 주제 제공 (목록/상세 조회, 카테고리/난이도 컬럼 포함 설계)
**사용 스택:** NestJS Module/Controller/Service 패턴, pg Raw SQL, class-validator DTO

### Phase 3: 답안 관리 (SubmissionsModule)
**근거:** 평가(evaluations)는 제출된 답안을 대상으로 하므로, 제출 플로우가 먼저 완성되어야 함. 상태 머신(draft -> submitted -> evaluated) 구현이 핵심 학습 포인트
**산출물:** SubmissionsModule, 임시저장/제출/이력 조회/삭제 API, 상태 전이 로직
**구현 기능:** 텍스트 입력 및 제출, 임시저장, 제출 이력 조회, 답안 삭제
**아키텍처:** Upsert 패턴(ON CONFLICT)으로 draft 단일 저장, Soft delete 구현

### Phase 4: AI 평가 연동 (LlmModule + EvaluationsModule)
**근거:** 이 앱의 핵심 가치. 전 단계의 기반이 모두 완성된 후 구현. 가장 복잡한 외부 API 연동 + 프롬프트 엔지니어링이 필요한 영역
**산출물:** LlmModule(Groq API 추상화, 재시도, 폴백), EvaluationsModule(평가 요청/결과 저장), 프롬프트 루브릭 설계
**구현 기능:** AI 평가 및 점수, 상세 피드백 반환 (4항목 다차원 루브릭)
**예방 피트폴:** LLM 응답 지연 처리, Rate Limit 관리, 점수 비일관성 방어, 프롬프트 인젝션 기본 방어

### Phase 5: 모바일 클라이언트 (Expo)
**근거:** 백엔드 API가 완성된 후 시작. 이 프로젝트의 주목적이 백엔드 학습이므로 프론트엔드는 마지막
**산출물:** Expo 앱, API 클라이언트, 핵심 화면 4개(주제 목록, 답안 작성, 평가 결과, 이력)
**구현 기능:** 전체 UX 흐름 (주제 선택 -> 작성 -> 제출 -> 결과 확인 -> 이력 조회)
**사용 스택:** Expo SDK 55, expo-router, Zustand, fetch/useEffect 패턴

### Phase 순서 근거

- **Phase 1이 전제 조건:** Docker Compose 없이는 PostgreSQL이 없고, DatabaseModule 없이는 Repository를 테스트할 수 없음
- **Phase 2 -> Phase 3 순서:** prompts 테이블이 없으면 submissions FK가 에러 발생. 시드 데이터가 있어야 답안 제출 테스트가 가능
- **Phase 3 -> Phase 4 순서:** EvaluationsModule은 submitted 상태의 답안을 입력으로 받음. 제출 플로우 없이는 평가 연동 테스트 불가
- **Phase 5 마지막:** 백엔드 API가 Swagger로 검증된 후 프론트엔드를 붙이는 것이 디버깅 비용을 최소화

### 연구 플래그

추가 조사가 필요할 수 있는 Phase:
- **Phase 4 (AI 평가):** LLM 프롬프트 엔지니어링은 반복 실험이 필요한 영역. 평가 루브릭의 최적 설계와 JSON 응답 안정성 확보에 추가 시간 필요. Groq Structured Outputs 공식 문서 재확인 권장
- **Phase 4 (AI 평가):** Groq Llama 3.3 70B의 한국어 평가 품질을 개발 초기에 실제 테스트해야 함. 품질이 기대에 못 미치면 llama-4-scout-17b(토큰 한도 높음) 또는 Gemini로 전환 검토

표준 패턴으로 충분한 Phase (추가 조사 불필요):
- **Phase 1 (인프라):** Docker Compose + NestJS + pg 패턴은 문서화가 충분
- **Phase 2 (PromptsModule):** 기본 CRUD는 NestJS 공식 문서 패턴으로 충분
- **Phase 3 (SubmissionsModule):** 상태 전이 + Upsert 패턴은 아키텍처 연구에서 SQL 예시까지 제공됨
- **Phase 5 (Expo):** Expo SDK 55 + expo-router는 공식 문서가 충분

## 신뢰도 평가

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| 스택 | HIGH | npm 레지스트리 버전 확인, 공식 문서에서 호환성 검증 |
| 기능 | MEDIUM-HIGH | 경쟁 제품 분석 + 교육학 연구 기반. 루브릭 품질은 실험 필요 |
| 아키텍처 | HIGH | NestJS 공식 문서 + Raw SQL 패턴 검증. 실무 사례 다수 확인 |
| 주의사항 | HIGH | 공식 문서(OWASP, node-postgres, Groq) + 실무 사례 기반 |

**전체 신뢰도:** HIGH

### 보완이 필요한 사항

- **LLM 프롬프트 품질:** 한국어 쓰기 평가에 최적화된 루브릭 프롬프트는 이론보다 실험이 중요. Phase 4에서 충분한 프롬프트 반복 실험 시간을 로드맵에 반영해야 함
- **TypeScript 6.0 호환성:** NestJS 11 및 Expo SDK 55와의 호환성이 충분히 검증되지 않음. 안전하게 TypeScript 5.7.x로 시작하고, 호환성 확인 후 6.0 업그레이드 검토
- **인증 없는 v1의 데이터 격리:** v1에서 인증 없이 기기별 UUID로 사용자를 구분하는 전략의 구체적 구현 방법이 연구에서 명확히 정의되지 않음. 기기 식별자 저장 방법(expo-secure-store 등) 검토 필요

## 출처

### 주요 출처 (HIGH 신뢰도)
- [NestJS 11 공식 문서 - Database](https://docs.nestjs.com/techniques/database) — Raw SQL + pg Pool 패턴
- [NestJS 11 공식 문서 - Modules](https://docs.nestjs.com/modules) — 모듈 구조 패턴
- [node-postgres 공식 문서](https://node-postgres.com/features/queries) — 파라미터 바인딩, 커넥션 풀
- [Groq Rate Limits 공식 문서](https://console.groq.com/docs/rate-limits) — 무료 티어 한도 확인
- [Groq Structured Outputs 공식 문서](https://console.groq.com/docs/structured-outputs) — JSON 응답 모드
- [OWASP LLM Top 10 2025](https://genai.owasp.org/llmrisk/llm01-prompt-injection/) — 프롬프트 인젝션 위험
- [Expo SDK 55 변경로그](https://expo.dev/changelog/sdk-55) — React Native 0.83 확인

### 보조 출처 (MEDIUM 신뢰도)
- [NestJS + Raw SQL 가이드 (wanago.io)](https://wanago.io/2022/08/29/api-nestjs-postgresql-raw-sql-queries/) — Repository 패턴 실무 예시
- [LLM-as-a-Judge 실용 가이드](https://towardsdatascience.com/llm-as-a-judge-a-practical-guide/) — 루브릭 평가 설계
- [Zustand npm](https://www.npmjs.com/package/zustand) — 모바일 앱 상태 관리
- [NestJS 11 발표 (trilon.io)](https://trilon.io/blog/announcing-nestjs-11-whats-new) — v11 변경사항 확인

---
*연구 완료: 2026-03-30*
*로드맵 준비 완료: yes*
