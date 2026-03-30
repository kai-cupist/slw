# Phase 2 스터디: 쓰기 주제 및 답안 관리

> 프론트엔드 개발자의 백엔드 학습 노트

## 1. 전체 구조 변화

```
Phase 1에서 추가된 것:             Phase 2에서 추가된 것:
┌──────────────┐                  ┌──────────────────┐
│ AppModule    │                  │ AppModule        │
│  Database    │                  │  Database        │
│  Migration   │                  │  Migration       │
│  AppCtrl     │                  │  Prompts     ← NEW
└──────────────┘                  │  Submissions ← NEW
                                  │  AppCtrl         │
                                  └──────────────────┘
```

### 디렉토리 구조 (Phase 2 추가분)

```
server/src/
├── common/
│   ├── guards/
│   │   └── user-id.guard.ts          ← NEW: X-User-Id 헤더 검증
│   ├── decorators/
│   │   └── user-id.decorator.ts      ← NEW: 헤더 값 추출
│   ├── dto/
│   │   └── pagination.dto.ts         ← NEW: 공통 페이지네이션
│   └── interfaces/
│       ├── api-response.interface.ts
│       └── paginated.interface.ts    ← NEW: 목록 응답 타입
│
├── prompts/                          ← NEW 모듈 전체
│   ├── prompts.module.ts
│   ├── prompts.controller.ts
│   ├── prompts.service.ts
│   ├── prompts.repository.ts
│   └── dto/
│       └── get-prompts.dto.ts
│
└── submissions/                      ← NEW 모듈 전체
    ├── submissions.module.ts
    ├── submissions.controller.ts
    ├── submissions.service.ts
    ├── submissions.repository.ts
    └── dto/
        ├── create-submission.dto.ts
        ├── update-submission.dto.ts
        └── get-submissions.dto.ts

migrations/
├── 000_create_schema_migrations.sql
├── 001_create_prompts.sql            ← NEW
├── 002_create_submissions.sql        ← NEW
└── 003_seed_prompts.sql              ← NEW
```

## 2. Controller → Service → Repository 레이어 패턴

Phase 1에서 "분리하겠다"고 정했던 패턴을 실제로 처음 적용한 페이즈다.

```
요청 흐름:

  HTTP 요청
      │
      ▼
  ┌────────────────┐
  │  Controller    │  ← 라우팅 + 입력 파싱 (DTO 변환)
  │  "배달원"       │     비즈니스 판단을 하지 않음
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐
  │  Service       │  ← 비즈니스 로직 (상태 전환 규칙, 소유권 검증)
  │  "매니저"       │     SQL을 모름. Repository에 요청만 함
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐
  │  Repository    │  ← SQL 실행 (INSERT, SELECT, UPDATE)
  │  "DB 전문가"    │     비즈니스 판단을 하지 않음
  └───────┬────────┘
          │
          ▼
  ┌────────────────┐
  │  DatabaseService│  ← pg Pool 래퍼 (query, queryOne, withTransaction)
  │  "@Global()"    │     Phase 1에서 만든 것
  └────────────────┘
```

### 각 레이어의 실제 역할 비교

```
예시: "답안 수정" 요청

Controller:
  - URL에서 id 추출 (@Param('id', ParseIntPipe))
  - Body에서 content 추출 (@Body() dto)
  - 헤더에서 userId 추출 (@UserId())
  - service.update(id, userId, dto) 호출

Service:
  - DB에서 답안 조회 → 없으면 NotFoundException
  - status가 draft인지 확인 → 아니면 BadRequestException
  - "이 답안을 수정해도 되는가?" 판단
  - repository.updateContent(id, content) 호출

Repository:
  - UPDATE submissions SET content = $1 WHERE id = $2 실행
  - 결과 반환
  - 비즈니스 규칙(draft인지 확인 등)을 모름
```

**프론트엔드 비유:**

```
Controller  = 라우팅 페이지 (pages/edit/[id].tsx)
              → URL 파라미터 파싱, 컴포넌트에 전달

Service     = Custom Hook (useSubmission)
              → 비즈니스 로직, 상태 관리, 에러 처리

Repository  = API 클라이언트 (api/submissions.ts)
              → fetch() 호출만 담당, 비즈니스 판단 안 함
```

