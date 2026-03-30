# 아키텍처 연구

**도메인:** 언어 학습 앱 - 쓰기 평가 시스템
**조사일:** 2026-03-30
**신뢰도:** HIGH

## 시스템 전체 구조

```
┌─────────────────────────────────────────────────────────────────┐
│                     모바일 클라이언트 (Expo)                       │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────┐         │
│  │ 주제 선택 │  │ 답안 작성 │  │ 평가 결과 │  │ 이력 조회 │         │
│  └─────┬────┘  └─────┬────┘  └─────┬────┘  └─────┬────┘         │
│        └──────────────┴──────────────┴──────────────┘            │
│                          HTTP (REST API)                         │
├─────────────────────────────────────────────────────────────────┤
│                     백엔드 서버 (NestJS)                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ PromptsModule│  │SubmissionsModule│ │EvaluationsModule│       │
│  │  (주제 관리) │  │  (답안 관리)  │  │  (AI 평가)    │           │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘           │
│         │                 │                 │                    │
│  ┌──────┴─────────────────┴─────────────────┴───────┐           │
│  │              DatabaseModule (pg Pool)              │           │
│  └──────────────────────┬───────────────────────────┘           │
│                         │                                       │
│  ┌──────────────────────┴───────────────────────────┐           │
│  │             LlmModule (외부 API 클라이언트)         │           │
│  └──────────────────────────────────────────────────┘           │
├─────────────────────────────────────────────────────────────────┤
│                     인프라 (Docker Compose)                       │
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │  PostgreSQL 16   │  │  NestJS 컨테이너  │                     │
│  └──────────────────┘  └──────────────────┘                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │  Groq API (외부)   │
                    │  Llama 3.3 70B    │
                    └───────────────────┘
```

### 컴포넌트 역할

| 컴포넌트 | 책임 | 구현 방식 |
|-----------|------|-----------|
| **Expo 클라이언트** | UI 렌더링, 사용자 입력 수집, 임시저장 UX | React Native + fetch API |
| **PromptsModule** | 쓰기 주제 CRUD, 주제 목록/상세 조회 | Controller + Service + Raw SQL |
| **SubmissionsModule** | 답안 임시저장, 최종 제출, 이력 조회, 삭제 | Controller + Service + Raw SQL |
| **EvaluationsModule** | LLM API 호출, 평가 결과 파싱/저장, 재시도 | Service + LlmModule 의존 |
| **LlmModule** | Groq API 통신 추상화, 프롬프트 구성, JSON 파싱 | HttpModule 래핑, 재시도 로직 |
| **DatabaseModule** | pg Pool 관리, 쿼리 실행 추상화 | Global 동적 모듈, ConfigurableModuleBuilder |

## 권장 프로젝트 구조

```
project-root/
├── docker-compose.yml          # PostgreSQL + NestJS 컨테이너 정의
├── migrations/                 # 수동 SQL 마이그레이션 스크립트
│   ├── 001_create_prompts.sql
│   ├── 002_create_submissions.sql
│   └── 003_create_evaluations.sql
├── server/                     # NestJS 백엔드
│   └── src/
│       ├── main.ts
│       ├── app.module.ts
│       ├── database/           # DatabaseModule (Global)
│       │   ├── database.module.ts
│       │   ├── database.service.ts
│       │   └── database.constants.ts
│       ├── llm/                # LlmModule (외부 API 추상화)
│       │   ├── llm.module.ts
│       │   ├── llm.service.ts
│       │   ├── llm.constants.ts
│       │   └── dto/
│       │       └── evaluation-request.dto.ts
│       ├── prompts/            # PromptsModule (쓰기 주제)
│       │   ├── prompts.module.ts
│       │   ├── prompts.controller.ts
│       │   ├── prompts.service.ts
│       │   ├── prompts.repository.ts
│       │   └── dto/
│       │       ├── create-prompt.dto.ts
│       │       └── prompt-response.dto.ts
│       ├── submissions/        # SubmissionsModule (답안 관리)
│       │   ├── submissions.module.ts
│       │   ├── submissions.controller.ts
│       │   ├── submissions.service.ts
│       │   ├── submissions.repository.ts
│       │   └── dto/
│       │       ├── create-submission.dto.ts
│       │       ├── update-submission.dto.ts
│       │       └── submission-response.dto.ts
│       ├── evaluations/        # EvaluationsModule (AI 평가)
│       │   ├── evaluations.module.ts
│       │   ├── evaluations.controller.ts
│       │   ├── evaluations.service.ts
│       │   ├── evaluations.repository.ts
│       │   └── dto/
│       │       ├── evaluation-response.dto.ts
│       │       └── evaluation-criteria.dto.ts
│       └── common/             # 공통 유틸리티
│           ├── filters/
│           │   └── http-exception.filter.ts
│           ├── interceptors/
│           │   └── transform.interceptor.ts
│           ├── pipes/
│           │   └── validation.pipe.ts
│           └── interfaces/
│               └── api-response.interface.ts
└── mobile/                     # Expo 프론트엔드
    └── src/
        ├── api/                # API 클라이언트
        ├── screens/            # 화면 컴포넌트
        ├── components/         # 재사용 UI 컴포넌트
        └── hooks/              # 커스텀 훅
```

