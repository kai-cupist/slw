# Phase 2: 쓰기 주제 및 답안 관리 - Research

**Researched:** 2026-03-30
**Domain:** NestJS REST API (CRUD, 페이지네이션, 동적 필터링) + PostgreSQL Raw SQL
**Confidence:** HIGH

## Summary

Phase 2는 Phase 1에서 확립한 인프라(DatabaseService, Envelope 패턴, ValidationPipe, 마이그레이션 체계) 위에 실질적인 비즈니스 로직을 구현하는 단계다. 쓰기 주제(prompts)와 답안(submissions) 두 도메인의 CRUD API를 Raw SQL로 직접 구현하며, NestJS의 Module-Controller-Service 패턴에 Repository 레이어를 추가하여 SQL 쿼리를 분리한다.

핵심 기술 과제는 (1) X-User-Id 헤더 기반 사용자 식별을 커스텀 데코레이터와 가드로 구현, (2) 동적 WHERE 절과 파라미터 바인딩으로 필터링/페이지네이션 쿼리 구성, (3) 상태 전환(draft -> submitted)과 soft delete의 비즈니스 규칙 적용, (4) 시드 데이터 SQL 마이그레이션이다.

**Primary recommendation:** Phase 1의 코드 패턴을 충실히 따르되, 각 모듈에 Repository 클래스를 추가하여 SQL 쿼리를 서비스 로직과 분리하고, X-User-Id 검증은 전역 Guard + 커스텀 데코레이터 조합으로 구현한다.

<user_constraints>

## User Constraints (from CONTEXT.md)

### Locked Decisions

- **D-01:** ID는 SERIAL (자동 증가 정수)을 사용한다
- **D-02:** `prompts` 테이블: id, title, description, category, difficulty, created_at, updated_at
- **D-03:** `submissions` 테이블: id, prompt_id (FK), user_id, content, status, created_at, updated_at, deleted_at
- **D-04:** prompts.difficulty는 VARCHAR + CHECK constraint ('beginner', 'intermediate', 'advanced')
- **D-05:** prompts.category는 VARCHAR로 저장 (일기, 편지, 감상문, 설명문, 논설문)
- **D-06:** submissions.status는 VARCHAR + CHECK constraint ('draft', 'submitted')
- **D-07:** draft -> submitted 전환은 한 방향만 허용
- **D-08:** Soft delete는 deleted_at TIMESTAMP 컬럼으로 구현
- **D-09:** offset/limit 기반 페이지네이션
- **D-10:** 기본 정렬은 created_at DESC, 기본 페이지 크기는 10
- **D-11:** 응답에 총 개수(total), 현재 페이지, 페이지당 항목 수 포함
- **D-12:** X-User-Id 요청 헤더로 사용자 식별 (UUID 문자열)
- **D-13:** X-User-Id가 없는 요청은 400 에러로 거부
- **D-14:** user_id 컬럼은 VARCHAR 타입
- **D-15:** 5개 카테고리 x 3단계 난이도 = 25-30개 시드 데이터
- **D-16:** 카테고리: 일기, 편지, 감상문, 설명문, 논설문
- **D-17:** 시드 데이터는 마이그레이션 SQL 파일로 관리
- **D-18:** 주제 API: GET /prompts, GET /prompts/:id (읽기 전용)
- **D-19:** 답안 API: POST /submissions, PATCH /submissions/:id, PATCH /submissions/:id/submit, DELETE /submissions/:id, GET /submissions, GET /submissions/:id
- **D-20:** 주제 목록은 카테고리와 난이도로 필터링 가능

### Claude's Discretion

- 정확한 SQL 인덱스 설계 (어떤 컬럼에 인덱스를 걸지)
- DTO 클래스의 구체적인 유효성 검증 규칙 (글자 수 제한 등)
- 필터링 쿼리의 동적 WHERE 절 구성 방식
- 에러 코드 문자열 (PROMPT_NOT_FOUND, SUBMISSION_NOT_FOUND 등)

### Deferred Ideas (OUT OF SCOPE)

None -- discussion stayed within phase scope

</user_constraints>

<phase_requirements>

## Phase Requirements

