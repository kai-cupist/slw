# S03 연구: AI 평가 및 이력

**슬라이스:** S03 — AI 평가 및 이력
**조사일:** 2026-03-31
**신뢰도:** HIGH

## 요약

S03은 이 앱의 핵심 가치 — submitted 답안에 대한 AI 평가(문법/논리/표현력/주제 적절성 4항목) + 결과 저장 + 이력 조회 — 를 구현한다. S02에서 완성된 SubmissionsModule(8개 API) 위에 LlmModule과 EvaluationsModule을 추가한다.

**소유 요구사항:** EVAL-01 ~ EVAL-05, HIST-01, HIST-02 (총 7개)

**가장 큰 위험 2가지:**
1. Groq의 Llama 3.3 70B는 `json_schema` structured outputs를 **지원하지 않는다**. JSON Object Mode(`{ type: "json_object" }`)만 사용 가능하여 스키마 보장이 없다. 응답 파싱 후 수동 검증이 반드시 필요하다.
2. 무료 티어 RPD 1,000 제한. 개발 중 과도한 호출로 일일 한도를 소진할 수 있다.

## 추천

**모델 선택:** `llama-3.3-70b-versatile`를 프로덕션/평가용으로 사용하고, `llama-3.1-8b-instant`(RPD 14,400)를 개발/테스트용으로 사용. 환경변수로 모델명을 설정하여 전환 가능하게 한다.

**JSON 응답 전략:** JSON Object Mode + 프롬프트 내 스키마 명시 + 응답 수동 검증. Llama 4 Scout(`json_schema` best-effort 지원)는 대안이지만 70B보다 한국어 평가 품질이 낮을 가능성이 있어 1차적으로는 Llama 3.3 70B를 선택.

**제출 → 평가 연동:** S02의 `submit()` 메서드에서 상태를 `submitted`로 변경한 후, 같은 요청 내에서 동기적으로 LLM 평가를 수행하고 결과를 저장한 뒤 `evaluated` 상태로 전환. v1에서는 동기 처리가 적절하다(응답 지연 2~5초 수준). 핵심: LLM API 호출은 DB 트랜잭션 밖에서 처리한다.

## 구현 지형

### 필요한 변경: DB

**마이그레이션 004_create_evaluations.sql:**
- evaluations 테이블 생성 (submission_id UNIQUE FK, grammar_score, logic_score, expression_score, relevance_score, total_score, feedback JSONB, raw_response JSONB, evaluated_at)
- ON DELETE CASCADE로 submissions 삭제 시 연관 평가도 제거

**마이그레이션 005_add_evaluated_status.sql:**
- submissions 테이블의 CHECK constraint 변경: `('draft', 'submitted')` → `('draft', 'submitted', 'evaluated')`
- PostgreSQL에서 CHECK constraint 변경은 DROP + ADD 필요:
  ```sql
  ALTER TABLE submissions DROP CONSTRAINT chk_status;
  ALTER TABLE submissions ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted', 'evaluated'));
  ```

### 필요한 변경: NestJS 모듈

**LlmModule (새로 생성):**
- `llm.module.ts` — ConfigModule import, LlmService 제공/export
- `llm.service.ts` — Groq SDK 인스턴스 관리, chat completion 호출, JSON 파싱, 재시도 로직
- groq-sdk 패키지 설치 필요: `npm install groq-sdk`
- 환경변수: `GROQ_API_KEY`, `LLM_MODEL` (기본값 llama-3.3-70b-versatile)

**EvaluationsModule (새로 생성):**
- `evaluations.module.ts` — LlmModule + SubmissionsModule import
- `evaluations.controller.ts` — GET /evaluations/:submissionId (평가 결과 조회), GET /evaluations/history (이력+점수 추이)
- `evaluations.service.ts` — 평가 요청 orchestration, 결과 검증, 저장
- `evaluations.repository.ts` — evaluations 테이블 Raw SQL

**SubmissionsModule 수정:**
- `submissions.service.ts`의 `submit()` 메서드에서 EvaluationsService를 호출하여 평가 트리거
- 순환 의존성 주의: SubmissionsModule → EvaluationsModule → LlmModule. EvaluationsModule이 SubmissionsModule을 import할 필요는 없으므로 (평가는 submissions.service에서 트리거) 순환 없음. 단, EvaluationsService를 SubmissionsModule에 주입하려면 EvaluationsModule이 export해야 하고 SubmissionsModule이 import해야 한다.
- **대안 (권장):** SubmissionsModule이 EvaluationsModule을 import하지 않고, 대신 EvaluationsModule이 SubmissionsModule을 import. EvaluationsController에서 `POST /evaluations` 또는 `POST /submissions/:id/evaluate` 엔드포인트를 제공하고, 제출 시 자동 평가 트리거는 EvaluationsService 안에서 처리.
- **가장 깔끔한 구조:** 제출 API(`PATCH /submissions/:id/submit`)의 응답에 평가 트리거를 넣지 말고, 별도의 `POST /submissions/:id/evaluate` 엔드포인트를 만든다. 프론트에서 제출 후 자동으로 평가 요청. 이렇게 하면 모듈 간 결합이 최소화된다.

