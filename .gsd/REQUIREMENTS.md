# Requirements

## Active

### PROMPT-01 — 사용자가 쓰기 주제 목록을 조회할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 쓰기 주제 목록을 조회할 수 있다

### PROMPT-02 — 사용자가 쓰기 주제의 상세 내용을 확인할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 쓰기 주제의 상세 내용을 확인할 수 있다

### SUB-01 — 사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다

### SUB-02 — 사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다

### SUB-03 — 사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환)

### SUB-04 — 사용자가 제출한 답안을 삭제할 수 있다 (soft delete)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 제출한 답안을 삭제할 수 있다 (soft delete)

### SUB-05 — 사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)

### SUB-06 — 사용자가 특정 제출의 상세 내용을 확인할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 특정 제출의 상세 내용을 확인할 수 있다

### EVAL-01 — 제출된 답안에 대해 외부 LLM API(Groq)를 호출하여 평가를 수행한다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

제출된 답안에 대해 외부 LLM API(Groq)를 호출하여 평가를 수행한다

### EVAL-02 — 평가는 다차원 루브릭(문법/논리/표현력/주제 적절성)으로 항목별 점수를 제공한다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

평가는 다차원 루브릭(문법/논리/표현력/주제 적절성)으로 항목별 점수를 제공한다

### EVAL-03 — 각 평가 항목에 대한 상세 피드백과 개선 제안을 반환한다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

각 평가 항목에 대한 상세 피드백과 개선 제안을 반환한다

### EVAL-04 — LLM API 호출 실패 시 재시도 및 적절한 에러 응답을 반환한다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

LLM API 호출 실패 시 재시도 및 적절한 에러 응답을 반환한다

### EVAL-05 — 평가 결과(점수, 피드백, LLM 원본 응답)를 DB에 저장한다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

평가 결과(점수, 피드백, LLM 원본 응답)를 DB에 저장한다

### HIST-01 — 사용자가 과거 평가 결과와 점수를 확인할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 과거 평가 결과와 점수를 확인할 수 있다

### HIST-02 — 사용자가 시간에 따른 점수 추이 데이터를 조회할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

사용자가 시간에 따른 점수 추이 데이터를 조회할 수 있다

### APP-01 — Expo(React Native) 앱에서 쓰기 주제 목록을 보고 선택할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Expo(React Native) 앱에서 쓰기 주제 목록을 보고 선택할 수 있다

### APP-02 — 앱에서 답안을 작성하고 임시저장/제출할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

앱에서 답안을 작성하고 임시저장/제출할 수 있다

### APP-03 — 앱에서 AI 평가 결과와 상세 피드백을 확인할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

앱에서 AI 평가 결과와 상세 피드백을 확인할 수 있다

### APP-04 — 앱에서 제출 이력과 점수 추이를 확인할 수 있다

- Status: active
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

앱에서 제출 이력과 점수 추이를 확인할 수 있다

## Validated

### INFRA-01 — Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다

### INFRA-02 — 수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다

### INFRA-03 — NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반)

### INFRA-04 — 환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다

### PROMPT-03 — 주제에 난이도(초급/중급/고급)와 카테고리가 표시된다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

주제에 난이도(초급/중급/고급)와 카테고리가 표시된다

### PROMPT-04 — DB에 시드 데이터(20-30개 주제)가 포함된다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

DB에 시드 데이터(20-30개 주제)가 포함된다

### API-01 — REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두)

### API-02 — SQL 파라미터 바인딩으로 SQL Injection을 방지한다

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

SQL 파라미터 바인딩으로 SQL Injection을 방지한다

### API-03 — 입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등)

- Status: validated
- Class: core-capability
- Source: inferred
- Primary Slice: none yet

입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등)

## Deferred

## Out of Scope