### 왜 이렇게 나누는가?

```
나쁜 예 (Controller에 다 때려넣기):

@Patch(':id')
async update(@Param('id') id, @Body() dto, @Headers('x-user-id') userId) {
  // SQL도 여기서
  const submission = await this.db.queryOne('SELECT ...', [id, userId]);
  // 비즈니스 로직도 여기서
  if (!submission) throw new NotFoundException();
  if (submission.status !== 'draft') throw new BadRequestException();
  // 또 SQL
  return this.db.queryOne('UPDATE ...', [dto.content, id]);
}
// → 테스트 불가능, 재사용 불가능, 뚱뚱한 컨트롤러
```

```
좋은 예 (레이어 분리):

Controller:  @Patch(':id') → service.update(id, userId, dto)
Service:     findOne → 검증 → repository.updateContent()
Repository:  UPDATE submissions SET ... → 결과 반환

// → 각 레이어를 독립적으로 테스트 가능
// → Repository를 다른 Service에서도 재사용 가능
// → SQL을 바꿔도 Service/Controller에 영향 없음
```

## 3. Raw SQL 실전: 동적 WHERE 절

### 문제 상황

사용자가 "편지 카테고리의 초급 주제만 보고 싶다"고 하면?

```
GET /prompts?category=편지&difficulty=beginner
GET /prompts?category=편지                     ← difficulty 없음
GET /prompts                                   ← 필터 없음
```

세 가지 경우를 하나의 쿼리로 처리해야 한다.

### paramIndex 카운터 방식

```typescript
// prompts.repository.ts의 findAll 메서드

const conditions: string[] = [];
const params: unknown[] = [];
let paramIndex = 1; // ← 카운터 시작

if (filters.category) {
  conditions.push(`category = $${paramIndex++}`); // category = $1
  params.push(filters.category); // params = ['편지']
}
if (filters.difficulty) {
  conditions.push(`difficulty = $${paramIndex++}`); // difficulty = $2
  params.push(filters.difficulty); // params = ['편지', 'beginner']
}

// LIMIT과 OFFSET도 같은 카운터 사용
const dataQuery = `
  SELECT * FROM prompts ${whereClause}
  ORDER BY created_at DESC
  LIMIT $${paramIndex++} OFFSET $${paramIndex}     // LIMIT $3 OFFSET $4
`;
```

### 실제 생성되는 SQL 예시

```
요청: GET /prompts?category=편지&difficulty=beginner&page=2&limit=5

조립 과정:
  paramIndex=1 → category = $1     → params: ['편지']
  paramIndex=2 → difficulty = $2   → params: ['편지', 'beginner']
  paramIndex=3 → LIMIT $3         → params: ['편지', 'beginner', 5]
  paramIndex=4 → OFFSET $4        → params: ['편지', 'beginner', 5, 5]

최종 SQL:
  SELECT * FROM prompts
  WHERE category = $1 AND difficulty = $2
  ORDER BY created_at DESC
  LIMIT $3 OFFSET $4

  params: ['편지', 'beginner', 5, 5]
```

```
요청: GET /prompts (필터 없음)

조립 과정:
  category 없음 → 건너뜀
  difficulty 없음 → 건너뜀
  paramIndex=1 → LIMIT $1     → params: [10]
  paramIndex=2 → OFFSET $2    → params: [10, 0]

최종 SQL:
  SELECT * FROM prompts
  ORDER BY created_at DESC
  LIMIT $1 OFFSET $2

  params: [10, 0]
```

### 핵심 포인트: paramIndex가 왜 필요한가

```
문자열 결합 방식 (위험!):
  `WHERE category = '${category}'`        ← SQL Injection 가능

고정 파라미터 방식 (비효율):
  `WHERE ($1::text IS NULL OR category = $1)
   AND   ($2::text IS NULL OR difficulty = $2)`
  → 필터 없어도 항상 조건이 포함됨 → 쿼리 최적화 불리

paramIndex 카운터 방식 (안전 + 효율):
  → 필터가 있을 때만 조건 추가
  → $1, $2 번호가 동적으로 증가
  → params 배열과 항상 1:1 매칭
  → SQL Injection 불가능
```

