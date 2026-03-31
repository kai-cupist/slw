---
estimated_steps: 11
estimated_files: 7
skills_used: []
---

# T01: evaluations 테이블 마이그레이션 + groq-sdk 설치 + LlmModule 구현

S03의 기반을 마련한다. (1) evaluations 테이블 생성 + submissions CHECK constraint에 'evaluated' 추가, (2) groq-sdk npm 패키지 설치, (3) Groq SDK를 래핑하는 LlmModule/LlmService 구현.

LlmService는 한국어 쓰기 평가 프롬프트를 관리하고, JSON Object Mode로 구조화된 평가 결과를 요청하며, 응답을 파싱·검증하는 역할을 한다. groq-sdk의 내장 재시도(429/5xx 자동 2회)에 더해, JSON 파싱 실패 시 1회 재시도 로직을 추가한다.

핵심 패턴:
- ConfigService로 GROQ_API_KEY, LLM_MODEL 환경변수 주입
- response_format: { type: 'json_object' } + 프롬프트 내 JSON 스키마 명시
- 응답 파싱 후 4항목 점수(1~10 범위) + 피드백 필드 존재 수동 검증
- GROQ_API_KEY는 secure_env_collect로 수집

DB 마이그레이션:
- 004_create_evaluations.sql: evaluations 테이블 (submission_id UNIQUE FK, 4개 점수 컬럼, total_score NUMERIC(3,1), feedback JSONB, raw_response JSONB)
- 005_add_evaluated_status.sql: submissions CHECK constraint DROP + ADD ('draft','submitted','evaluated')

SubmissionsModule 변경: SubmissionsService와 SubmissionsRepository를 export하여 EvaluationsModule에서 사용 가능하게 함.

## Inputs

- ``server/src/database/database.service.ts` — DatabaseService query/queryOne 인터페이스`
- ``server/src/submissions/submissions.module.ts` — export 추가 대상`
- ``server/src/submissions/submissions.service.ts` — submit() 메서드의 상태 전환 로직 참고`
- ``server/src/submissions/submissions.repository.ts` — Submission/SubmissionWithPrompt 인터페이스, updateStatus() 메서드`
- ``.env` — GROQ_API_KEY 추가 대상`

## Expected Output

- ``migrations/004_create_evaluations.sql` — evaluations 테이블 생성 SQL`
- ``migrations/005_add_evaluated_status.sql` — submissions CHECK constraint 변경 SQL`
- ``server/src/llm/llm.module.ts` — LlmModule 정의 (ConfigModule import, LlmService export)`
- ``server/src/llm/llm.service.ts` — Groq SDK 래핑 서비스 (evaluate 메서드, JSON 파싱/검증, 재시도)`
- ``server/src/submissions/submissions.module.ts` — SubmissionsService + SubmissionsRepository export 추가`
- ``server/package.json` — groq-sdk 의존성 추가`
- ``.env` — GROQ_API_KEY + LLM_MODEL 환경변수 추가`

## Verification

cd server && npx tsc --noEmit && echo '타입 체크 통과' && grep -q 'groq-sdk' package.json && echo 'groq-sdk 설치 확인' && test -f ../migrations/004_create_evaluations.sql && test -f ../migrations/005_add_evaluated_status.sql && echo '마이그레이션 파일 존재 확인'
