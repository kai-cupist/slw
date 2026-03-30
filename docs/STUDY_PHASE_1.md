# Phase 1 스터디: 인프라 및 기반 구축

> 프론트엔드 개발자의 백엔드 학습 노트

## 1. 전체 아키텍처

```
┌─────────────────────────────────────────────────────────────┐
│                    Docker Compose                           │
│                                                             │
│  ┌──────────────┐         ┌──────────────────────────────┐  │
│  │              │  5432   │          NestJS (api)         │  │
│  │  PostgreSQL  │◄────────│                              │  │
│  │  (db)        │         │  ┌─────────┐  ┌───────────┐  │  │
│  │              │         │  │ Module  │  │ Module    │  │  │
│  └──────┬───────┘         │  │ System  │  │ System    │  │  │
│         │                 │  └─────────┘  └───────────┘  │  │
│         │ healthcheck     │                              │  │
│         │ (pg_isready)    │        port 3000              │  │
│         │                 └──────────┬───────────────────┘  │
│         │                            │                      │
└─────────┼────────────────────────────┼──────────────────────┘
          │                            │
     host:5434                    host:3000
          │                            │
          ▼                            ▼
     DBeaver 등                  브라우저 / curl
     DB 클라이언트               API 호출
```

**핵심 포인트:**

- 컨테이너 간 통신은 Docker 내부 네트워크로 이뤄짐 (`api` → `db:5432`)
- 호스트에서 접근할 때만 매핑된 포트를 사용 (`localhost:5434`, `localhost:3000`)
- `depends_on: condition: service_healthy`로 DB가 준비된 후 앱이 시작됨

## 2. NestJS 모듈 시스템

### 모듈 의존성 구조

```
                    ┌──────────────┐
                    │  AppModule   │
                    │              │
                    │  controllers:│
                    │  AppController
                    └──────┬───────┘
                           │ imports
              ┌────────────┼────────────┐
              ▼            ▼            ▼
     ┌────────────┐ ┌───────────┐ ┌──────────────┐
     │ConfigModule│ │Database   │ │Migration     │
     │ (Global)   │ │Module     │ │Module        │
     │            │ │ (Global)  │ │              │
     │ .env 로드  │ │           │ │ Migration    │
     │ isGlobal   │ │ pg Pool   │ │ Service      │
     └────────────┘ │ Database  │ └──────┬───────┘
                    │ Service   │        │
                    └─────┬─────┘        │ DatabaseService
                          │              │ 주입받아 사용
                          │              │
                          └──────────────┘
```

### `@Global()` 데코레이터의 의미

```typescript
// DatabaseModule은 @Global()이므로
// 다른 모듈에서 import 없이 DatabaseService를 주입할 수 있다

// MigrationModule은 DatabaseModule을 import하지 않았지만
// MigrationService에서 DatabaseService를 바로 사용 가능!
@Injectable()
export class MigrationService {
  constructor(private readonly databaseService: DatabaseService) {}
  //          ^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^^
  //          @Global() 덕분에 import 없이 주입됨
}
```

**프론트엔드 비유:** React의 Context Provider와 유사. `@Global()` = 최상위 Provider 감싸기.

### 일반 모듈 vs 전역 모듈

```
일반 모듈 (MigrationModule):
  AppModule → imports: [MigrationModule] → 명시적 연결 필요

전역 모듈 (@Global() DatabaseModule):
  어디서든 DatabaseService 주입 가능 → import 불필요
  ConfigModule.forRoot({ isGlobal: true })도 같은 원리
```

## 3. 의존성 주입 (DI)

### NestJS DI 흐름

```
1. 등록                          2. 주입
┌─────────────┐                 ┌─────────────────────┐
│ Module에서   │                 │ constructor에서      │
│ provide 등록 │ ───────────►   │ 타입으로 요청        │
└─────────────┘                 └─────────────────────┘

예시: pg Pool 등록 → DatabaseService에서 사용

┌─ DatabaseModule ──────────────────────────────┐
│                                               │
│  providers: [{                                │
│    provide: DATABASE_POOL,  ← 토큰(이름표)    │
│    useFactory: (config) => new Pool({...})    │
│  }]                                           │
│                                               │
└───────────────────────────────────────────────┘
            │
            │ DI 컨테이너가 자동 연결
            ▼
┌─ DatabaseService ─────────────────────────────┐
│                                               │
│  constructor(                                 │
│    @Inject(DATABASE_POOL)  ← 같은 토큰으로    │
│    private readonly pool: Pool               │
│  )                                            │
│                                               │
└───────────────────────────────────────────────┘
```