## 4. Soft Delete 패턴

### Hard Delete vs Soft Delete

```
Hard Delete (물리적 삭제):
  DELETE FROM submissions WHERE id = 1
  → 행이 DB에서 완전히 사라짐
  → 복구 불가능

Soft Delete (논리적 삭제):
  UPDATE submissions SET deleted_at = NOW() WHERE id = 1
  → 행은 DB에 남아있지만, deleted_at에 삭제 시각이 기록됨
  → 조회 시 WHERE deleted_at IS NULL 조건으로 "안 보이게" 처리
  → 필요하면 deleted_at을 NULL로 돌려서 복구 가능
```

### 실제 구현

```sql
-- submissions 테이블에 deleted_at 컬럼 추가
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    ...
    deleted_at TIMESTAMP,      -- NULL = 활성, NOT NULL = 삭제됨
    ...
);
```

```typescript
// Repository: 삭제 메서드
async softDelete(id: number): Promise<void> {
  await this.db.query(
    'UPDATE submissions SET deleted_at = NOW() WHERE id = $1',
    [id],
  );
  // DELETE가 아니라 UPDATE! deleted_at 컬럼만 채운다.
}

// Repository: 조회 메서드 (모든 SELECT에 조건 추가)
async findOneByIdAndUser(id: number, userId: string) {
  return this.db.queryOne(
    `SELECT * FROM submissions
     WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
    //                                ^^^^^^^^^^^^^^^^^^
    //                                삭제된 것은 안 보임
    [id, userId],
  );
}
```

### Partial Index (부분 인덱스)

```sql
-- 일반 인덱스: 모든 행을 인덱스에 포함
CREATE INDEX idx_user_id ON submissions (user_id);

-- 부분 인덱스: 조건에 맞는 행만 인덱스에 포함
CREATE INDEX idx_user_id ON submissions (user_id)
    WHERE deleted_at IS NULL;
    ^^^^^^^^^^^^^^^^^^^^^^
    삭제된 행은 인덱스에서 제외 → 인덱스 크기 축소 → 조회 성능 향상
```

```
왜 부분 인덱스가 좋은가:

  전체 행: 10,000개
  삭제된 행: 3,000개
  활성 행: 7,000개

  일반 인덱스: 10,000개 항목 → 삭제된 것도 뒤짐
  부분 인덱스:  7,000개 항목 → 필요한 것만 인덱스

  어차피 SELECT에서 deleted_at IS NULL 조건을 항상 붙이니까
  부분 인덱스와 완벽히 매칭 → PostgreSQL이 자동으로 이 인덱스 사용
```

## 5. CHECK Constraint (제약 조건)

### 왜 DB 레벨에서 제한하는가?

```
코드 레벨 검증만 하면:
  API → ValidationPipe가 'beginner'만 통과시킴 ✓
  하지만 누군가 DB에 직접 접근하면? → 잘못된 값 삽입 가능 ✗

DB 레벨 제약 추가하면:
  API → ValidationPipe가 검증 ✓
  DB 직접 접근해도 → CHECK constraint가 거부 ✓
  어디서 데이터를 넣든 무결성 보장!
```

```sql
-- difficulty는 이 3가지 값만 허용
CONSTRAINT chk_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced'))

-- status는 이 2가지 값만 허용
CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted'))

-- category는 이 5가지 값만 허용
CONSTRAINT chk_category CHECK (category IN ('일기', '편지', '감상문', '설명문', '논설문'))
```

```
위반 시:
  INSERT INTO submissions (status) VALUES ('invalid');
  → ERROR: new row violates check constraint "chk_status"
  → DB가 자체적으로 거부!
```

**프론트엔드 비유:**

```
CHECK constraint = TypeScript의 union type

  type Status = 'draft' | 'submitted';  ← 컴파일 시점에 잘못된 값 차단
  CONSTRAINT chk_status CHECK (...)      ← DB 레벨에서 잘못된 값 차단
```

### enum type 대신 VARCHAR + CHECK를 선택한 이유

```sql
-- PostgreSQL ENUM 방식
CREATE TYPE submission_status AS ENUM ('draft', 'submitted');
-- 값 추가하려면: ALTER TYPE submission_status ADD VALUE 'reviewed';
-- 값 제거: 불가능! 타입 재생성 필요 (복잡한 마이그레이션)