| ID        | Description                                                      | Research Support                                                        |
| --------- | ---------------------------------------------------------------- | ----------------------------------------------------------------------- |
| PROMPT-01 | 사용자가 쓰기 주제 목록을 조회할 수 있다                         | GET /prompts API + 동적 필터링 WHERE 절 + 페이지네이션 패턴             |
| PROMPT-02 | 사용자가 쓰기 주제의 상세 내용을 확인할 수 있다                  | GET /prompts/:id API + ParseIntPipe 파라미터 검증                       |
| PROMPT-03 | 주제에 난이도와 카테고리가 표시된다                              | prompts 테이블 스키마 + CHECK constraint + IsEnum 검증                  |
| PROMPT-04 | DB에 시드 데이터(20-30개 주제)가 포함된다                        | 마이그레이션 SQL 파일로 INSERT 구문 작성                                |
| SUB-01    | 사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다          | POST /submissions API + X-User-Id 가드/데코레이터 + 상태 기본값 'draft' |
| SUB-02    | 사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다               | PATCH /submissions/:id API + 소유권 검증 + status='draft' 조건          |
| SUB-03    | 사용자가 답안을 최종 제출할 수 있다 (draft -> submitted)         | PATCH /submissions/:id/submit API + 단방향 상태 전환 비즈니스 규칙      |
| SUB-04    | 사용자가 제출한 답안을 삭제할 수 있다 (soft delete)              | DELETE /submissions/:id API + deleted_at UPDATE + partial index         |
| SUB-05    | 사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션) | GET /submissions API + offset/limit + COUNT 쿼리 + user_id 필터링       |
| SUB-06    | 사용자가 특정 제출의 상세 내용을 확인할 수 있다                  | GET /submissions/:id API + JOIN prompts + 소유권 검증                   |

</phase_requirements>

## Standard Stack

이 Phase에서 사용하는 라이브러리는 Phase 1에서 이미 설치 완료되어 있다. 추가 설치는 불필요하다.

### Core (이미 설치됨)

| Library           | Version | Purpose                               | 비고                                                    |
| ----------------- | ------- | ------------------------------------- | ------------------------------------------------------- |
| @nestjs/common    | ^11.0.1 | 데코레이터, 파이프, 가드, 예외 클래스 | createParamDecorator, CanActivate, ParseIntPipe 등 활용 |
| @nestjs/swagger   | ^11.2.6 | API 문서화                            | @ApiHeader, @ApiQuery, @ApiProperty, @ApiTags           |
| pg                | ^8.20.0 | PostgreSQL Raw SQL 실행               | DatabaseService를 통해 간접 사용                        |
| class-validator   | ^0.14.4 | DTO 유효성 검증                       | @IsString, @IsOptional, @IsEnum, @IsInt, @Min, @Max 등  |
| class-transformer | ^0.5.1  | plain object -> class instance 변환   | @Type, @Transform 데코레이터                            |

### 추가 설치 필요 없음

Phase 2에서 필요한 모든 라이브러리는 Phase 1에서 이미 package.json에 포함되어 있다. NestJS CLI로 모듈/서비스/컨트롤러를 스캐폴딩하면 된다.

## Architecture Patterns

### 프로젝트 구조 (Phase 2 추가분)

```
server/src/
├── common/
│   ├── decorators/
│   │   └── user-id.decorator.ts     # @UserId() 커스텀 데코레이터
│   ├── guards/
│   │   └── user-id.guard.ts         # X-User-Id 헤더 검증 가드
│   ├── dto/
│   │   └── pagination.dto.ts        # 공통 페이지네이션 쿼리 DTO
│   ├── interfaces/
│   │   ├── api-response.interface.ts # (기존)
│   │   └── paginated.interface.ts   # 페이지네이션 응답 인터페이스
│   ├── filters/                     # (기존)
│   └── interceptors/                # (기존)
├── prompts/
│   ├── prompts.module.ts
│   ├── prompts.controller.ts
│   ├── prompts.service.ts
│   ├── prompts.repository.ts        # Raw SQL 쿼리 분리
│   └── dto/
│       └── get-prompts.dto.ts       # 필터링 쿼리 파라미터 DTO
├── submissions/
│   ├── submissions.module.ts
│   ├── submissions.controller.ts
│   ├── submissions.service.ts
│   ├── submissions.repository.ts    # Raw SQL 쿼리 분리
│   └── dto/
│       ├── create-submission.dto.ts
│       ├── update-submission.dto.ts
│       └── get-submissions.dto.ts
├── database/                        # (기존)
└── migration/                       # (기존)

migrations/
├── 000_create_schema_migrations.sql # (기존)
├── 001_create_prompts.sql           # prompts 테이블
├── 002_create_submissions.sql       # submissions 테이블
└── 003_seed_prompts.sql             # 시드 데이터 25-30개
```