### 구조 결정 근거

- **`server/`와 `mobile/` 분리:** 모노레포 구조로 백엔드와 프론트엔드를 한 저장소에서 관리하되, 빌드/배포 단위는 독립적으로 유지한다.
- **기능 기반 모듈 구성:** NestJS의 표준 패턴을 따라 `prompts/`, `submissions/`, `evaluations/`로 도메인별 분리. 레이어 기반(controllers/, services/ 등)이 아닌 기능 기반 구조가 코드 탐색과 유지보수에 유리하다.
- **Repository 레이어 분리:** Service에 직접 SQL을 쓰지 않고 Repository를 별도로 두는 이유는 (1) SQL 쿼리를 한곳에 모아 관리 가능, (2) Service는 비즈니스 로직에만 집중, (3) 향후 테스트 시 Repository를 Mock하기 쉬움.
- **`llm/` 모듈 독립:** 외부 API 통신은 변경 가능성이 높으므로(Groq -> Gemini -> Ollama) 별도 모듈로 격리. 평가 로직은 `evaluations/`에, API 통신은 `llm/`에 분리하여 LLM 프로바이더 교체 시 `llm/`만 수정하면 된다.
- **`migrations/` 최상위 배치:** ORM 없이 수동 SQL 스크립트로 마이그레이션하므로, 프로젝트 루트에 번호 순서로 관리한다.

## 아키텍처 패턴

### 패턴 1: DatabaseModule - Global 동적 모듈

**무엇:** pg 라이브러리의 Pool을 NestJS DI 컨테이너에 등록하고, DatabaseService로 감싸서 전체 앱에서 사용하는 패턴.
**언제 사용:** Raw SQL + PostgreSQL 조합에서 커넥션 관리가 필요할 때.
**트레이드오프:** 단순하고 학습에 적합. ORM 없이도 안전한 쿼리 실행 가능. 다만 타입 안전성은 직접 보장해야 함.

**예시:**
```typescript
// database.module.ts
import { Global, Module } from '@nestjs/common';
import { Pool } from 'pg';
import { ConfigService } from '@nestjs/config';
import { DATABASE_POOL } from './database.constants';
import { DatabaseService } from './database.service';

@Global()
@Module({
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          user: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
        });
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// database.service.ts
@Injectable()
export class DatabaseService {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  async query<T>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await this.pool.query(text, params);
    return result.rows[0] ?? null;
  }
}
```

### 패턴 2: Repository 패턴 - SQL 쿼리 캡슐화

**무엇:** 각 도메인 엔티티별로 Repository 클래스를 두어 SQL 쿼리를 한곳에 모으는 패턴.
**언제 사용:** Raw SQL을 사용할 때 쿼리 관리를 체계화하고, Service 레이어를 깔끔하게 유지하고 싶을 때.
**트레이드오프:** 파일 수가 늘어나지만, SQL이 Service 로직과 섞이지 않아 가독성과 유지보수성이 향상된다. 학습 목적으로 SQL을 명시적으로 다루기에 적합하다.