-- VARCHAR + CHECK 방식 (우리가 선택한 것)
CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted'))
-- 값 추가하려면: ALTER TABLE submissions DROP CONSTRAINT chk_status;
--               ALTER TABLE submissions ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted', 'reviewed'));
-- 단순하고 예측 가능
```

## 6. 외래키 (Foreign Key)

### submissions → prompts 관계

```sql
CREATE TABLE submissions (
    ...
    prompt_id INTEGER NOT NULL REFERENCES prompts(id),
    ...
);
```

```
REFERENCES의 의미:

  prompts 테이블:                    submissions 테이블:
  ┌────┬────────────┐               ┌────┬───────────┐
  │ id │ title      │               │ id │ prompt_id │
  ├────┼────────────┤               ├────┼───────────┤
  │ 1  │ "오늘 일기"│◄──────────────│ 1  │ 1         │  ← OK (prompts에 id=1 있음)
  │ 2  │ "편지 쓰기"│◄──────────────│ 2  │ 2         │  ← OK (prompts에 id=2 있음)
  └────┴────────────┘               │ 3  │ 999       │  ← ERROR! (prompts에 id=999 없음)
                                    └────┴───────────┘

  DB가 "존재하지 않는 주제에 대한 답안"을 원천 차단!
```

### 코드에서의 이중 검증

```typescript
// submissions.service.ts의 create 메서드
async create(userId: string, dto: CreateSubmissionDto) {
  // 1단계: 코드에서 주제 존재 여부 확인 (더 나은 에러 메시지)
  try {
    await this.promptsService.findOne(dto.prompt_id);
  } catch {
    throw new BadRequestException('유효하지 않은 주제입니다');
  }

  // 2단계: DB에서 FK constraint가 최종 보장
  return this.submissionsRepository.create(userId, dto.prompt_id, ...);
}
```

```
왜 이중 검증인가:
  - 코드 검증: 사용자에게 친절한 에러 메시지 ("유효하지 않은 주제입니다")
  - DB 검증: 코드 버그가 있어도 데이터 무결성 최종 보장 (safety net)
```

## 7. Guard와 Custom Decorator

### NestJS Guard란?

요청이 컨트롤러에 도달하기 전에 "이 요청을 허용할 것인가?"를 판단하는 관문.

```
요청 → ValidationPipe → Guard → Controller → Service → Repository
                         ^^^^
                         여기서 차단 가능!
```

**프론트엔드 비유:**

```
Guard     = 라우트 가드 (React Router의 loader/beforeEnter)
              "인증 안 된 사용자면 로그인 페이지로!"

Middleware = Express middleware (NestJS도 있지만 Guard가 더 NestJS스러움)
```

### UserIdGuard 동작

```typescript
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userIdHeader = request.headers["x-user-id"];

    // 문자열이 아니거나 빈 문자열이면 거부
    if (typeof userIdHeader !== "string" || userIdHeader.trim() === "") {
      throw new BadRequestException("X-User-Id 헤더가 필요합니다");
    }

    return true; // true면 통과, false면 거부
  }
}
```

### 적용 범위

```typescript
// SubmissionsController: 클래스 레벨에 적용 → 모든 메서드에 적용
@UseGuards(UserIdGuard)
@Controller('submissions')
export class SubmissionsController { ... }

// PromptsController: Guard 없음 → 누구나 접근 가능
@Controller('prompts')
export class PromptsController { ... }
```

```
왜 prompts에는 Guard를 안 붙이는가:

  주제(prompts)는 공개 데이터 → 누가 봐도 상관없음
  답안(submissions)은 개인 데이터 → 누구의 답안인지 알아야 함

  GET /prompts           → X-User-Id 불필요 (공개)
  POST /submissions      → X-User-Id 필수 (누구의 답안?)
  GET /submissions       → X-User-Id 필수 (본인 것만)
  DELETE /submissions/1  → X-User-Id 필수 (본인 것만 삭제)