### Pattern 1: Repository 패턴 (SQL 쿼리 격리)

**What:** SQL 쿼리를 Repository 클래스에 분리하여 서비스에서는 비즈니스 로직만 다룬다.
**When to use:** Raw SQL을 직접 작성하는 프로젝트에서 쿼리와 비즈니스 로직의 관심사를 분리할 때.

```typescript
// prompts.repository.ts
@Injectable()
export class PromptsRepository {
  constructor(private readonly db: DatabaseService) {}

  async findAll(
    filters: { category?: string; difficulty?: string },
    offset: number,
    limit: number,
  ) {
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      params.push(filters.difficulty);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

    const countQuery = `SELECT COUNT(*) as total FROM prompts ${whereClause}`;
    const dataQuery = `SELECT * FROM prompts ${whereClause} ORDER BY created_at DESC LIMIT $${paramIndex++} OFFSET $${paramIndex}`;

    const [countResult, rows] = await Promise.all([
      this.db.queryOne<{ total: string }>(countQuery, [...params]),
      this.db.query(dataQuery, [...params, limit, offset]),
    ]);

    return { rows, total: parseInt(countResult?.total ?? "0", 10) };
  }
}
```

### Pattern 2: X-User-Id 가드 + 커스텀 데코레이터

**What:** 전역 가드로 X-User-Id 헤더 존재를 검증하고, 커스텀 데코레이터로 값을 추출한다.
**When to use:** 인증 없이 헤더 기반 사용자 식별이 필요할 때.

```typescript
// common/guards/user-id.guard.ts
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const userId = request.headers['x-user-id'];

    if (!userId || typeof userId !== 'string' || userId.trim() === '') {
      throw new BadRequestException('X-User-Id 헤더가 필요합니다');
    }

    return true;
  }
}

// common/decorators/user-id.decorator.ts
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-user-id'] as string;
  },
);

// 사용 예시 - submissions.controller.ts
@Post()
async create(@UserId() userId: string, @Body() dto: CreateSubmissionDto) {
  return this.submissionsService.create(userId, dto);
}
```

### Pattern 3: 동적 WHERE 절 구성

**What:** 선택적 필터 조건을 안전하게 파라미터 바인딩과 함께 조합한다.
**When to use:** 쿼리 파라미터로 필터링 조건이 동적으로 변할 때.

```typescript
// 동적 WHERE 절 빌더 패턴
function buildWhereClause(
  filters: Record<string, unknown>,
  startIndex = 1,
): { clause: string; params: unknown[]; nextIndex: number } {
  const conditions: string[] = [];
  const params: unknown[] = [];
  let idx = startIndex;

  for (const [column, value] of Object.entries(filters)) {
    if (value !== undefined && value !== null) {
      conditions.push(`${column} = $${idx++}`);
      params.push(value);
    }
  }

  const clause =
    conditions.length > 0 ? `WHERE ${conditions.join(" AND ")}` : "";

  return { clause, params, nextIndex: idx };
}
```

주의: 컬럼명은 사용자 입력이 아닌 코드 내부에서만 결정되므로 SQL Injection 위험이 없다. PostgreSQL은 식별자(테이블명, 컬럼명)에 대한 파라미터 바인딩을 지원하지 않으므로, 컬럼명은 문자열로 직접 삽입하되 반드시 허용된 컬럼 목록(화이트리스트)과 대조해야 한다.

### Pattern 4: 페이지네이션 응답 형식

**What:** 페이지네이션된 목록 응답의 일관된 형식을 정의한다.
**When to use:** 목록 조회 API에서 총 개수, 페이지 정보를 함께 반환할 때.

```typescript
// common/interfaces/paginated.interface.ts
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// 서비스에서 사용
async findAll(page: number, limit: number): Promise<PaginatedResponse<Prompt>> {
  const offset = (page - 1) * limit;
  const { rows, total } = await this.repository.findAll({}, offset, limit);
  return {
    items: rows,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  };
}
```

### Pattern 5: 상태 전환 비즈니스 규칙