**프론트엔드 비유:**

- `provide` = `Context.Provider`의 `value`
- `@Inject(TOKEN)` = `useContext(SomeContext)`
- 차이점: React는 컴포넌트 트리 기반, NestJS는 모듈 그래프 기반

### 커스텀 프로바이더 vs 클래스 프로바이더

```typescript
// 클래스 프로바이더 (단순한 경우)
// NestJS가 자동으로 new DatabaseService()를 해줌
providers: [DatabaseService];

// 커스텀 프로바이더 (팩토리 함수가 필요한 경우)
// pg Pool은 설정값이 필요하므로 useFactory 사용
providers: [
  {
    provide: DATABASE_POOL,
    inject: [ConfigService], // 팩토리에 주입할 의존성
    useFactory: (config) => {
      // 인스턴스를 직접 생성
      return new Pool({
        host: config.get("DB_HOST"),
        port: config.get("DB_PORT"),
        // ...
      });
    },
  },
];
```

## 4. 요청-응답 파이프라인

### HTTP 요청이 처리되는 순서

```
클라이언트 요청
     │
     ▼
┌─────────────────┐
│  ValidationPipe  │  ← 입력 검증 (DTO의 데코레이터 기반)
│  (Global Pipe)   │     실패 시 → HttpExceptionFilter로 직행
└────────┬────────┘
         │ 검증 통과
         ▼
┌─────────────────┐
│   Controller     │  ← 라우팅 + 비즈니스 로직 호출
│   @Get('health') │
└────────┬────────┘
         │ return 값
         ▼
┌──────────────────────┐
│  ResponseInterceptor  │  ← { success: true, data: 반환값 }
│  (Global Interceptor) │     으로 래핑
└────────┬─────────────┘
         │
         ▼
    클라이언트 응답
    { success: true, data: { status: "ok" } }


에러 발생 시:
     │
     ▼
┌──────────────────────┐
│  HttpExceptionFilter  │  ← { success: false, error: { code, message } }
│  (Global Filter)      │     으로 래핑
└────────┬─────────────┘
         │
         ▼
    클라이언트 응답
    { success: false, error: { code: "NOT_FOUND", message: "..." } }
```

### Envelope 패턴이란?

모든 API 응답을 동일한 "봉투" 형태로 감싸는 패턴.

```
프론트엔드에서의 처리가 간단해진다:

// Envelope 패턴 없이 (매번 다른 형태)
const data = await fetch('/health')    // { status: "ok" }
const data = await fetch('/error')     // { statusCode: 404, message: "..." }
                                       // 어떤 형태인지 매번 확인해야 함

// Envelope 패턴 적용 (항상 같은 형태)
const res = await fetch('/health')     // { success: true, data: {...} }
const res = await fetch('/error')      // { success: false, error: {...} }

if (res.success) {
  // res.data 사용
} else {
  // res.error.message 표시
}
```

### 전역 설정이 적용되는 위치 (main.ts)

```typescript
// main.ts에서 전역으로 설정하면
// 모든 컨트롤러의 모든 엔드포인트에 자동 적용됨

app.useGlobalPipes(new ValidationPipe({...}))       // 입력 검증
app.useGlobalInterceptors(new ResponseInterceptor()) // 성공 응답 래핑
app.useGlobalFilters(new HttpExceptionFilter())      // 에러 응답 래핑
```

## 5. Raw SQL과 pg Pool

### Pool의 역할

```
Pool 없이 (매번 새 연결):
  요청 → DB 연결 → 쿼리 → 연결 닫기 → 응답
  요청 → DB 연결 → 쿼리 → 연결 닫기 → 응답   ← 연결 비용이 매번 발생
  요청 → DB 연결 → 쿼리 → 연결 닫기 → 응답

Pool 사용 (연결 재사용):
  시작 시 연결 10개 미리 생성
  ┌────────────────────────────┐
  │  Pool (max: 10)            │
  │  ┌──┐┌──┐┌──┐┌──┐┌──┐...  │
  │  │C1││C2││C3││C4││C5│     │
  │  └──┘└──┘└──┘└──┘└──┘     │
  └────────────────────────────┘
  요청 → C1 빌려감 → 쿼리 → C1 반납     ← 연결 생성 비용 없음
  요청 → C2 빌려감 → 쿼리 → C2 반납
```