```

### Custom Decorator (UserId)

Guard가 "통과/차단"을 판단하고, Decorator가 "헤더 값 추출"을 담당한다.

```typescript
// Guard: "X-User-Id 헤더 있어?" → 있으면 통과
// Decorator: "X-User-Id 헤더 값을 꺼내줘"

// 사용하는 곳:
@Post()
async create(
  @UserId() userId: string,     // ← 데코레이터가 헤더에서 추출
  @Body() dto: CreateSubmissionDto
) {
  return this.service.create(userId, dto);
}
```

```
Guard만 쓰면:
  → 통과/차단은 되지만, 컨트롤러에서 헤더 값을 직접 꺼내야 함
  → @Headers('x-user-id') 매번 타이핑

Decorator만 쓰면:
  → 값 추출 + 검증도 가능 (실제로 우리 코드는 이렇게 함)
  → 하지만 Guard 없으면 Swagger 문서에 "이 API는 헤더 필수"가 안 드러남

Guard + Decorator 조합 (우리 프로젝트):
  → Guard: 클래스 레벨에서 "이 컨트롤러는 X-User-Id 필수" 선언 (문서화 역할)
  → Decorator: 각 메서드에서 헤더 값을 깔끔하게 추출 (+ 방어적 재검증)
  → 실제로 Decorator 안에도 동일한 검증 로직이 있음 (Guard 없이 쓸 때를 대비한 안전장치)
```

## 8. 페이지네이션 (Pagination)

### offset/limit 방식

```
전체 데이터: [A, B, C, D, E, F, G, H, I, J, K, L] (12개)

Page 1 (offset=0, limit=5):  [A, B, C, D, E]
Page 2 (offset=5, limit=5):  [F, G, H, I, J]
Page 3 (offset=10, limit=5): [K, L]

offset = (page - 1) * limit
  page=1 → offset=0
  page=2 → offset=5
  page=3 → offset=10
```

### COUNT + SELECT 동시 쿼리

```typescript
// 두 쿼리를 Promise.all로 병렬 실행 → 성능 향상
const [countResult, rows] = await Promise.all([
  this.db.queryOne("SELECT COUNT(*) as total FROM prompts ...", params),
  this.db.query("SELECT * FROM prompts ... LIMIT $N OFFSET $M", params),
]);
```

```
왜 COUNT가 필요한가:

  프론트엔드에서 페이지 UI를 그리려면:
  ┌─────────────────────────────────────┐
  │  ◀  1   2   [3]   4   5   ▶       │  ← totalPages 필요
  └─────────────────────────────────────┘

  totalPages = Math.ceil(total / limit)
             = Math.ceil(30 / 10)
             = 3
```

### 응답 형식

```json
{
  "success": true,
  "data": {
    "items": [{ "id": 1, "title": "..." }, ...],
    "total": 30,
    "page": 1,
    "limit": 10,
    "totalPages": 3
  }
}
```

### COUNT(\*)가 문자열을 반환하는 함정

```typescript
// PostgreSQL의 COUNT()는 bigint를 반환 → node-postgres는 이를 문자열로 변환
const countResult = await this.db.queryOne("SELECT COUNT(*) as total FROM ...");
// countResult.total = "30"  ← 숫자가 아니라 문자열!

// 반드시 parseInt로 변환
return parseInt(countResult?.total ?? "0", 10);
//                                        ^^
//                                        10진수 명시 (안 하면 '08' 같은 값에서 버그)
```

## 9. 상태 전환 규칙

### 단방향 상태 흐름

```
  draft ──────────► submitted
  (임시저장)        (최종 제출)
     │                  │
     │  수정 가능       │  수정 불가
     │  삭제 가능       │  삭제 가능
     │                  │
     ▼                  ▼
  deleted_at         deleted_at
  (soft delete)      (soft delete)
```

### 서비스에서의 규칙 강제

```typescript
// 수정: draft만 가능
async update(id, userId, dto) {
  const submission = await this.repository.findOneByIdAndUser(id, userId);
  if (!submission) throw new NotFoundException('답안을 찾을 수 없습니다');

  if (submission.status !== 'draft') {
    throw new BadRequestException('이미 제출된 답안은 수정할 수 없습니다');
  }
  // ...
}