**What:** draft -> submitted 단방향 전환을 서비스 레이어에서 검증한다.
**When to use:** 상태 기계(state machine) 로직이 필요하지만 복잡도가 낮을 때.

```typescript
// submissions.service.ts
async submit(id: number, userId: string) {
  const submission = await this.repository.findOneByIdAndUser(id, userId);
  if (!submission) {
    throw new NotFoundException('답안을 찾을 수 없습니다');
  }
  if (submission.status !== 'draft') {
    throw new BadRequestException('이미 제출된 답안입니다');
  }
  return this.repository.updateStatus(id, 'submitted');
}
```

### Anti-Patterns to Avoid

- **SQL 문자열 직접 연결:** `WHERE category = '${category}'` -- 반드시 `$1` 파라미터 바인딩 사용
- **서비스에 SQL 직접 작성:** SQL은 Repository에 격리하고, 서비스는 비즈니스 로직에 집중
- **deleted_at 조건 누락:** soft delete 사용 시 모든 조회 쿼리에 `WHERE deleted_at IS NULL` 조건을 빠뜨리기 쉬움
- **소유권 검증 누락:** submissions API에서 user_id 필터링 없이 id만으로 조회/수정하면 다른 사용자의 데이터 접근 가능
- **COUNT와 SELECT WHERE 불일치:** 페이지네이션의 COUNT 쿼리와 데이터 쿼리의 WHERE 조건이 달라지는 실수

## Don't Hand-Roll

| Problem                 | Don't Build                                | Use Instead                                       | Why                                                      |
| ----------------------- | ------------------------------------------ | ------------------------------------------------- | -------------------------------------------------------- |
| 요청 유효성 검증        | 수동 if/else 검증                          | class-validator + ValidationPipe (전역 설정 완료) | 에러 메시지 포맷, 화이트리스트, 타입 변환이 이미 동작 중 |
| 쿼리 파라미터 타입 변환 | parseInt() 수동 호출                       | ParseIntPipe, DefaultValuePipe                    | 실패 시 400 에러 자동 반환, 기본값 처리 포함             |
| 에러 응답 포맷팅        | 커스텀 에러 응답 객체 조립                 | HttpExceptionFilter (전역 설정 완료)              | throw new NotFoundException() 만으로 통일된 포맷 반환    |
| 성공 응답 래핑          | 매 핸들러에서 { success: true, data } 반환 | ResponseInterceptor (전역 설정 완료)              | 컨트롤러에서 순수 데이터만 반환하면 자동 래핑            |
| API 문서화              | 별도 문서 파일                             | @nestjs/swagger 데코레이터                        | 코드와 문서가 동기화, Swagger UI에서 즉시 테스트         |

**Key insight:** Phase 1에서 전역 파이프, 인터셉터, 필터가 이미 설정되어 있으므로 Phase 2에서는 NestJS 예외(NotFoundException, BadRequestException)를 throw하고 DTO에 class-validator 데코레이터를 추가하는 것만으로 검증과 응답 포맷이 자동 처리된다.

## Common Pitfalls

### Pitfall 1: soft delete 조건 누락

**What goes wrong:** `WHERE deleted_at IS NULL` 조건을 빼먹으면 삭제된 답안이 목록에 나타난다.
**Why it happens:** 새 쿼리를 작성할 때마다 이 조건을 수동으로 추가해야 한다 (ORM의 자동 필터링이 없음).
**How to avoid:** Repository의 모든 SELECT 쿼리에 반드시 이 조건을 포함한다. 코드 리뷰 시 체크리스트로 확인.
**Warning signs:** 삭제한 답안이 목록 API에 다시 나타나면 즉시 의심.

### Pitfall 2: 페이지네이션 COUNT/SELECT WHERE 불일치

**What goes wrong:** COUNT 쿼리와 데이터 쿼리의 필터 조건이 달라 total과 실제 데이터가 불일치.
**Why it happens:** 동적 WHERE 절을 두 쿼리에 각각 별도로 구성할 때 하나만 수정.
**How to avoid:** 동일한 WHERE 절 문자열과 파라미터 배열을 COUNT와 SELECT 쿼리에서 공유한다.
**Warning signs:** total이 10인데 2페이지에 데이터가 없거나, total과 실제 항목 수가 안 맞음.

### Pitfall 3: 파라미터 인덱스 ($1, $2) 오류