### 기존 코드 패턴 (따라야 할 것)

| 패턴 | 위치 | 설명 |
|------|------|------|
| Controller → Service → Repository 3계층 | `submissions/` | 모든 feature 모듈이 이 패턴을 따른다 |
| paramIndex 카운터로 동적 WHERE | `submissions.repository.ts` | 필터 조합에 따른 안전한 파라미터 바인딩 |
| PaginationDto 상속 | `common/dto/pagination.dto.ts` | 각 feature의 조회 DTO가 extends |
| PaginatedResponse<T> | `common/interfaces/paginated.interface.ts` | 목록 API 응답 형식 통일 |
| UserIdGuard + @UserId() | `common/guards/`, `common/decorators/` | X-User-Id 헤더 기반 사용자 식별 |
| ResponseInterceptor + HttpExceptionFilter | `common/interceptors/`, `common/filters/` | `{ success: true, data }` / `{ success: false, error }` 통일 |
| @ApiTags, @ApiOperation, @ApiHeader | 모든 컨트롤러 | Swagger 문서화 |

### Groq SDK 사용법 (확인됨)

```typescript
import Groq from 'groq-sdk';

const client = new Groq({ apiKey: process.env.GROQ_API_KEY });

const completion = await client.chat.completions.create({
  model: 'llama-3.3-70b-versatile',
  messages: [
    { role: 'system', content: systemPrompt },
    { role: 'user', content: userMessage },
  ],
  response_format: { type: 'json_object' },
  temperature: 0.3,
});

const content = completion.choices[0].message.content;
const parsed = JSON.parse(content);
```

- **자동 재시도:** groq-sdk는 429, 5xx, 408, 409 에러에 대해 기본 2회 재시도 + 지수 백오프 내장
- **타임아웃:** 기본 60초. `timeout` 옵션으로 조정 가능
- **에러 타입:** `Groq.APIError` 서브클래스 — `RateLimitError`, `AuthenticationError` 등

### 평가 루브릭 설계

4개 항목 × 각 1~10점:
1. **문법 (grammar)** — 맞춤법, 띄어쓰기, 문장 부호, 문법적 정확성
2. **논리 (logic)** — 글의 구성, 논리적 흐름, 일관성
3. **표현력 (expression)** — 어휘 다양성, 문장력, 표현의 풍부함
4. **주제 적절성 (relevance)** — 주어진 주제에 대한 부합도

총점: 4개 항목의 평균 또는 합계 (1~40 또는 1~10 평균)

각 항목별 피드백 + 종합 코멘트 + 개선 제안을 JSON으로 반환하도록 프롬프트 설계.

### 예상 JSON 응답 스키마

```json
{
  "grammar": { "score": 8, "feedback": "...", "suggestions": ["...", "..."] },
  "logic": { "score": 7, "feedback": "...", "suggestions": ["..."] },
  "expression": { "score": 6, "feedback": "...", "suggestions": ["..."] },
  "relevance": { "score": 9, "feedback": "...", "suggestions": ["..."] },
  "overall_feedback": "...",
  "total_score": 7.5
}
```

### evaluations 테이블 스키마

```sql
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    grammar_score SMALLINT NOT NULL CHECK (grammar_score BETWEEN 1 AND 10),
    logic_score SMALLINT NOT NULL CHECK (logic_score BETWEEN 1 AND 10),
    expression_score SMALLINT NOT NULL CHECK (expression_score BETWEEN 1 AND 10),
    relevance_score SMALLINT NOT NULL CHECK (relevance_score BETWEEN 1 AND 10),
    total_score NUMERIC(3,1) NOT NULL CHECK (total_score BETWEEN 1.0 AND 10.0),
    feedback JSONB NOT NULL,
    raw_response JSONB NOT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
```

- `feedback`: 구조화된 항목별 피드백 JSON (파싱된 결과)
- `raw_response`: LLM API의 원본 JSON 응답 (디버깅/분석용)
- `total_score`: NUMERIC(3,1)로 소수점 한 자리 — 4개 항목 평균
- UNIQUE INDEX로 1:1 관계 보장

### API 엔드포인트 설계