**예시:**
```typescript
// submissions.repository.ts
@Injectable()
export class SubmissionsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findByPromptId(promptId: number): Promise<Submission[]> {
    return this.db.query<Submission>(
      `SELECT id, prompt_id, content, status, created_at, updated_at
       FROM submissions
       WHERE prompt_id = $1
       ORDER BY updated_at DESC`,
      [promptId],
    );
  }

  async saveDraft(promptId: number, content: string): Promise<Submission> {
    return this.db.queryOne<Submission>(
      `INSERT INTO submissions (prompt_id, content, status)
       VALUES ($1, $2, 'draft')
       ON CONFLICT (prompt_id, status)
         WHERE status = 'draft'
       DO UPDATE SET content = $2, updated_at = NOW()
       RETURNING *`,
      [promptId, content],
    );
  }

  async submit(id: number): Promise<Submission> {
    return this.db.queryOne<Submission>(
      `UPDATE submissions
       SET status = 'submitted', submitted_at = NOW(), updated_at = NOW()
       WHERE id = $1
       RETURNING *`,
      [id],
    );
  }
}
```

### 패턴 3: LLM 서비스 추상화 - 프로바이더 교체 대비

**무엇:** 외부 LLM API 호출을 별도 모듈로 격리하고, 인터페이스를 통해 프로바이더를 교체 가능하게 만드는 패턴.
**언제 사용:** 외부 AI API가 변경될 가능성이 높거나, 여러 프로바이더를 시험해봐야 할 때.
**트레이드오프:** 초기 추상화 비용이 있지만, Groq/Gemini/Ollama 전환 시 수정 범위를 최소화한다.

**예시:**
```typescript
// llm.service.ts
@Injectable()
export class LlmService {
  private readonly apiUrl: string;
  private readonly apiKey: string;
  private readonly model: string;

  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
  ) {
    this.apiUrl = this.configService.get('LLM_API_URL');
    this.apiKey = this.configService.get('LLM_API_KEY');
    this.model = this.configService.get('LLM_MODEL');
  }

  async evaluate(prompt: string, content: string): Promise<EvaluationResult> {
    const systemPrompt = this.buildSystemPrompt();
    const userMessage = this.buildUserMessage(prompt, content);

    const response = await this.callApi(systemPrompt, userMessage);
    return this.parseResponse(response);
  }

  private async callApi(system: string, user: string): Promise<string> {
    const { data } = await firstValueFrom(
      this.httpService.post(
        `${this.apiUrl}/chat/completions`,
        {
          model: this.model,
          messages: [
            { role: 'system', content: system },
            { role: 'user', content: user },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.3,
        },
        { headers: { Authorization: `Bearer ${this.apiKey}` } },
      ).pipe(
        retry({ count: 2, delay: 1000 }),
        catchError((error) => {
          throw new LlmApiException(error.message);
        }),
      ),
    );

    return data.choices[0].message.content;
  }

  private parseResponse(raw: string): EvaluationResult {
    const parsed = JSON.parse(raw);
    // 구조 검증 후 반환
    return parsed as EvaluationResult;
  }
}
```

### 패턴 4: 수동 SQL 마이그레이션 - 번호 순서 관리

**무엇:** ORM의 자동 마이그레이션 대신, 번호가 매겨진 SQL 파일을 순서대로 실행하는 패턴.
**언제 사용:** ORM 없이 DB 스키마를 관리할 때. 학습 목적으로 SQL DDL을 직접 작성하고 싶을 때.
**트레이드오프:** 수동 관리의 번거로움이 있지만, DDL/DML을 직접 다루면서 SQL 학습 효과가 극대화된다.

**예시:**
```sql
-- migrations/001_create_prompts.sql
CREATE TABLE IF NOT EXISTS prompts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL DEFAULT 'writing',
    difficulty VARCHAR(20) NOT NULL DEFAULT 'medium',
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- migrations/002_create_submissions.sql
CREATE TABLE IF NOT EXISTS submissions (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompts(id),
    content TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    submitted_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_submissions_prompt_id ON submissions(prompt_id);
CREATE INDEX idx_submissions_status ON submissions(status);

-- migrations/003_create_evaluations.sql
CREATE TABLE IF NOT EXISTS evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
    total_score INTEGER NOT NULL,
    grammar_score INTEGER,
    logic_score INTEGER,
    expression_score INTEGER,
    feedback TEXT NOT NULL,
    raw_response JSONB,
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX idx_evaluations_submission_id ON evaluations(submission_id);
```

