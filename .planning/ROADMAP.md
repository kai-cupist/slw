# 로드맵: 말하기 듣기 쓰기

## 개요

이 프로젝트는 쓰기 평가 학습 앱의 백엔드를 처음부터 구축하는 과정이다. Docker + PostgreSQL + NestJS 인프라 기반 위에, 쓰기 주제 제공과 답안 관리 기능을 만들고, 외부 LLM API를 연동하여 AI 평가/피드백 흐름을 완성한 뒤, 마지막으로 Expo 모바일 앱에서 전체 사용자 경험을 엮는다. "주제 선택 -> 답안 작성 -> 제출 -> AI 평가 -> 피드백 확인"이라는 핵심 흐름이 끝까지 동작하는 것이 v1의 유일한 목표다.

## Phases

**Phase 넘버링:**
- 정수 페이즈 (1, 2, 3): 계획된 마일스톤 작업
- 소수 페이즈 (2.1, 2.2): 긴급 삽입 (INSERTED 표시)

소수 페이즈는 해당 정수 사이에서 숫자 순서대로 실행된다.

- [ ] **Phase 1: 인프라 및 기반 구축** - Docker Compose 환경, DB 연결, 마이그레이션 체계, 공통 API 패턴 확립
- [ ] **Phase 2: 쓰기 주제 및 답안 관리** - 주제 조회부터 답안 임시저장/제출/이력 조회/삭제까지 핵심 데이터 흐름 완성
- [ ] **Phase 3: AI 평가 및 이력** - LLM API 연동으로 다차원 평가/피드백을 제공하고, 점수 추이까지 조회 가능
- [ ] **Phase 4: 모바일 클라이언트** - Expo 앱에서 전체 사용자 흐름(주제 선택 -> 작성 -> 제출 -> 결과 확인 -> 이력) 완성

## Phase Details

### Phase 1: 인프라 및 기반 구축
**Goal**: 개발자가 NestJS 앱에서 PostgreSQL에 Raw SQL로 접근할 수 있고, 모든 후속 기능 개발의 기반이 준비된 상태
**Depends on**: Nothing (첫 번째 페이즈)
**Requirements**: INFRA-01, INFRA-02, INFRA-03, INFRA-04, API-01, API-02, API-03
**Success Criteria** (반드시 참이어야 하는 것):
  1. `docker compose up` 한 번으로 PostgreSQL과 NestJS 앱이 실행되고, 앱이 DB에 연결된 상태로 헬스체크에 응답한다
  2. `migrations/` 폴더의 SQL 스크립트를 순서대로 실행하면 스키마가 생성되고, `schema_migrations` 테이블에 적용 이력이 기록된다
  3. API 응답이 성공/에러 모두 일관된 JSON 형식으로 반환되고, 유효성 검증 실패 시 구체적인 에러 메시지가 포함된다
  4. 환경 변수(.env)로 DB 접속 정보와 API 키가 관리되며, .env.example 파일이 존재한다
**Plans**: 2 plans

Plans:
- [ ] 01-01-PLAN.md -- NestJS 프로젝트 생성, Docker Compose 환경 구성, DatabaseModule 구축
- [ ] 01-02-PLAN.md -- 수동 SQL 마이그레이션 시스템, API 공통 레이어(Envelope 응답, 유효성 검증, Swagger)

### Phase 2: 쓰기 주제 및 답안 관리
**Goal**: 사용자가 쓰기 주제를 탐색하고, 답안을 작성/임시저장/제출/삭제하며, 과거 제출 이력을 조회할 수 있는 상태
**Depends on**: Phase 1
**Requirements**: PROMPT-01, PROMPT-02, PROMPT-03, PROMPT-04, SUB-01, SUB-02, SUB-03, SUB-04, SUB-05, SUB-06
**Success Criteria** (반드시 참이어야 하는 것):
  1. API로 쓰기 주제 목록을 조회하면 난이도와 카테고리가 포함된 주제들이 반환되고, 개별 주제의 상세 내용을 확인할 수 있다
  2. 사용자가 주제에 대해 답안을 작성하고 임시저장한 뒤, 나중에 이어쓰기/수정할 수 있다
  3. 임시저장된 답안을 최종 제출하면 상태가 draft에서 submitted로 전환되고, 제출된 답안은 soft delete로 삭제할 수 있다
  4. 과거 제출 내역을 페이지네이션된 목록으로 조회할 수 있고, 특정 제출의 상세 내용을 확인할 수 있다
  5. DB에 시드 데이터(20-30개 주제)가 존재하여 즉시 테스트할 수 있다
**Plans**: TBD

Plans:
- [ ] 02-01: TBD
- [ ] 02-02: TBD
- [ ] 02-03: TBD

### Phase 3: AI 평가 및 이력
**Goal**: 제출된 답안에 대해 AI가 다차원 루브릭으로 평가하고 상세 피드백을 제공하며, 시간에 따른 점수 추이를 확인할 수 있는 상태
**Depends on**: Phase 2
**Requirements**: EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05, HIST-01, HIST-02
**Success Criteria** (반드시 참이어야 하는 것):
  1. 답안을 제출하면 Groq LLM API가 호출되어 문법/논리/표현력/주제 적절성 4개 항목별 점수가 반환된다
  2. 각 평가 항목에 대한 상세 피드백과 개선 제안이 포함된 평가 결과를 확인할 수 있다
  3. LLM API 호출이 실패하면 재시도가 수행되고, 최종 실패 시 적절한 에러 응답이 반환된다
  4. 평가 결과(점수, 피드백, LLM 원본 응답)가 DB에 저장되고, 과거 평가 결과와 시간별 점수 추이를 조회할 수 있다
**Plans**: TBD

Plans:
- [ ] 03-01: TBD
- [ ] 03-02: TBD

### Phase 4: 모바일 클라이언트
**Goal**: Expo 앱에서 "주제 선택 -> 답안 작성 -> 제출 -> AI 평가 확인 -> 이력 조회" 전체 흐름이 동작하는 상태
**Depends on**: Phase 3
**Requirements**: APP-01, APP-02, APP-03, APP-04
**Success Criteria** (반드시 참이어야 하는 것):
  1. 앱에서 쓰기 주제 목록을 보고 원하는 주제를 선택할 수 있다
  2. 앱에서 답안을 작성하고 임시저장 또는 최종 제출할 수 있다
  3. 앱에서 AI 평가 결과(항목별 점수 + 상세 피드백)를 확인할 수 있다
  4. 앱에서 과거 제출 이력과 점수 추이를 확인할 수 있다
**Plans**: TBD
**UI hint**: yes

Plans:
- [ ] 04-01: TBD
- [ ] 04-02: TBD

## Progress

**실행 순서:**
페이즈는 숫자 순서대로 실행: 1 -> 2 -> 3 -> 4

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. 인프라 및 기반 구축 | 0/2 | Planning | - |
| 2. 쓰기 주제 및 답안 관리 | 0/3 | Not started | - |
| 3. AI 평가 및 이력 | 0/2 | Not started | - |
| 4. 모바일 클라이언트 | 0/2 | Not started | - |