### query vs queryOne vs withTransaction

```typescript
// query: 여러 행 조회
const rows = await db.query('SELECT * FROM prompts');
// → [{ id: 1, title: '...' }, { id: 2, title: '...' }]

// queryOne: 단일 행 조회
const row = await db.queryOne('SELECT * FROM prompts WHERE id = $1', [1]);
// → { id: 1, title: '...' } 또는 null

// withTransaction: 여러 쿼리를 하나의 단위로 실행
// 중간에 실패하면 전부 취소 (ROLLBACK)
await db.withTransaction(async (client) => {
  await client.query('INSERT INTO submissions ...', [...]);
  await client.query('UPDATE prompts SET count = count + 1 ...', [...]);
  // 둘 다 성공하거나, 둘 다 취소되거나
});
```

### SQL Injection 방지: 파라미터 바인딩

```
위험한 방식 (문자열 결합):
  `SELECT * FROM users WHERE name = '${userInput}'`

  userInput = "'; DROP TABLE users; --"
  → SELECT * FROM users WHERE name = ''; DROP TABLE users; --'
  → 테이블 삭제됨!

안전한 방식 (파라미터 바인딩):
  db.query('SELECT * FROM users WHERE name = $1', [userInput])

  $1 자리에 userInput이 "값"으로만 들어감
  SQL 구문으로 해석되지 않아 안전
```

## 6. 수동 마이그레이션 시스템

### 왜 마이그레이션이 필요한가?

프론트엔드에서는 데이터 구조를 바꾸고 싶으면 코드만 수정하면 된다.

```typescript
// 프론트엔드: 타입 바꾸고 싶으면 코드만 고치면 끝
interface User {
  name: string;
  email: string; // ← 추가하고 싶으면 여기 한 줄 추가
}
```

하지만 **DB는 이미 저장된 데이터가 있기 때문에** 구조를 바꾸는 게 단순하지 않다.

```
DB에 이미 사용자 1,000명의 데이터가 있는 상황에서
"email 컬럼을 추가하고 싶다"면?

→ 코드만 고치면 안 됨. DB에 직접 ALTER TABLE을 실행해야 함
→ 이걸 팀원도, 서버도, 나중에 새로 세팅할 때도 똑같이 해야 함
→ "어떤 변경을 언제 했는지" 추적이 필요
→ 이게 마이그레이션!
```

**프론트엔드 비유:**

```
마이그레이션 없이 DB 관리하는 것은
git 없이 코드를 관리하는 것과 같다.

"저번에 뭐 바꿨더라?"
"내 로컬에서는 되는데 서버에서는 안 돼"
"새 팀원이 들어왔는데 DB를 어떻게 세팅하지?"

→ 전부 마이그레이션이 해결하는 문제들
```

### 코드의 git vs DB의 마이그레이션

```
git log (코드 변경 이력):           migrations/ (DB 변경 이력):
  commit 3: 로그인 기능 추가         002_create_prompts.sql
  commit 2: 유저 모델 수정           001_create_submissions.sql
  commit 1: 초기 프로젝트 설정       000_create_schema_migrations.sql

공통점:
  - 변경사항을 순서대로 기록
  - 누가 봐도 같은 순서로 재현 가능
  - 새 환경에서 처음부터 적용하면 현재 상태가 됨

차이점:
  - git은 되돌리기(revert) 가능
  - 우리 마이그레이션은 롤백 없음 → 문제 시 새 파일로 수정
    (학습 목적으로 단순하게 유지)
```

### 구체적 시나리오