| 메서드 | 경로 | 설명 | 요구사항 |
|--------|------|------|----------|
| POST | /submissions/:id/evaluate | 답안 평가 요청 (LLM 호출) | EVAL-01, EVAL-02, EVAL-03, EVAL-04, EVAL-05 |
| GET | /evaluations/:submissionId | 특정 답안의 평가 결과 조회 | HIST-01 |
| GET | /evaluations/history | 사용자의 평가 이력 목록 (페이지네이션) | HIST-01 |
| GET | /evaluations/scores/trend | 점수 추이 데이터 (날짜별) | HIST-02 |

### 작업 분할 가이드 (planner를 위한 제안)

**자연스러운 seam:**

1. **DB 마이그레이션** (독립) — evaluations 테이블 생성 + submissions CHECK 변경. 다른 코드 변경 없이 DB만 변경.
2. **LlmModule** (독립) — groq-sdk 설치 + LlmService 구현. EvaluationsModule과 독립적으로 테스트 가능 (수동 프롬프트 호출).
3. **EvaluationsModule 코어** (LlmModule 의존) — Repository + Service + Controller. 평가 요청(POST) + 결과 저장 + 단건 조회(GET).
4. **평가 이력 및 추이** (EvaluationsModule 의존) — 이력 목록 + 점수 추이 API. 기존 Repository에 SQL 추가.
5. **제출-평가 통합** (모든 것 의존) — submit 후 자동 평가 트리거 연결 (선택 사항, POST /evaluate를 프론트에서 호출하는 것으로 대체 가능).

**가장 먼저 증명해야 할 것:** LLM이 한국어 쓰기 답안에 대해 구조화된 JSON 평가를 안정적으로 반환하는지. LlmModule 완성 후 수동 테스트로 확인.

## 피트폴

### 피트폴 1: submissions CHECK constraint 변경

PostgreSQL에서는 기존 CHECK constraint를 직접 수정할 수 없다. DROP 후 ADD해야 한다. `ALTER TABLE submissions DROP CONSTRAINT chk_status` → `ALTER TABLE submissions ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted', 'evaluated'))`. 이 작업은 테이블 락이 걸리므로 데이터가 많으면 주의하지만, 토이 프로젝트이므로 문제없다.

### 피트폴 2: LLM 응답 JSON 파싱 실패

JSON Object Mode는 "usually" valid JSON을 반환하지만 보장하지 않는다. 특히 Llama 3.3 70B는 best-effort도 아닌 JSON Object Mode만 지원. 파싱 실패 시:
- `JSON.parse()` try-catch 필수
- 파싱 성공해도 필수 필드 존재 + 점수 범위(1~10) 검증 필요
- 검증 실패 시 재시도 (최대 1회) 후에도 실패하면 에러 반환

### 피트폴 3: 순환 의존성

SubmissionsService에서 직접 EvaluationsService를 호출하면 순환 의존 위험. 해결:
- **방법 A (권장):** 별도 엔드포인트 `POST /submissions/:id/evaluate`. SubmissionsModule은 EvaluationsModule을 모른다. EvaluationsModule이 SubmissionsModule(또는 DB 직접 접근)으로 submission 정보를 가져온다.
- **방법 B:** `forwardRef()` 사용. NestJS의 순환 의존성 해결 메커니즘이지만, 구조적으로 방법 A가 더 깔끔하다.

### 피트폴 4: GROQ_API_KEY 환경변수

`.env` 파일에 `GROQ_API_KEY`가 아직 없다. Docker Compose의 `env_file: .env`에서 자동 로드되므로 `.env`에 추가만 하면 된다. `secure_env_collect`로 수집.

### 피트폴 5: LLM API 응답 시간

Groq은 빠르지만 (2~5초) v1의 `POST /submissions/:id/evaluate`는 동기 처리이므로 클라이언트가 그 시간 동안 대기한다. 프론트에서 로딩 UI를 표시해야 한다. 타임아웃은 30초로 설정하되, 실패 시 적절한 에러 메시지 반환.

## 스킬 발견

| 기술 | 스킬 | 설치 수 | 설치 명령 | 비고 |
|------|------|---------|-----------|------|
| Groq API | `diskd-ai/groq-api@groq-api` | 87 | `npx skills add diskd-ai/groq-api@groq-api` | Groq API 패턴 가이드 — 유용할 수 있으나 설치 수가 적고, 이 프로젝트의 사용이 단순하여 선택적 |

## 출처

- [groq-sdk npm (v1.1.2)](https://www.npmjs.com/package/groq-sdk) — SDK 사용법, 재시도/타임아웃 설정
- [Groq Structured Outputs 공식 문서](https://console.groq.com/docs/structured-outputs) — strict/best-effort/JSON Object Mode 지원 모델 확인
- [Groq Rate Limits 공식 문서](https://console.groq.com/docs/rate-limits) — llama-3.3-70b RPD 1K, llama-3.1-8b RPD 14.4K 확인
- S02 코드 분석 — Repository 패턴, PaginationDto, UserIdGuard 등 기존 패턴 확인