// 제출: draft → submitted (빈 내용 불가)
async submit(id, userId) {
  // ...
  if (submission.status !== 'draft') {
    throw new BadRequestException('이미 제출된 답안입니다');
  }
  if (!submission.content || submission.content.trim() === '') {
    throw new BadRequestException('내용이 비어있는 답안은 제출할 수 없습니다');
  }
  return this.repository.updateStatus(id, 'submitted');
}
```

## 10. SQL JOIN (테이블 결합)

### 왜 JOIN이 필요한가

```
답안 목록을 보여줄 때, 주제 제목도 같이 보여줘야 한다:

  submissions 테이블:               prompts 테이블:
  ┌────┬───────────┬─────────┐     ┌────┬────────────┐
  │ id │ prompt_id │ content │     │ id │ title      │
  ├────┼───────────┼─────────┤     ├────┼────────────┤
  │ 1  │ 3         │ "..."   │ ──► │ 3  │ "오늘 일기"│
  │ 2  │ 7         │ "..."   │ ──► │ 7  │ "편지 쓰기"│
  └────┴───────────┴─────────┘     └────┴────────────┘

  결합 결과:
  ┌────┬─────────┬──────────────┐
  │ id │ content │ prompt_title │
  ├────┼─────────┼──────────────┤
  │ 1  │ "..."   │ "오늘 일기"  │
  │ 2  │ "..."   │ "편지 쓰기"  │
  └────┴─────────┴──────────────┘
```

### 실제 SQL

```sql
SELECT s.id, s.content, s.status,
       p.title as prompt_title,
       p.category as prompt_category,
       p.difficulty as prompt_difficulty
FROM submissions s                    -- s는 submissions의 별칭(alias)
JOIN prompts p ON s.prompt_id = p.id  -- p는 prompts의 별칭
WHERE s.user_id = $1 AND s.deleted_at IS NULL
ORDER BY s.created_at DESC
```

```
JOIN의 동작:
  submissions의 각 행에 대해
  prompt_id와 일치하는 prompts 행을 찾아
  옆에 붙여준다.

  s.prompt_id = 3  →  p.id = 3인 행을 찾아서 결합
                       p.title = "오늘 일기"
                       p.category = "일기"
```

**프론트엔드 비유:**

```typescript
// React에서 두 배열을 합치는 것과 비슷
const submissionsWithPrompt = submissions.map((sub) => ({
  ...sub,
  prompt: prompts.find((p) => p.id === sub.prompt_id),
}));
// 하지만 DB에서 JOIN으로 하면 한 번의 쿼리로 끝!
// → 클라이언트에서 N+1 쿼리 대신 DB가 효율적으로 결합
```

## 11. DTO 상속과 class-validator

### 공통 DTO 상속

```typescript
// 공통 페이지네이션 DTO
class PaginationDto {
  @IsOptional() @IsInt() @Min(1) page?: number = 1;
  @IsOptional() @IsInt() @Min(1) @Max(100) limit?: number = 10;
}

// 주제 조회 DTO: 페이지네이션 + 필터 추가
class GetPromptsDto extends PaginationDto {
  @IsOptional() category?: string;
  @IsOptional() difficulty?: string;
}

// 답안 조회 DTO: 페이지네이션 + 다른 필터
class GetSubmissionsDto extends PaginationDto {
  @IsOptional() status?: string;
}
```

```
상속 구조:
  PaginationDto (page, limit)
       │
       ├── GetPromptsDto (+ category, difficulty)
       │
       └── GetSubmissionsDto (+ status)

→ page, limit 검증 로직을 한 번만 작성하고 재사용!
```

### @Type(() => Number)의 필요성

```
쿼리 파라미터는 항상 문자열로 들어온다:

  GET /prompts?page=2&limit=10
  → dto.page = "2" (문자열!)
  → dto.limit = "10" (문자열!)

  @Type(() => Number)가 "2" → 2로 변환해준다.
  이것 없으면 @IsInt() 검증에서 실패!
```

## 12. 모듈 간 의존성

### SubmissionsModule → PromptsModule 연결

```typescript
// submissions.module.ts
@Module({
  imports: [PromptsModule], // ← PromptsModule을 import
  controllers: [SubmissionsController],
  providers: [SubmissionsService, SubmissionsRepository],
})
export class SubmissionsModule {}