```
Phase 2에서 "쓰기 주제" 테이블이 필요한 상황:

1. migrations/001_create_prompts.sql 파일 생성:
   ┌─────────────────────────────────────────────┐
   │ CREATE TABLE prompts (                      │
   │   id SERIAL PRIMARY KEY,                    │
   │   title VARCHAR(200) NOT NULL,              │
   │   content TEXT NOT NULL,                     │
   │   difficulty VARCHAR(20) DEFAULT 'medium',  │
   │   created_at TIMESTAMP DEFAULT NOW()        │
   │ );                                          │
   └─────────────────────────────────────────────┘

2. npm run migration:run 실행
   → "001_create_prompts.sql 아직 안 했네? 실행!"
   → DB에 prompts 테이블 생성됨
   → schema_migrations에 "001_create_prompts.sql 적용 완료" 기록

3. 나중에 "카테고리 컬럼을 추가하고 싶다"면?
   → 001 파일을 수정하는 게 아니라
   → 002_add_category_to_prompts.sql을 새로 만듦:
   ┌───────────────────────────────────────────────────┐
   │ ALTER TABLE prompts ADD COLUMN category VARCHAR(50);│
   └───────────────────────────────────────────────────┘

이렇게 하면 git clone 후 migration:run 한 번이면
DB가 최신 상태로 세팅됨
```

### 실행 흐름

```
npm run migration:run 실행 시:

  ┌──────────────────────────────────────────┐
  │ 1. schema_migrations 테이블 존재 확인     │
  │    없으면 → 000 파일 실행하여 생성        │
  └─────────────────┬────────────────────────┘
                    ▼
  ┌──────────────────────────────────────────┐
  │ 2. migrations/ 폴더의 .sql 파일 목록     │
  │    ['000_...sql', '001_...sql', ...]     │
  │    번호순 정렬                            │
  └─────────────────┬────────────────────────┘
                    ▼
  ┌──────────────────────────────────────────┐
  │ 3. DB에서 "이미 적용한 파일" 목록 조회    │
  │    → { '000_...sql' }                    │
  └─────────────────┬────────────────────────┘
                    ▼
  ┌──────────────────────────────────────────┐
  │ 4. 비교해서 미적용 파일만 실행            │
  │                                          │
  │    000_...sql → 이미 했음 → 건너뜀       │
  │    001_...sql → 안 했음 → SQL 실행!      │
  │                   → "적용 완료" 기록      │
  └──────────────────────────────────────────┘
```

**핵심:** 몇 번을 실행해도 같은 결과 (멱등성). 이미 적용된 파일은 건너뛴다.
새 팀원이 `git clone` → `docker compose up` → `migration:run` 하면 끝.

## 7. Docker Compose 구성

### 볼륨 마운트 이해

볼륨 마운트는 **호스트(내 맥)의 폴더와 컨테이너 내부 폴더를 연결**하는 것이다.
프론트엔드로 비유하면, 로컬 파일을 dev server가 감시(watch)하는 것과 비슷하다.

```yaml
# docker-compose.yml의 api 서비스 volumes
volumes:
  - ./server:/usr/src/app # (1)
  - /usr/src/app/node_modules # (2)
  - ./migrations:/usr/src/migrations # (3)
```

#### (1) 소스 코드 동기화

```
내 맥 (호스트)                    Docker 컨테이너
┌──────────────┐                ┌──────────────────┐
│ ./server/    │ ◄── 실시간 ──► │ /usr/src/app/    │
│  src/        │    동기화      │  src/            │
│  package.json│                │  package.json    │
└──────────────┘                └──────────────────┘

VSCode에서 코드 수정 → 컨테이너 안에도 즉시 반영 → NestJS hot reload 작동
```

프론트엔드의 `npm run dev`가 파일 변경을 감지하고 자동 새로고침하는 것과 같은 원리다.

#### (2) node_modules 보호 (익명 볼륨)

```
문제 상황 (이 설정이 없으면):
  (1)번이 호스트의 ./server 전체를 컨테이너에 덮어씀
  → 호스트의 node_modules(macOS용)가 컨테이너(Linux)에 들어감
  → 네이티브 모듈(bcrypt 등)이 OS가 달라서 작동 안 함!

해결:
  /usr/src/app/node_modules ← 콜론(:)이 없음 = "이 경로는 덮어쓰지 마"
  → 컨테이너가 자체적으로 npm ci로 설치한 Linux용 node_modules를 유지
```

쉽게 말하면 **"소스 코드는 공유하되, node_modules만큼은 각자 쓰자"** 라는 의미다.

#### (3) 마이그레이션 파일

```
프로젝트 구조:
  slw/
  ├── server/        ← (1)번으로 마운트됨
  ├── migrations/    ← server/ 밖에 있어서 (1)번에 포함 안 됨!
  └── docker-compose.yml

그래서 migrations/를 별도로 마운트해야 컨테이너 안에서 접근 가능
  ./migrations → /usr/src/migrations
```

