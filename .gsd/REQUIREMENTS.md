# Requirements

## Active

## Validated

### INFRA-01 — Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: Docker Compose E2E — `docker compose up --build`로 PostgreSQL 16 + NestJS 앱 기동, GET /health로 DB 연결 확인

Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다

### INFRA-02 — 수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: MigrationService가 000~005 SQL 파일 번호순 실행, schema_migrations 테이블에 이력 기록 확인

수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다

### INFRA-03 — NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: DatabaseService.query('SELECT 1')로 Raw SQL 실행 확인, @Global() 모듈로 전역 주입 동작

NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반)

### INFRA-04 — 환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: .env.example에 DB_HOST, DB_PORT, DB_USER, DB_PASSWORD, DB_NAME, GROQ_API_KEY 정의, ConfigModule로 주입 동작

환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다

### PROMPT-01 — 사용자가 쓰기 주제 목록을 조회할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — GET /prompts?page=1&limit=3 → 30개 중 3개 반환, totalPages=10

사용자가 쓰기 주제 목록을 조회할 수 있다

### PROMPT-02 — 사용자가 쓰기 주제의 상세 내용을 확인할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — GET /prompts/1 → 상세 반환, GET /prompts/999 → 404

사용자가 쓰기 주제의 상세 내용을 확인할 수 있다

### PROMPT-03 — 주제에 난이도(초급/중급/고급)와 카테고리가 표시된다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — category/difficulty 필터링 동작, 30개 시드 데이터에 5카테고리 × 3난이도 포함

주제에 난이도(초급/중급/고급)와 카테고리가 표시된다

### PROMPT-04 — DB에 시드 데이터(20-30개 주제)가 포함된다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: 003_seed_prompts.sql로 30개 한국어 쓰기 주제 시드 데이터 적재 확인

DB에 시드 데이터(20-30개 주제)가 포함된다

### SUB-01 — 사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — POST /submissions → draft 생성, 빈 content 허용, 잘못된 prompt_id → 400

사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다

### SUB-02 — 사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — PATCH /submissions/:id → draft 수정 성공, submitted 수정 → 400

사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다

### SUB-03 — 사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — PATCH /submissions/:id/submit → status=submitted, 빈 content → 400

사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환)

### SUB-04 — 사용자가 제출한 답안을 삭제할 수 있다 (soft delete)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — DELETE /submissions/:id → soft delete, 이후 조회 → 404

사용자가 제출한 답안을 삭제할 수 있다 (soft delete)

### SUB-05 — 사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — GET /submissions → 페이지네이션 + 주제 정보 포함

사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)

### SUB-06 — 사용자가 특정 제출의 상세 내용을 확인할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S02
- Validation: S02 E2E — GET /submissions/:id → 주제 title/category/difficulty 포함

사용자가 특정 제출의 상세 내용을 확인할 수 있다

### EVAL-01 — 제출된 답안에 대해 외부 LLM API(Groq)를 호출하여 평가를 수행한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — POST /submissions/:id/evaluate → 실제 Groq API 호출, submitted 답안 평가 수행 확인

제출된 답안에 대해 외부 LLM API(Groq)를 호출하여 평가를 수행한다

### EVAL-02 — 평가는 다차원 루브릭(문법/논리/표현력/주제 적절성)으로 항목별 점수를 제공한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — grammar_score, logic_score, expression_score, relevance_score 4항목 점수(1~10) 반환 확인

평가는 다차원 루브릭(문법/논리/표현력/주제 적절성)으로 항목별 점수를 제공한다

### EVAL-03 — 각 평가 항목에 대한 상세 피드백과 개선 제안을 반환한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — feedback JSONB에 항목별 상세 피드백 포함 확인

각 평가 항목에 대한 상세 피드백과 개선 제안을 반환한다

### EVAL-04 — LLM API 호출 실패 시 재시도 및 적절한 에러 응답을 반환한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: groq-sdk 내장 재시도(429/5xx) + JSON 파싱 실패 1회 재시도 + 502/504 에러 응답 구현 확인

LLM API 호출 실패 시 재시도 및 적절한 에러 응답을 반환한다

### EVAL-05 — 평가 결과(점수, 피드백, LLM 원본 응답)를 DB에 저장한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — evaluations 테이블에 점수, feedback, raw_response 저장 후 GET /evaluations/:id로 조회 확인

평가 결과(점수, 피드백, LLM 원본 응답)를 DB에 저장한다

### HIST-01 — 사용자가 과거 평가 결과와 점수를 확인할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — GET /evaluations/history → items 배열 + 페이지네이션 메타데이터 반환 확인

사용자가 과거 평가 결과와 점수를 확인할 수 있다

### HIST-02 — 사용자가 시간에 따른 점수 추이 데이터를 조회할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S03
- Validation: S03 E2E — GET /evaluations/scores/trend → 시간순 점수 데이터 반환 확인

사용자가 시간에 따른 점수 추이 데이터를 조회할 수 있다

### APP-01 — Expo(React Native) 앱에서 쓰기 주제 목록을 보고 선택할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04
- Validation: S04 — FlatList 주제 목록 + 카테고리/난이도 뱃지 + Pressable 네비게이션, tsc 컴파일 통과

Expo(React Native) 앱에서 쓰기 주제 목록을 보고 선택할 수 있다

### APP-02 — 앱에서 답안을 작성하고 임시저장/제출할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04
- Validation: S04 — write/[submissionId] 화면으로 답안 생성(POST), 임시저장(PATCH), 제출(submit+evaluate) 구현, tsc 컴파일 통과

앱에서 답안을 작성하고 임시저장/제출할 수 있다

### APP-03 — 앱에서 AI 평가 결과와 상세 피드백을 확인할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04
- Validation: S04 — evaluation/[submissionId] 화면에서 4항목 프로그레스 바 + 총점 + feedback 텍스트 표시, tsc 컴파일 통과

앱에서 AI 평가 결과와 상세 피드백을 확인할 수 있다

### APP-04 — 앱에서 제출 이력과 점수 추이를 확인할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S04
- Validation: S04 — history.tsx에서 FlatList 이력 목록 + TrendSection 점수 추이 미니 바 구현, tsc 컴파일 통과

앱에서 제출 이력과 점수 추이를 확인할 수 있다

### API-01 — REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: ResponseInterceptor(성공: { success: true, data }) + HttpExceptionFilter(에러: { success: false, error: { code, message } }) 확인

REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두)

### API-02 — SQL 파라미터 바인딩으로 SQL Injection을 방지한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: 모든 Repository에서 $1, $2 파라미터 바인딩 사용, 문자열 연결 없음 확인

SQL 파라미터 바인딩으로 SQL Injection을 방지한다

### API-03 — 입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: S01
- Validation: 전역 ValidationPipe(whitelist, forbidNonWhitelisted, transform) + class-validator 데코레이터로 DTO 자동 검증 확인

입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등)

## Deferred

## Out of Scope