마이그레이션 실행은 간단한 쉘 스크립트나 NestJS의 `onModuleInit`에서 처리할 수 있다:

```bash
#!/bin/bash
# scripts/migrate.sh
for f in migrations/*.sql; do
  echo "실행: $f"
  psql "$DATABASE_URL" -f "$f"
done
```

## 데이터 흐름

### 핵심 플로우: 답안 작성 -> AI 평가 -> 결과 확인

```
[사용자: 주제 목록 조회]
    │
    ▼
[GET /prompts] → PromptsController → PromptsService → PromptsRepository
    │                                                        │
    │                                              SELECT * FROM prompts
    │                                                        │
    ▼                                                        ▼
[사용자: 주제 선택, 답안 작성]                        ← JSON 응답 반환
    │
    ▼
[POST /submissions] (임시저장)
    │
    ▼
SubmissionsController → SubmissionsService → SubmissionsRepository
    │                                              │
    │                                    INSERT/UPDATE submissions
    │                                    (status = 'draft')
    ▼
[PUT /submissions/:id/submit] (최종 제출)
    │
    ▼
SubmissionsController → SubmissionsService
    │                        │
    │              1. status → 'submitted' 업데이트
    │              2. EvaluationsService.evaluate() 호출
    │                        │
    │                        ▼
    │              EvaluationsService → LlmService
    │                        │              │
    │                        │     Groq API POST /chat/completions
    │                        │     (시스템 프롬프트 + 사용자 답안)
    │                        │              │
    │                        │         JSON 응답 파싱
    │                        │              │
    │                        ▼              ▼
    │              EvaluationsRepository
    │              INSERT INTO evaluations
    │              (점수, 피드백, raw_response)
    │
    ▼
[사용자: 평가 결과 확인]
    │
    ▼
[GET /submissions/:id/evaluation]
    │
    ▼
EvaluationsController → EvaluationsService → EvaluationsRepository
                                                    │
                                          SELECT FROM evaluations
                                          WHERE submission_id = $1
                                                    │
                                                    ▼
                                              JSON 응답 반환
```

### 상태 전이: 답안(Submission)의 생명주기

```
  ┌────────┐    저장     ┌────────┐    제출     ┌───────────┐
  │  (없음) │ ────────→ │  draft  │ ────────→ │ submitted  │
  └────────┘            └────────┘            └─────┬─────┘
                           ▲  │                     │
                     수정  │  │ 삭제            AI 평가 완료
                           │  ▼                     │
                        (내용 갱신)            ┌─────▼─────┐
                                              │ evaluated  │
                                              └───────────┘
```

### 주요 데이터 흐름 정리

1. **주제 조회 플로우:** 클라이언트 -> API -> DB 단순 조회. 캐싱 불필요 (데이터 양 적음).
2. **임시저장 플로우:** 클라이언트가 주기적으로 PUT 요청. Upsert 패턴으로 draft 상태 답안을 갱신.
3. **제출 + 평가 플로우:** 가장 복잡한 핵심 플로우. 답안 상태 변경 -> LLM API 호출(외부) -> 결과 파싱/저장까지 한 트랜잭션에서 처리하되, LLM API 호출은 트랜잭션 밖에서 처리해야 함 (외부 API는 롤백 불가).
4. **이력 조회 플로우:** 답안 + 평가 결과를 JOIN하여 반환. 점수 추이는 날짜별 집계 쿼리로 처리.

## 데이터베이스 스키마 설계

### ERD 개요

```
prompts (1) ────── (N) submissions (1) ────── (1) evaluations
  │                        │                        │
  ├─ id (PK)               ├─ id (PK)               ├─ id (PK)
  ├─ title                 ├─ prompt_id (FK)         ├─ submission_id (FK, UNIQUE)
  ├─ description           ├─ content               ├─ total_score
  ├─ category              ├─ status                 ├─ grammar_score
  ├─ difficulty            ├─ submitted_at           ├─ logic_score
  ├─ is_active             ├─ created_at             ├─ expression_score
  ├─ created_at            └─ updated_at             ├─ feedback
  └─ updated_at                                      ├─ raw_response (JSONB)
                                                     └─ evaluated_at
```

### 설계 결정 근거