### healthcheck + depends_on

```yaml
# DB가 진짜 준비됐는지 확인하는 장치
db:
  healthcheck:
    test: ["CMD", "pg_isready", "-U", "${DB_USER}"]
    interval: 5s # 5초마다 확인
    retries: 5 # 5번까지 재시도

api:
  depends_on:
    db:
      condition: service_healthy # DB가 healthy 상태일 때만 시작
```

```
시작 순서:
  db 컨테이너 시작
       │
       ├─ pg_isready 실행 (5초 간격)
       ├─ pg_isready 실행 → 아직 안됨
       ├─ pg_isready 실행 → 준비 완료! ✓ (healthy)
       │
       ▼
  api 컨테이너 시작 ← DB가 healthy일 때만!
```

## 8. 프로젝트 디렉토리 구조

```
slw/
├── docker-compose.yml        # 컨테이너 오케스트레이션
├── Dockerfile                # NestJS 앱 이미지 빌드
├── .env                      # 환경 변수 (git 추적 X)
├── .env.example              # 환경 변수 템플릿
├── migrations/               # SQL 마이그레이션 파일
│   └── 000_create_schema_migrations.sql
│
└── server/                   # NestJS 앱
    ├── src/
    │   ├── main.ts                       # 앱 진입점 (전역 설정)
    │   ├── app.module.ts                 # 루트 모듈 (모듈 조립)
    │   ├── app.controller.ts             # 헬스체크 엔드포인트
    │   │
    │   ├── database/                     # DB 연결 모듈
    │   │   ├── database.module.ts        # @Global() 모듈, pg Pool 등록
    │   │   ├── database.service.ts       # query/queryOne/withTransaction
    │   │   └── database.constants.ts     # DI 토큰 상수
    │   │
    │   ├── migration/                    # 마이그레이션 모듈
    │   │   ├── migration.module.ts       # 모듈 정의
    │   │   ├── migration.service.ts      # 마이그레이션 실행 로직
    │   │   └── run-migrations.ts         # CLI 실행 스크립트
    │   │
    │   └── common/                       # 공통 레이어
    │       ├── interfaces/
    │       │   └── api-response.interface.ts  # Envelope 타입 정의
    │       ├── interceptors/
    │       │   └── response.interceptor.ts    # 성공 응답 래핑
    │       └── filters/
    │           └── http-exception.filter.ts   # 에러 응답 래핑
    │
    └── package.json
```

## 9. 프론트엔드 ↔ 백엔드 개념 대응표

| 프론트엔드 (React)            | 백엔드 (NestJS)                | 설명                    |
| ----------------------------- | ------------------------------ | ----------------------- |
| Component                     | Controller                     | 외부 요청을 받는 진입점 |
| Custom Hook                   | Service                        | 비즈니스 로직 담당      |
| Context Provider              | Module (`@Global()`)           | 의존성을 하위에 제공    |
| `useContext()`                | `@Inject()` / constructor 주입 | 의존성을 가져다 쓰기    |
| Props validation (TypeScript) | ValidationPipe + DTO           | 입력 검증               |
| Error Boundary                | ExceptionFilter                | 에러 일괄 처리          |
| HOC / Wrapper                 | Interceptor                    | 응답을 감싸서 변환      |
| `.env` (Vite/CRA)             | `.env` (ConfigModule)          | 환경 변수 관리          |
| `package.json` scripts        | `package.json` scripts         | 실행 명령어             |
| `npm run dev`                 | `npm run start:dev`            | 개발 서버 시작          |

## 10. 기억해야 할 것

1. **모듈은 기능 단위로 분리한다** — database, migration, (앞으로) prompts, submissions, evaluations
2. **`@Global()` 은 신중하게** — DatabaseModule처럼 정말 모든 곳에서 쓰는 것만
3. **SQL은 항상 파라미터 바인딩** — `$1, $2` 사용, 절대 문자열 결합 금지
4. **Pool 연결은 반드시 반납** — `withTransaction`의 `finally { client.release() }`
5. **마이그레이션은 추가만** — 롤백 대신 새 마이그레이션으로 수정
6. **Envelope 패턴으로 일관성** — 프론트에서 `res.success`만 확인하면 됨
