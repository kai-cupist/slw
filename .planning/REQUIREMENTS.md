# Requirements: 말하기 듣기 쓰기

**Defined:** 2026-03-30
**Core Value:** 사용자가 쓰기 주제를 받고, 텍스트를 작성하여 제출하면, AI가 평가하고 의미 있는 피드백을 돌려주는 것

## v1 Requirements

Requirements for initial release. Each maps to roadmap phases.

### 인프라 (INFRA)

- [ ] **INFRA-01**: Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다
- [ ] **INFRA-02**: 수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다
- [ ] **INFRA-03**: NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반)
- [ ] **INFRA-04**: 환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다

### 쓰기 주제 (PROMPT)

- [ ] **PROMPT-01**: 사용자가 쓰기 주제 목록을 조회할 수 있다
- [ ] **PROMPT-02**: 사용자가 쓰기 주제의 상세 내용을 확인할 수 있다
- [ ] **PROMPT-03**: 주제에 난이도(초급/중급/고급)와 카테고리가 표시된다
- [ ] **PROMPT-04**: DB에 시드 데이터(20-30개 주제)가 포함된다

### 답안 관리 (SUB)

- [ ] **SUB-01**: 사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다
- [ ] **SUB-02**: 사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다
- [ ] **SUB-03**: 사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환)
- [ ] **SUB-04**: 사용자가 제출한 답안을 삭제할 수 있다 (soft delete)
- [ ] **SUB-05**: 사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)
- [ ] **SUB-06**: 사용자가 특정 제출의 상세 내용을 확인할 수 있다

### AI 평가 (EVAL)

- [ ] **EVAL-01**: 제출된 답안에 대해 외부 LLM API(Groq)를 호출하여 평가를 수행한다
- [ ] **EVAL-02**: 평가는 다차원 루브릭(문법/논리/표현력/주제 적절성)으로 항목별 점수를 제공한다
- [ ] **EVAL-03**: 각 평가 항목에 대한 상세 피드백과 개선 제안을 반환한다
- [ ] **EVAL-04**: LLM API 호출 실패 시 재시도 및 적절한 에러 응답을 반환한다
- [ ] **EVAL-05**: 평가 결과(점수, 피드백, LLM 원본 응답)를 DB에 저장한다

### 이력 및 통계 (HIST)

- [ ] **HIST-01**: 사용자가 과거 평가 결과와 점수를 확인할 수 있다
- [ ] **HIST-02**: 사용자가 시간에 따른 점수 추이 데이터를 조회할 수 있다

### 모바일 클라이언트 (APP)

- [ ] **APP-01**: Expo(React Native) 앱에서 쓰기 주제 목록을 보고 선택할 수 있다
- [ ] **APP-02**: 앱에서 답안을 작성하고 임시저장/제출할 수 있다
- [ ] **APP-03**: 앱에서 AI 평가 결과와 상세 피드백을 확인할 수 있다
- [ ] **APP-04**: 앱에서 제출 이력과 점수 추이를 확인할 수 있다

### API 공통 (API)

- [ ] **API-01**: REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두)
- [ ] **API-02**: SQL 파라미터 바인딩으로 SQL Injection을 방지한다
- [ ] **API-03**: 입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등)

## v2 Requirements

Deferred to future release. Tracked but not in current roadmap.

### 인증

- **AUTH-01**: 사용자가 이메일/비밀번호로 회원가입할 수 있다
- **AUTH-02**: JWT 기반 인증/인가를 구현한다
- **AUTH-03**: 소셜 로그인(Google 등)을 지원한다

### 확장 기능

- **EXT-01**: 사용자가 직접 쓰기 주제를 생성/수정/삭제할 수 있다
- **EXT-02**: 오답노트로 AI 피드백 중 기억하고 싶은 내용을 관리할 수 있다
- **EXT-03**: 관리자(Admin) API로 문제를 관리할 수 있다
- **EXT-04**: 주간/월간 학습 목표를 설정하고 달성률을 추적할 수 있다
- **EXT-05**: AI 피드백에 대한 사용자 평가/메모를 남길 수 있다

### 말하기/듣기

- **ML-01**: 듣기 카테고리 (오디오 콘텐츠 재생 + 문제 풀이)
- **ML-02**: 말하기 카테고리 (음성 녹음 -> STT -> AI 평가)

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| ORM (TypeORM, Prisma 등) | 학습 목적으로 Raw SQL만 사용 |
| 자동 마이그레이션 도구 | 수동 SQL 스크립트로 관리하여 학습 |
| 실시간 자동저장 | 인증 없이 API 호출 폭주 위험, 수동 저장으로 충분 |
| 실시간 AI 피드백 (타이핑 중) | Groq 무료 티어 한도 문제, 완성 후 평가가 교육학적으로 적합 |
| AI 대화형 피드백 (챗봇) | 세션 관리 등 복잡도 급증, v1 학습 범위 초과 |
| 다국어 동시 지원 | 한국어 쓰기 평가에 집중 |
| AI 주제 자동 생성 | 품질 관리 어려움, DB 시드 데이터로 충분 |
| 소셜 기능 (랭킹, 공유) | 인증 없이 의미 없음 |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| INFRA-01 | Phase 1 | Pending |
| INFRA-02 | Phase 1 | Pending |
| INFRA-03 | Phase 1 | Pending |
| INFRA-04 | Phase 1 | Pending |
| API-01 | Phase 1 | Pending |
| API-02 | Phase 1 | Pending |
| API-03 | Phase 1 | Pending |
| PROMPT-01 | Phase 2 | Pending |
| PROMPT-02 | Phase 2 | Pending |
| PROMPT-03 | Phase 2 | Pending |
| PROMPT-04 | Phase 2 | Pending |
| SUB-01 | Phase 2 | Pending |
| SUB-02 | Phase 2 | Pending |
| SUB-03 | Phase 2 | Pending |
| SUB-04 | Phase 2 | Pending |
| SUB-05 | Phase 2 | Pending |
| SUB-06 | Phase 2 | Pending |
| EVAL-01 | Phase 3 | Pending |
| EVAL-02 | Phase 3 | Pending |
| EVAL-03 | Phase 3 | Pending |
| EVAL-04 | Phase 3 | Pending |
| EVAL-05 | Phase 3 | Pending |
| HIST-01 | Phase 3 | Pending |
| HIST-02 | Phase 3 | Pending |
| APP-01 | Phase 4 | Pending |
| APP-02 | Phase 4 | Pending |
| APP-03 | Phase 4 | Pending |
| APP-04 | Phase 4 | Pending |

**Coverage:**
- v1 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-03-30*
*Last updated: 2026-03-30 after roadmap creation*