- **submissions.status:** `draft` / `submitted` / `evaluated` 3가지 상태. ENUM 대신 VARCHAR로 관리하여 마이그레이션 없이 상태 추가 가능.
- **evaluations.raw_response:** LLM API의 원본 JSON 응답을 JSONB로 저장. 디버깅과 프롬프트 개선 분석에 활용.
- **evaluations.submission_id UNIQUE:** 1:1 관계 보장. 한 답안에 대해 하나의 평가만 존재.
- **인증 없음(v1):** user_id 컬럼 없음. v2에서 인증 추가 시 `ALTER TABLE ADD COLUMN user_id` 마이그레이션 필요.
- **ON DELETE CASCADE:** 답안 삭제 시 연관 평가도 함께 삭제. v1에서는 사용자가 하나이므로 단순 전략 채택.

## 확장성 고려사항

| 규모 | 아키텍처 조정 |
|------|--------------|
| 0-100명 (토이 프로젝트) | 현재 구조로 충분. 단일 pg Pool, 동기 평가 처리. |
| 100-1,000명 | LLM API 호출을 비동기 큐(Bull/Redis)로 전환 검토. 평가 결과 폴링 또는 웹소켓 알림. |
| 1,000명+ | 평가 워커 분리, DB 읽기 레플리카, API 응답 캐싱 고려. |

### 확장 우선순위

1. **첫 번째 병목: LLM API 응답 시간.** Groq은 빠르지만(수 초), 동시 요청이 많아지면 API rate limit에 걸린다. 큐 기반 비동기 처리가 첫 번째 확장 포인트.
2. **두 번째 병목: DB 커넥션 풀.** pg Pool의 max 설정 조정 필요. 초기에는 기본값(10)으로 충분.

## 안티패턴

### 안티패턴 1: Service에 SQL 직접 작성

**잘못된 방식:** Service 클래스 안에 SQL 쿼리와 비즈니스 로직을 함께 섞어 놓는다.
**왜 나쁜가:** SQL이 비즈니스 로직과 뒤섞여 가독성이 떨어지고, 동일 쿼리를 여러 Service에서 중복 작성하게 된다. 테스트 시 DB 의존성을 분리하기 어렵다.
**대신:** Repository 클래스를 별도로 만들어 SQL 쿼리를 캡슐화한다. Service는 Repository를 주입받아 사용한다.

### 안티패턴 2: LLM API 호출을 DB 트랜잭션 안에 넣기

**잘못된 방식:** `BEGIN` -> 답안 상태 변경 -> LLM API 호출 -> 평가 저장 -> `COMMIT`
**왜 나쁜가:** LLM API가 5~30초 걸릴 수 있어 DB 커넥션을 오래 점유한다. API 실패 시 전체 롤백되어 답안 상태도 되돌아간다.
**대신:** (1) 답안 상태를 `submitted`로 변경하고 커밋, (2) LLM API 호출, (3) 평가 결과를 별도 INSERT. API 실패 시 답안은 `submitted` 상태로 남고, 재평가를 시도할 수 있다.

### 안티패턴 3: 문자열 연결로 SQL 구성

**잘못된 방식:** `` `SELECT * FROM submissions WHERE id = ${id}` ``
**왜 나쁜가:** SQL Injection 공격에 취약하다.
**대신:** 반드시 파라미터 바인딩 사용: `this.db.query('SELECT * FROM submissions WHERE id = $1', [id])`

### 안티패턴 4: LLM 응답을 검증 없이 신뢰

**잘못된 방식:** LLM이 반환한 JSON을 파싱하여 바로 DB에 저장한다.
**왜 나쁜가:** LLM은 JSON 스키마를 100% 보장하지 않는다 (Groq의 Llama 3.3은 best-effort JSON mode). 예상치 못한 필드나 타입 불일치로 DB 에러가 발생할 수 있다.
**대신:** 응답 파싱 후 반드시 스키마 검증을 수행한다. class-validator 또는 수동 검증으로 점수 범위, 필수 필드 존재 여부를 확인한 뒤 저장한다.

## 통합 지점

### 외부 서비스