**What goes wrong:** 동적 WHERE에 필터 파라미터를 추가하면서 LIMIT/OFFSET의 인덱스가 밀린다.
**Why it happens:** node-postgres는 순서형 파라미터($1, $2...)를 사용하므로, 동적 조건 수에 따라 인덱스가 변한다.
**How to avoid:** `paramIndex` 카운터 변수를 사용하여 자동으로 인덱스를 추적한다.
**Warning signs:** SQL 에러 또는 예상과 다른 필터 결과.

### Pitfall 4: X-User-Id 가드 적용 범위 설정

**What goes wrong:** 가드를 전역으로 등록하면 GET /prompts 같은 헤더가 불필요한 엔드포인트에도 적용된다.
**Why it happens:** prompts는 공개 데이터이므로 X-User-Id가 불필요하지만 전역 가드는 모든 요청에 적용.
**How to avoid:** 전역 가드가 아닌 submissions 관련 컨트롤러/라우트에만 `@UseGuards(UserIdGuard)`를 적용한다. 또는 특정 라우트를 제외하는 메커니즘(메타데이터 + 가드 내 조건)을 사용한다.
**Warning signs:** /prompts 호출 시 400 에러 발생.

### Pitfall 5: draft가 아닌 답안 수정 시도

**What goes wrong:** 이미 submitted 상태인 답안을 PATCH로 수정 허용.
**Why it happens:** 상태 검증 로직을 서비스에 넣지 않음.
**How to avoid:** PATCH /submissions/:id에서 현재 상태가 'draft'인지 확인 후 수정 허용.
**Warning signs:** 제출 완료된 답안의 content가 변경 가능.

### Pitfall 6: PostgreSQL COUNT 결과 타입

**What goes wrong:** `SELECT COUNT(*) as total`의 결과가 문자열(`'5'`)로 반환되어 타입 비교 실패.
**Why it happens:** node-postgres는 PostgreSQL bigint를 JavaScript string으로 반환한다.
**How to avoid:** `parseInt(result.total, 10)` 또는 `Number(result.total)` 로 명시적 변환.
**Warning signs:** total이 NaN이거나 문자열 비교 오류.

## Code Examples

### 마이그레이션 SQL: prompts 테이블 생성

```sql
-- migrations/001_create_prompts.sql
CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    CONSTRAINT chk_category CHECK (category IN ('일기', '편지', '감상문', '설명문', '논설문'))
);

-- 필터링 성능을 위한 인덱스
CREATE INDEX idx_prompts_category ON prompts (category);
CREATE INDEX idx_prompts_difficulty ON prompts (difficulty);
```

### 마이그레이션 SQL: submissions 테이블 생성

```sql
-- migrations/002_create_submissions.sql
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompts(id),
    user_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted'))
);

-- 사용자별 답안 조회용 인덱스 (soft delete 포함)
CREATE INDEX idx_submissions_user_id ON submissions (user_id) WHERE deleted_at IS NULL;

-- 주제별 답안 조회용 인덱스
CREATE INDEX idx_submissions_prompt_id ON submissions (prompt_id) WHERE deleted_at IS NULL;

-- 사용자별 + 주제별 draft 답안 조회 (이어쓰기용)
CREATE INDEX idx_submissions_user_prompt_draft ON submissions (user_id, prompt_id)
    WHERE status = 'draft' AND deleted_at IS NULL;
```

### DTO: 페이지네이션 쿼리

```typescript
// common/dto/pagination.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsInt, IsOptional, Max, Min } from "class-validator";

export class PaginationDto {
  @ApiPropertyOptional({ description: "페이지 번호", default: 1, minimum: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: "페이지당 항목 수",
    default: 10,
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 10;
}
```

### DTO: 주제 필터링

```typescript
// prompts/dto/get-prompts.dto.ts
import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsEnum, IsOptional } from "class-validator";

export enum Difficulty {
  BEGINNER = "beginner",
  INTERMEDIATE = "intermediate",
  ADVANCED = "advanced",
}

export enum Category {
  DIARY = "일기",
  LETTER = "편지",
  REVIEW = "감상문",
  EXPLANATION = "설명문",
  ARGUMENT = "논설문",
}

export class GetPromptsDto extends PaginationDto {
  @ApiPropertyOptional({ description: "카테고리 필터", enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ description: "난이도 필터", enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
```

### Swagger: X-User-Id 헤더 문서화