// prompts.module.ts
@Module({
  controllers: [PromptsController],
  providers: [PromptsService, PromptsRepository],
  exports: [PromptsService], // ← 외부에 PromptsService 공개
})
export class PromptsModule {}
```

```
왜 PromptsModule을 import하는가:

  SubmissionsService에서 prompt_id 유효성을 검증하려면
  PromptsService.findOne(promptId)를 호출해야 한다.

  PromptsModule이 exports에 PromptsService를 포함하지 않으면
  SubmissionsModule에서 주입할 수 없다!
```

```
모듈 의존성 다이어그램:

  ┌──────────────┐
  │ AppModule    │
  │              │
  │  imports:    │
  │  ┌─────────┐│    ┌──────────────────┐
  │  │Database ├────►│ @Global() Pool    │
  │  │Module   ││    └──────────────────┘
  │  └─────────┘│
  │  ┌─────────┐│    ┌──────────────────┐
  │  │Prompts  ├────►│ exports:          │
  │  │Module   ││    │   PromptsService  │◄──────┐
  │  └─────────┘│    └──────────────────┘        │
  │  ┌─────────┐│    ┌──────────────────┐        │
  │  │Submiss. ├────►│ imports:          │        │
  │  │Module   ││    │   PromptsModule ──┼────────┘
  │  └─────────┘│    │                  │
  └──────────────┘    │ SubmissionsService│
                      │   → PromptsService│ (DI로 주입)
                      └──────────────────┘
```

## 13. 프론트엔드 ↔ 백엔드 개념 대응표 (Phase 2 추가)

| 프론트엔드 (React)          | 백엔드 (NestJS)  | 이 프로젝트 예시                |
| --------------------------- | ---------------- | ------------------------------- |
| API 클라이언트 (fetch 래퍼) | Repository       | PromptsRepository               |
| Custom Hook                 | Service          | SubmissionsService              |
| 라우트 가드 (beforeEnter)   | Guard            | UserIdGuard                     |
| useParams()                 | @Param()         | @Param('id', ParseIntPipe)      |
| 커스텀 훅 (useAuth)         | Custom Decorator | @UserId()                       |
| TypeScript union type       | CHECK constraint | status IN ('draft','submitted') |
| Array.find() + map()        | SQL JOIN         | submissions JOIN prompts        |
| Array.filter()              | SQL WHERE        | WHERE category = $1             |
| Array.slice(offset, limit)  | SQL LIMIT OFFSET | LIMIT $3 OFFSET $4              |
| 삭제 시 state에서 제거      | Soft Delete      | deleted_at = NOW()              |
| .length                     | COUNT(\*)        | SELECT COUNT(\*) as total       |

## 14. 기억해야 할 것

1. **Controller → Service → Repository** 3계층으로 분리한다. Controller는 라우팅만, Service는 비즈니스 규칙만, Repository는 SQL만.
2. **동적 WHERE는 paramIndex 카운터**로 구성한다. 절대 문자열 결합하지 않는다.
3. **Soft delete는 deleted_at 컬럼**으로 구현하고, 모든 SELECT에 `WHERE deleted_at IS NULL`을 추가한다.
4. **Partial index**는 `WHERE deleted_at IS NULL` 조건을 인덱스에 넣어서 삭제된 행을 인덱스에서 제외한다.
5. **CHECK constraint**로 DB 레벨에서 값 범위를 제한한다. 코드 검증의 safety net 역할.
6. **Guard는 관문, Decorator는 추출기.** Guard가 먼저 검증하고, Decorator가 값을 꺼낸다.
7. **COUNT(\*)는 문자열을 반환**한다. 반드시 `parseInt(..., 10)`으로 변환.
8. **모듈 exports를 잊지 않는다.** 다른 모듈에서 Service를 쓰려면 `exports: [Service]` 필수.
9. **JOIN으로 관련 데이터를 한 번에 가져온다.** 프론트에서 N+1 쿼리 대신 DB가 효율적으로 결합.
10. **상태 전환 규칙은 Service에서 강제한다.** Repository는 SQL만 실행, "허용되는가?"는 Service가 판단.