| 서비스 | 통합 패턴 | 주의사항 |
|--------|-----------|----------|
| **Groq API** | REST (OpenAI 호환 형식), `response_format: { type: "json_object" }` 로 JSON 응답 강제 | Llama 3.3 70B는 best-effort JSON mode만 지원 (strict 불가). 일일 1,000 요청 제한. rate limit 429 에러 시 지수 백오프 재시도 필요. |
| **대체: Gemini API** | REST, 유사한 Chat Completions 형식 | 일일 250 요청. 한국어 품질 양호. Groq rate limit 도달 시 폴백 가능. |

### 내부 모듈 간 경계

| 경계 | 통신 방식 | 비고 |
|------|-----------|------|
| SubmissionsModule -> EvaluationsModule | Service 직접 호출 (DI) | 제출 시 평가를 트리거. EvaluationsService를 SubmissionsModule에서 import. |
| EvaluationsModule -> LlmModule | Service 직접 호출 (DI) | 평가 로직과 API 통신 분리. LlmModule exports LlmService. |
| 모든 Module -> DatabaseModule | Global 모듈 (DI) | DatabaseService를 어디서든 주입 가능. |

## 빌드 순서 (로드맵 시사점)

의존성을 고려한 권장 구현 순서:

```
Phase 1: 기반 인프라
  ├── Docker Compose (PostgreSQL + NestJS)
  ├── DatabaseModule (pg Pool 설정)
  ├── 마이그레이션 스크립트 (테이블 생성)
  └── 공통 모듈 (에러 필터, 응답 포맷)

Phase 2: 주제 관리 (가장 단순한 CRUD)
  ├── PromptsModule (Controller + Service + Repository)
  ├── 시드 데이터 (초기 주제 삽입)
  └── REST API 테스트

Phase 3: 답안 관리 (상태 머신 + 임시저장)
  ├── SubmissionsModule (CRUD + 상태 전이)
  ├── 임시저장 / 제출 API
  └── 이력 조회 API

Phase 4: AI 평가 연동 (핵심 가치)
  ├── LlmModule (Groq API 통신)
  ├── EvaluationsModule (평가 요청 + 결과 저장)
  ├── 프롬프트 엔지니어링 (평가 기준, JSON 스키마)
  └── 에러 처리 + 재시도

Phase 5: 모바일 클라이언트
  ├── Expo 프로젝트 설정
  ├── API 클라이언트
  ├── 화면 구현 (주제 목록, 작성, 결과)
  └── 임시저장 UX
```

**순서 결정 근거:**
- Phase 1이 모든 것의 기반이므로 반드시 먼저.
- Phase 2(주제)가 Phase 3(답안)보다 먼저인 이유: 답안은 주제를 FK로 참조하므로, 주제가 있어야 답안을 테스트할 수 있다.
- Phase 3(답안)이 Phase 4(평가)보다 먼저인 이유: 평가는 제출된 답안에 대해 수행되므로, 답안 제출 플로우가 먼저 완성되어야 한다.
- Phase 5(모바일)는 백엔드 API가 완성된 후 시작. 백엔드 학습이 주 목적이므로 프론트엔드는 마지막.

## 출처

- [NestJS에서 Raw SQL + PostgreSQL 사용 패턴](https://wanago.io/2022/08/29/api-nestjs-postgresql-raw-sql-queries/) - HIGH 신뢰도
- [NestJS 모듈 구조 공식 문서](https://docs.nestjs.com/modules) - HIGH 신뢰도
- [NestJS HttpModule 공식 문서](https://docs.nestjs.com/techniques/http-module) - HIGH 신뢰도
- [Groq Structured Outputs 문서](https://console.groq.com/docs/structured-outputs) - HIGH 신뢰도
- [Groq Llama 3.3 70B 모델 문서](https://console.groq.com/docs/model/llama-3.3-70b-versatile) - HIGH 신뢰도
- [NestJS 확장 가능한 아키텍처 가이드](https://www.mindbowser.com/scalable-architecture-nestjs/) - MEDIUM 신뢰도
- [NestJS 재시도 + 지수 백오프 패턴](https://jean-marc.io/blog/stop-breaking-your-apis-how-to-implement-proper-retry-and-exponential-backoff-in-nestjs) - MEDIUM 신뢰도
- [LLM-as-a-Judge 평가 가이드](https://www.evidentlyai.com/llm-guide/llm-as-a-judge) - MEDIUM 신뢰도

---
*아키텍처 연구 대상: 언어 학습 앱 (쓰기 평가)*
*조사일: 2026-03-30*