```typescript
// submissions.controller.ts
@ApiTags("submissions")
@ApiHeader({
  name: "X-User-Id",
  description: "사용자 식별 UUID",
  required: true,
  example: "550e8400-e29b-41d4-a716-446655440000",
})
@UseGuards(UserIdGuard)
@Controller("submissions")
export class SubmissionsController {
  // ...
}
```

## SQL Index 설계 (Claude's Discretion)

| 인덱스                            | 대상 컬럼                       | 유형                                                  | 이유                                      |
| --------------------------------- | ------------------------------- | ----------------------------------------------------- | ----------------------------------------- |
| idx_prompts_category              | prompts.category                | B-tree                                                | 카테고리 필터링 쿼리 지원                 |
| idx_prompts_difficulty            | prompts.difficulty              | B-tree                                                | 난이도 필터링 쿼리 지원                   |
| idx_submissions_user_id           | submissions.user_id             | Partial (WHERE deleted_at IS NULL)                    | 사용자별 답안 목록 조회 시 삭제된 행 제외 |
| idx_submissions_prompt_id         | submissions.prompt_id           | Partial (WHERE deleted_at IS NULL)                    | FK 조인 성능 + 삭제 행 제외               |
| idx_submissions_user_prompt_draft | submissions(user_id, prompt_id) | Partial (WHERE status='draft' AND deleted_at IS NULL) | 동일 주제 draft 답안 조회용               |

Partial index(부분 인덱스)를 사용하면 삭제된 행이 인덱스에서 제외되어 인덱스 크기가 작아지고 조회 성능이 향상된다. 이 프로젝트의 데이터 규모에서는 성능보다 SQL 학습 목적이 크지만, 올바른 패턴을 익히는 것이 중요하다.

## DTO 유효성 검증 규칙 (Claude's Discretion)

| DTO 필드                      | 규칙                                                    | 이유                                    |
| ----------------------------- | ------------------------------------------------------- | --------------------------------------- |
| CreateSubmissionDto.prompt_id | @IsInt(), @Min(1)                                       | FK 참조, 양의 정수                      |
| CreateSubmissionDto.content   | @IsString(), @MaxLength(5000)                           | 학습용 텍스트이므로 5,000자 제한이 적절 |
| UpdateSubmissionDto.content   | @IsString(), @IsOptional(), @MaxLength(5000)            | 부분 수정 허용                          |
| PaginationDto.page            | @IsInt(), @Min(1), @IsOptional(), default 1             | 0 이하 페이지 방지                      |
| PaginationDto.limit           | @IsInt(), @Min(1), @Max(100), @IsOptional(), default 10 | 과도한 조회 방지                        |

## 에러 코드 문자열 (Claude's Discretion)

| 상황                         | HTTP Status | 에러 코드            |
| ---------------------------- | ----------- | -------------------- |
| X-User-Id 헤더 누락          | 400         | MISSING_USER_ID      |
| 주제를 찾을 수 없음          | 404         | PROMPT_NOT_FOUND     |
| 답안을 찾을 수 없음          | 404         | SUBMISSION_NOT_FOUND |
| 이미 제출된 답안 수정 시도   | 400         | ALREADY_SUBMITTED    |
| 이미 제출된 답안 재제출 시도 | 400         | ALREADY_SUBMITTED    |
| 삭제된 답안 접근             | 404         | SUBMISSION_NOT_FOUND |
| 유효하지 않은 prompt_id      | 400         | INVALID_PROMPT_ID    |

참고: HttpExceptionFilter가 NestJS HttpException의 status를 기반으로 기본 코드를 생성하지만, 비즈니스 로직에서 더 구체적인 에러 코드가 필요하면 커스텀 예외 클래스나 에러 객체를 사용할 수 있다. 다만 Phase 1의 기존 패턴은 NestJS 기본 예외를 throw하는 방식이므로, 이를 유지하면서 message 문자열로 구분하는 것이 일관성 있다.

## State of the Art

| Old Approach                                 | Current Approach                          | When Changed | Impact                                                        |
| -------------------------------------------- | ----------------------------------------- | ------------ | ------------------------------------------------------------- |
| PartialType, PickType (class-validator 통합) | @nestjs/swagger에서 PartialType 직접 제공 | NestJS 10+   | DTO 부분 업데이트 시 @nestjs/swagger의 PartialType 사용 권장  |
| transform: true 없는 ValidationPipe          | transform: true 기본 권장                 | NestJS 10+   | 쿼리 파라미터 자동 타입 변환 활성화됨 (Phase 1에서 이미 설정) |
| DefaultValuePipe 체이닝                      | DTO class에 기본값 지정                   | 현재 권장    | class 속성에 `= 1` 등으로 기본값 설정이 더 깔끔               |

## Open Questions

1. **content 최소 글자 수**
   - What we know: 최대 5,000자는 적절하나 최소값은 결정되지 않음
   - What's unclear: 빈 문자열 임시저장을 허용할지
   - Recommendation: draft 상태에서는 빈 content 허용 (이어쓰기 시작점), submit 시에는 @MinLength(10) 등으로 최소 길이 검증

2. **동일 주제에 대한 중복 draft 허용 여부**
   - What we know: CONTEXT.md에 명시 없음
   - What's unclear: 한 사용자가 같은 주제에 여러 draft를 만들 수 있는지
   - Recommendation: 허용하되, 프론트엔드에서 기존 draft가 있으면 이어쓰기를 안내하는 것은 Phase 4(APP) 영역

3. **GET /prompts에 X-User-Id 필요 여부**
   - What we know: D-12에서 사용자 식별용이라고 하지만, prompts는 공개 데이터
   - What's unclear: 주제 조회에도 헤더가 필요한지
   - Recommendation: prompts 엔드포인트에는 가드를 적용하지 않음. 주제는 인증 없이 누구나 조회 가능

## Project Constraints (from CLAUDE.md)

- **ORM 사용 금지:** 모든 DB 접근은 Raw SQL로 작성 (DatabaseService.query/queryOne 사용)
- **수동 SQL 마이그레이션:** migrations/ 폴더에 순번 SQL 파일로 관리 (자동 마이그레이션 도구 금지)
- **편의 라이브러리 최소화:** Phase 2에서 추가 라이브러리 설치 불필요 (기존 스택으로 충분)
- **코드 주석, 커밋 메시지, 문서는 한국어로 작성**
- **변수명, 함수명 등 코드 식별자는 영어 사용**
- **NestJS 모듈/서비스/컨트롤러 패턴 준수**
- **SQL 파라미터 바인딩으로 SQL Injection 방지**
- **REST API는 일관된 응답 형식 사용** (Phase 1 Envelope 패턴)
- **에러 응답도 통일된 포맷으로 반환** (Phase 1 HttpExceptionFilter)

## Sources

### Primary (HIGH confidence)

- Phase 1 코드베이스 직접 확인 (database.service.ts, app.module.ts, main.ts 등)
- [node-postgres 공식 문서 - Parameterized queries](https://node-postgres.com/features/queries) - 파라미터 바인딩 패턴, 배열 처리
- [NestJS 공식 GitHub - Custom Decorators](https://github.com/nestjs/docs.nestjs.com/blob/master/content/custom-decorators.md) - createParamDecorator 패턴

### Secondary (MEDIUM confidence)

- [NestJS Swagger pagination DTO 예제](https://github.com/nestjs/swagger/blob/master/e2e/src/cats/dto/pagination-query.dto.ts) - @ApiProperty 패턴
- [API with NestJS #77 - Offset/keyset pagination with raw SQL](https://wanago.io/2022/10/03/api-nestjs-offset-keyset-pagination-sql/) - Raw SQL 페이지네이션 패턴
- [PostgreSQL Soft Delete Performance Guide](https://blog.thnkandgrow.com/stop-using-deleted_at-database-soft-delete-performance-guide/) - Partial index 전략
- [class-validator Cheatsheet 2025](https://dev.to/seenu-subhash/class-validator-cheatsheet-useful-decorators-and-nestjs-validation-patterns-2025-1c43) - DTO 데코레이터 패턴

### Tertiary (LOW confidence)

- 없음

## Metadata

**Confidence breakdown:**

- Standard stack: HIGH -- Phase 1에서 이미 설치/검증된 라이브러리만 사용
- Architecture: HIGH -- NestJS 공식 패턴(Module/Controller/Service) + Repository 분리는 표준적 접근
- Pitfalls: HIGH -- Raw SQL + soft delete + 동적 WHERE 패턴의 알려진 함정들, 직접 코드 분석으로 확인

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (안정적인 기술 스택, 빠른 변화 없음)
