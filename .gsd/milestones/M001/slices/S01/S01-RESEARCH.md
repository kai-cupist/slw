# Phase 1: 인프라 및 기반 구축 - Research

**조사일:** 2026-03-30
**도메인:** Docker Compose + NestJS + PostgreSQL (Raw SQL) + API 응답 표준화
**신뢰도:** HIGH

## 요약

Phase 1은 모든 후속 개발의 기반을 구축하는 단계다. Docker Compose로 PostgreSQL + NestJS 개발 환경을 단일 명령으로 실행하고, pg 라이브러리를 통한 Raw SQL 접근 패턴을 확립하며, 수동 SQL 마이그레이션 체계와 일관된 API 응답 형식을 구현한다.

핵심은 (1) Docker Compose healthcheck로 DB 준비 완료 후 앱이 시작되도록 보장하고, (2) DatabaseModule을 @Global() 모듈로 만들어 pg Pool을 전역 제공하며, (3) schema_migrations 테이블로 마이그레이션 이력을 추적하고, (4) Interceptor + ExceptionFilter로 Envelope 응답 패턴을 전역 적용하는 것이다.

이 페이즈에는 비즈니스 로직(주제, 답안, 평가)이 포함되지 않는다. 오직 인프라와 공통 레이어만 구축한다.

**핵심 권장사항:** NestJS CLI로 프로젝트를 스캐폴딩한 뒤 Docker Compose, DatabaseModule, 마이그레이션 러너, API 공통 레이어를 순서대로 구축한다. 모든 구성은 .env 기반으로 관리한다.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** NestJS 개발 서버는 hot reload를 포함하여 컨테이너에서 실행한다. 소스 코드는 볼륨 마운트로 호스트와 동기화한다.
- **D-02:** PostgreSQL 컨테이너는 데이터 볼륨을 분리하여 컨테이너 재생성 시에도 데이터가 유지된다.
- **D-03:** `docker compose up` 한 번으로 전체 개발 환경이 실행되어야 한다. 별도 설정 단계 없이 바로 개발 가능한 상태.
- **D-04:** 환경 변수는 `.env` 파일로 관리하고, `.env.example`을 제공한다. Docker Compose는 `.env`를 자동 로드한다.
- **D-05:** `migrations/` 폴더에 번호 순서(001, 002, ...)로 SQL 파일을 관리한다. 파일명 형식: `NNN_description.sql`
- **D-06:** `schema_migrations` 테이블을 만들어 적용된 마이그레이션 이력을 추적한다.
- **D-07:** 마이그레이션 실행 스크립트(또는 NestJS 커맨드)를 작성하여, 미적용 마이그레이션을 순서대로 실행한다.
- **D-08:** 롤백은 v1에서 지원하지 않는다. 문제 발생 시 새 마이그레이션으로 수정한다.
- **D-09:** Envelope 패턴을 사용한다. 성공: `{ success: true, data: T }`, 에러: `{ success: false, error: { code: string, message: string } }`
- **D-10:** NestJS 인터셉터로 성공 응답을 감싸고, ExceptionFilter로 에러 응답을 통일한다.
- **D-11:** 유효성 검증 실패(ValidationPipe)는 400 에러로 구체적인 필드별 에러 메시지를 반환한다.
- **D-12:** SQL 파라미터 바인딩($1, $2...)을 반드시 사용하며, 문자열 결합으로 쿼리를 만들지 않는다.
- **D-13:** NestJS 기능 기반 모듈 구조를 따른다. 각 도메인(prompts, submissions, evaluations)은 독립 모듈로 분리한다.
- **D-14:** DatabaseModule은 `@Global()` 모듈로 등록하여, pg Pool을 커스텀 프로바이더로 전역 제공한다.
- **D-15:** 각 모듈 내에 Controller-Service-Repository 레이어를 분리한다. SQL은 Repository 레이어에만 작성한다.
- **D-16:** 공통 레이어: ResponseInterceptor, HttpExceptionFilter, ValidationPipe를 전역 설정한다.

### Claude's Discretion
- 정확한 Docker Compose 버전 및 이미지 태그
- NestJS 프로젝트 생성 시 패키지 매니저 선택 (npm/yarn/pnpm)
- 헬스체크 엔드포인트 구현 방식
- 공통 DTO 유효성 검증 데코레이터 선택

### Deferred Ideas (OUT OF SCOPE)
None -- discussion stayed within phase scope
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| INFRA-01 | Docker Compose로 PostgreSQL과 NestJS 개발 환경을 실행할 수 있다 | Docker Compose v2 + healthcheck 패턴, multi-stage Dockerfile, 볼륨 마운트 hot reload |
| INFRA-02 | 수동 SQL 마이그레이션 스크립트로 DB 스키마를 관리할 수 있다 | schema_migrations 추적 테이블 패턴, NNN_description.sql 네이밍 규칙, NestJS CLI 커맨드 또는 스크립트로 미적용 마이그레이션 순서 실행 |
| INFRA-03 | NestJS 앱이 PostgreSQL에 Raw SQL로 접근할 수 있다 (pg Pool 기반) | @Global() DatabaseModule + pg Pool 커스텀 프로바이더 + DatabaseService 래퍼 (query/queryOne/withTransaction) |
| INFRA-04 | 환경 변수(.env)로 DB 접속 정보와 API 키를 관리한다 | @nestjs/config ConfigModule + .env + .env.example + .gitignore 패턴 |
| API-01 | REST API는 일관된 응답 형식을 사용한다 (성공/에러 모두) | ResponseInterceptor (성공 래핑) + HttpExceptionFilter (에러 통일) + Envelope 패턴 |
| API-02 | SQL 파라미터 바인딩으로 SQL Injection을 방지한다 | pg 라이브러리의 $1, $2 파라미터 바인딩 + DatabaseService에서 강제 |
| API-03 | 입력 값 유효성 검증을 수행한다 (빈 텍스트, 글자 수 제한 등) | 전역 ValidationPipe + class-validator + class-transformer + 커스텀 에러 메시지 포맷 |
</phase_requirements>

## Project Constraints (from CLAUDE.md)

- **언어:** 모든 응답, 문서, 코드 주석, 커밋 메시지를 한국어로 작성. 변수명/함수명은 영어.
- **ORM 사용 금지:** TypeORM, Prisma, Drizzle 등 일체 금지. 모든 DB 접근은 Raw SQL.
- **DB 마이그레이션:** 자동 마이그레이션 도구 없이, 수동 SQL 스크립트로 관리.
- **편의 라이브러리 최소화:** 핵심 로직은 직접 구현 우선. 라이브러리 도입 전 이유 설명 필수.
- **코드 컨벤션:** NestJS 모듈/서비스/컨트롤러 패턴. SQL 파라미터 바인딩 필수. 일관된 REST API 응답 형식. 통일된 에러 포맷.
- **GSD 워크플로우:** 직접 코딩 개입 최소화, GSD 계획-실행-검증 사이클 준수.

## Standard Stack

### Core (Phase 1에서 사용하는 패키지)

| 라이브러리 | 버전 | 용도 | 비고 |
|-----------|------|------|------|
| @nestjs/core | ^11.1.17 | NestJS 핵심 프레임워크 | npm 레지스트리 확인 (2026-03-30) |
| @nestjs/common | ^11.1.17 | 데코레이터, 파이프, 가드 | @nestjs/core와 동일 버전 유지 필수 |
| @nestjs/platform-express | ^11.1.17 | HTTP 어댑터 (Express 5) | NestJS 11 기본 |
| @nestjs/config | ^4.0.3 | 환경변수 관리 (.env 로드) | dotenv 래핑, DI 통합 |
| @nestjs/swagger | ^11.2.6 | API 문서화 (Swagger UI) | 개발 중 API 테스트에 유용 |
| pg | ^8.20.0 | PostgreSQL 클라이언트 (Raw SQL) | Pool 기반 커넥션 관리 |
| class-validator | ^0.15.1 | DTO 유효성 검증 | NestJS ValidationPipe 필수 의존성 |
| class-transformer | ^0.5.1 | 객체 변환 | class-validator 동작에 필요 |

### 개발 의존성

| 라이브러리 | 버전 | 용도 |
|-----------|------|------|
| @types/pg | ^8.20.0 | pg 타입 정의 |
| @nestjs/cli | ^11.0.16 | 프로젝트 스캐폴딩 |
| @nestjs/testing | ^11.1.17 | 테스트 유틸리티 |
| jest | ^29.x | 단위 테스트 (NestJS CLI 기본) |
| eslint | ^9.x | 린터 (NestJS CLI 기본) |
| prettier | ^3.x | 포매터 (NestJS CLI 기본) |

### 인프라

| 기술 | 버전 | 용도 |
|------|------|------|
| Docker Compose | v2 | 로컬 개발 환경 |
| postgres (Docker 이미지) | 16-alpine | DB 컨테이너 (경량) |
| node (Docker 이미지) | 20-alpine | NestJS 앱 컨테이너 |

### Discretion 결정: 권장사항

| 항목 | 권장 | 이유 |
|------|------|------|
| Docker 이미지 | `postgres:16-alpine`, `node:20-alpine` | alpine으로 용량 최소화. 로컬 Node.js가 v20.19.5이므로 컨테이너도 20 기반이 호환성 최적 |
| 패키지 매니저 | npm | NestJS CLI 기본, Node.js 내장, 추가 설치 불필요 |
| 헬스체크 엔드포인트 | `GET /health` 간단 컨트롤러 (DB 연결 확인 포함) | @nestjs/terminus 없이 직접 구현 -- 학습 목적 + 편의 라이브러리 최소화 제약 |
| DTO 검증 데코레이터 | `@IsNotEmpty`, `@IsString`, `@MaxLength`, `@MinLength`, `@IsEnum`, `@IsInt` | Phase 1에서 필요한 기본 데코레이터 세트 |

**설치 명령어:**
```bash
# NestJS 프로젝트 생성
npx @nestjs/cli new server --strict --package-manager npm

# Phase 1 핵심 의존성
cd server
npm install pg @nestjs/config @nestjs/swagger class-validator class-transformer

# Phase 1 개발 의존성
npm install -D @types/pg
```

## Architecture Patterns

### 권장 프로젝트 구조 (Phase 1 범위)

```
project-root/
├── docker-compose.yml          # PostgreSQL + NestJS 컨테이너 정의
├── Dockerfile                  # NestJS 앱 빌드 (multi-stage)
├── .env                        # 환경 변수 (gitignore 대상)
├── .env.example                # 환경 변수 템플릿
├── .gitignore
├── migrations/                 # 수동 SQL 마이그레이션 스크립트
│   └── 000_create_schema_migrations.sql
├── server/                     # NestJS 백엔드
│   ├── package.json
│   ├── tsconfig.json
│   ├── nest-cli.json
│   └── src/
│       ├── main.ts             # 앱 부트스트랩 (글로벌 파이프/필터/인터셉터)
│       ├── app.module.ts       # 루트 모듈
│       ├── app.controller.ts   # 헬스체크 엔드포인트
│       ├── database/           # DatabaseModule (Global)
│       │   ├── database.module.ts
│       │   ├── database.service.ts
│       │   └── database.constants.ts
│       ├── migration/          # 마이그레이션 러너
│       │   ├── migration.module.ts
│       │   └── migration.service.ts
│       └── common/             # 공통 유틸리티
│           ├── filters/
│           │   └── http-exception.filter.ts
│           ├── interceptors/
│           │   └── response.interceptor.ts
│           ├── pipes/          # (ValidationPipe는 main.ts에서 글로벌 설정)
│           └── interfaces/
│               └── api-response.interface.ts
└── mobile/                     # (Phase 4 -- 이번 페이즈에서는 미생성)
```

### 패턴 1: Docker Compose 개발 환경

**무엇:** PostgreSQL + NestJS를 Docker Compose로 실행하는 패턴. NestJS 컨테이너는 소스를 볼륨 마운트하여 hot reload를 지원하고, PostgreSQL은 healthcheck로 준비 완료를 보장한다.

**핵심 설정:**
```yaml
# docker-compose.yml
services:
  db:
    image: postgres:16-alpine
    restart: unless-stopped
    environment:
      POSTGRES_DB: ${DB_NAME}
      POSTGRES_USER: ${DB_USER}
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    ports:
      - "${DB_PORT:-5432}:5432"
    volumes:
      - pgdata:/var/lib/postgresql/data
    healthcheck:
      test: ["CMD", "pg_isready", "-U", "${DB_USER}", "-d", "${DB_NAME}"]
      interval: 5s
      timeout: 5s
      retries: 5
      start_period: 10s

  api:
    build:
      context: ./server
      dockerfile: ../Dockerfile
      target: development
    volumes:
      - ./server:/usr/src/app
      - /usr/src/app/node_modules   # node_modules는 컨테이너 것 사용
    env_file:
      - .env
    ports:
      - "${API_PORT:-3000}:3000"
    depends_on:
      db:
        condition: service_healthy
    command: npm run start:dev

volumes:
  pgdata:
```

**주의사항:**
- `depends_on` + `condition: service_healthy`를 사용해야 DB가 실제로 준비된 후 앱이 시작된다. 단순 `depends_on`만으로는 부족하다.
- `node_modules`를 anonymous volume으로 마운트하여 호스트의 node_modules와 컨테이너의 것이 충돌하지 않도록 한다.
- Docker Compose v2는 `compose.yaml` 파일명을 권장하지만, `docker-compose.yml`도 여전히 지원된다.

### 패턴 2: DatabaseModule - Global pg Pool 프로바이더

**무엇:** pg 라이브러리의 Pool을 NestJS DI에 등록하고, DatabaseService로 감싸서 안전한 쿼리 실행을 보장하는 패턴.

**핵심 구현:**
```typescript
// database.constants.ts
export const DATABASE_POOL = 'DATABASE_POOL';

// database.module.ts
@Global()
@Module({
  imports: [ConfigModule],
  providers: [
    {
      provide: DATABASE_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        const pool = new Pool({
          host: configService.get('DB_HOST'),
          port: configService.get<number>('DB_PORT'),
          user: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          database: configService.get('DB_NAME'),
          max: 10,                      // 최대 커넥션 수
          idleTimeoutMillis: 30000,     // 유휴 커넥션 타임아웃
          connectionTimeoutMillis: 5000, // 커넥션 획득 타임아웃 (필수!)
        });
        return pool;
      },
    },
    DatabaseService,
  ],
  exports: [DatabaseService],
})
export class DatabaseModule {}

// database.service.ts
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  // 단순 쿼리 (자동 acquire/release)
  async query<T = any>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  async queryOne<T = any>(text: string, params?: unknown[]): Promise<T | null> {
    const result = await this.pool.query(text, params);
    return result.rows[0] ?? null;
  }

  // 트랜잭션 (수동 acquire + 반드시 release)
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release(); // 반드시 finally에서 release
    }
  }

  // 앱 종료 시 Pool 정리
  async onModuleDestroy() {
    await this.pool.end();
  }
}
```

**중요:** `connectionTimeoutMillis: 5000`을 반드시 설정한다. 기본값은 무한 대기이므로, 커넥션 누수 시 요청이 영원히 블로킹된다.

### 패턴 3: 수동 SQL 마이그레이션 시스템

**무엇:** NestJS CLI 커맨드 또는 서비스로 `migrations/` 폴더의 SQL 파일을 순서대로 실행하고 `schema_migrations` 테이블에 이력을 기록하는 패턴.

**schema_migrations 테이블:**
```sql
-- migrations/000_create_schema_migrations.sql
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);
```

**마이그레이션 러너 로직 (NestJS 서비스):**
```typescript
// migration.service.ts
@Injectable()
export class MigrationService {
  constructor(private readonly db: DatabaseService) {}

  async runMigrations(): Promise<void> {
    // 1. schema_migrations 테이블 존재 확인 (없으면 생성)
    await this.ensureMigrationsTable();

    // 2. migrations/ 폴더에서 SQL 파일 목록 읽기 (번호순 정렬)
    const files = this.getMigrationFiles();

    // 3. 이미 적용된 마이그레이션 목록 조회
    const applied = await this.getAppliedMigrations();

    // 4. 미적용 마이그레이션만 순서대로 실행
    for (const file of files) {
      if (!applied.has(file)) {
        const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
        await this.db.query(sql);
        await this.db.query(
          'INSERT INTO schema_migrations (filename) VALUES ($1)',
          [file],
        );
        console.log(`마이그레이션 적용: ${file}`);
      }
    }
  }
}
```

**실행 방식:** npm script로 등록하여 수동 실행.
```json
{
  "scripts": {
    "migration:run": "ts-node src/migration/run-migrations.ts"
  }
}
```

### 패턴 4: API 응답 Envelope 패턴

**무엇:** 모든 API 응답을 `{ success, data }` 또는 `{ success, error }` 형태로 통일하는 패턴.

**응답 인터페이스:**
```typescript
// common/interfaces/api-response.interface.ts
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;  // 유효성 검증 에러의 필드별 상세
  };
}
```

**ResponseInterceptor (성공 응답 래핑):**
```typescript
// common/interceptors/response.interceptor.ts
@Injectable()
export class ResponseInterceptor<T> implements NestInterceptor<T, ApiSuccessResponse<T>> {
  intercept(context: ExecutionContext, next: CallHandler): Observable<ApiSuccessResponse<T>> {
    return next.handle().pipe(
      map((data) => ({
        success: true as const,
        data,
      })),
    );
  }
}
```

**HttpExceptionFilter (에러 응답 통일):**
```typescript
// common/filters/http-exception.filter.ts
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    // ValidationPipe 에러의 경우 상세 메시지 추출
    const errorMessage = typeof exceptionResponse === 'string'
      ? exceptionResponse
      : (exceptionResponse as any).message;

    response.status(status).json({
      success: false,
      error: {
        code: HttpStatus[status] || 'UNKNOWN_ERROR',
        message: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        ...(Array.isArray(errorMessage) && { details: errorMessage }),
      },
    });
  }
}
```

**main.ts에서 글로벌 등록:**
```typescript
// main.ts
async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // 글로벌 ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    whitelist: true,              // DTO에 정의되지 않은 속성 제거
    forbidNonWhitelisted: true,   // 정의되지 않은 속성 전송 시 400 에러
    transform: true,              // 자동 타입 변환
  }));

  // 글로벌 인터셉터 & 필터
  app.useGlobalInterceptors(new ResponseInterceptor());
  app.useGlobalFilters(new HttpExceptionFilter());

  // Swagger 설정
  const config = new DocumentBuilder()
    .setTitle('말하기 듣기 쓰기 API')
    .setVersion('1.0')
    .build();
  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('api-docs', app, document);

  await app.listen(3000);
}
```

### 패턴 5: 헬스체크 엔드포인트

**무엇:** DB 연결 상태를 포함한 간단한 헬스체크 엔드포인트. @nestjs/terminus 없이 직접 구현 (학습 목적).

```typescript
// app.controller.ts
@Controller()
export class AppController {
  constructor(private readonly db: DatabaseService) {}

  @Get('health')
  async healthCheck() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('데이터베이스 연결 실패');
    }
  }
}
```

### Anti-Patterns to Avoid

- **Service에 SQL 직접 작성:** SQL은 Repository 레이어에만 작성한다. Phase 1에서는 아직 Repository가 필요 없지만, DatabaseService의 query/queryOne 메서드를 통해 접근하는 패턴을 확립한다.
- **pool.connect() 후 release 누락:** 반드시 `withTransaction()` 헬퍼를 통해서만 트랜잭션을 사용한다. 직접 `pool.connect()`를 호출하지 않는다.
- **SQL 문자열 결합:** `${}` 또는 `+` 연산자로 SQL 쿼리를 구성하지 않는다. 반드시 `$1`, `$2` 파라미터 바인딩을 사용한다.
- **환경 변수 하드코딩:** 모든 설정값은 .env + ConfigService로 관리한다.

## Don't Hand-Roll

| 문제 | 직접 만들지 말 것 | 대신 사용 | 이유 |
|------|-------------------|-----------|------|
| 환경변수 로드 | 직접 dotenv 설정 | @nestjs/config (ConfigModule) | NestJS DI 통합, 타입 안전성, 기본값 처리 |
| 요청 데이터 검증 | 수동 if/else 검증 | class-validator + ValidationPipe | 데코레이터 기반 선언적 검증, 자동 에러 메시지 |
| API 문서화 | 수동 Swagger JSON 작성 | @nestjs/swagger | 데코레이터로 코드와 문서 동기화 |
| 커넥션 풀 관리 | 직접 커넥션 생성/해제 | pg Pool + DatabaseService 래퍼 | Pool이 자동으로 커넥션 재사용/해제 관리 |

**핵심 통찰:** 편의 라이브러리 최소화 제약이 있지만, NestJS의 핵심 파이프라인(ValidationPipe, ExceptionFilter, Interceptor)은 프레임워크 학습 자체가 목적이므로 사용한다. class-validator/class-transformer도 NestJS ValidationPipe의 필수 의존성이다.

## Common Pitfalls

### Pitfall 1: Docker Compose에서 DB 준비 전에 앱 시작

**무엇이 잘못되는가:** `depends_on`만 사용하면 PostgreSQL 컨테이너가 "시작"되었을 뿐 "접속 가능"한 상태가 아닐 수 있다. NestJS 앱이 DB 연결에 실패하여 즉시 종료된다.
**왜 발생하는가:** Docker Compose의 기본 `depends_on`은 컨테이너 시작 순서만 보장하고, 서비스 준비 완료를 보장하지 않는다.
**어떻게 피하는가:** `depends_on` + `condition: service_healthy` + PostgreSQL `healthcheck`(`pg_isready`) 조합을 사용한다.
**경고 신호:** `docker compose up` 시 "Connection refused" 또는 "ECONNREFUSED" 에러가 간헐적으로 발생.

### Pitfall 2: 커넥션 풀 고갈 (Connection Pool Exhaustion)

**무엇이 잘못되는가:** `pool.connect()` 후 `client.release()`를 호출하지 않으면 커넥션이 풀에서 영구 이탈한다.
**왜 발생하는가:** 에러 발생 시 `finally` 블록 없이 `release()`를 호출하여, 예외 경로에서 커넥션 누수.
**어떻게 피하는가:** DatabaseService의 `withTransaction()` 헬퍼를 통해서만 트랜잭션을 사용한다. 단순 쿼리는 `pool.query()`를 사용 (자동 acquire/release). `connectionTimeoutMillis: 5000` 필수 설정.
**경고 신호:** 앱 실행 후 시간이 지나면 요청이 느려지다가 타임아웃 발생.

### Pitfall 3: 마이그레이션 추적 실패

**무엇이 잘못되는가:** psql에서 직접 ALTER TABLE을 실행하고 마이그레이션 스크립트를 작성하지 않아, 새 환경에서 스키마를 재현할 수 없다.
**왜 발생하는가:** "나중에 스크립트 정리하지"라는 습관. 이미 적용된 마이그레이션을 재적용하여 에러 발생.
**어떻게 피하는가:** 모든 스키마 변경은 반드시 `migrations/` 폴더의 SQL 파일을 통해서만 수행한다. `schema_migrations` 테이블로 적용 여부를 추적한다.
**경고 신호:** Docker Compose로 새 환경을 세팅하면 "column does not exist" 에러 발생.

### Pitfall 4: SQL Injection - 문자열 결합으로 쿼리 구성

**무엇이 잘못되는가:** pg의 `$1`, `$2` 파라미터 바인딩은 값(value)에만 적용 가능하고, 테이블명/컬럼명 같은 식별자(identifier)에는 사용할 수 없다.
**왜 발생하는가:** ORM이 자동 처리하던 쿼리 안전성을 직접 관리하는 것이 처음이라 방심.
**어떻게 피하는가:** 값은 반드시 `$1`, `$2` 바인딩. 식별자가 동적이면 화이트리스트 방식으로 검증. 코드에 `${}` 또는 `+` 연산자가 SQL 쿼리에 사용되면 즉시 경고.
**경고 신호:** SQL 쿼리 문자열에 템플릿 리터럴이나 문자열 연결이 보임.

### Pitfall 5: ValidationPipe 에러 메시지 형식 불일치

**무엇이 잘못되는가:** NestJS 기본 ValidationPipe는 에러를 `{ statusCode, message[], error }` 형태로 반환하는데, 프로젝트의 Envelope 패턴(`{ success, error }`)과 다르다.
**왜 발생하는가:** ValidationPipe가 던지는 BadRequestException을 HttpExceptionFilter에서 제대로 처리하지 않으면 응답 형식이 불일치한다.
**어떻게 피하는가:** HttpExceptionFilter에서 ValidationPipe의 에러 응답을 파싱하여 Envelope 형식으로 변환한다. `exception.getResponse()`에서 `message` 배열을 추출하여 `details` 필드에 포함.
**경고 신호:** 유효성 검증 실패 시 응답 형식이 성공 응답과 다름.

## Code Examples

### Docker Compose .env 파일

```env
# .env.example
DB_HOST=db
DB_PORT=5432
DB_NAME=slw
DB_USER=slw_user
DB_PASSWORD=slw_password_change_me
API_PORT=3000
NODE_ENV=development
```

### Dockerfile (multi-stage, 개발용)

```dockerfile
# Dockerfile
FROM node:20-alpine AS development

WORKDIR /usr/src/app

COPY --chown=node:node package*.json ./
RUN npm ci

COPY --chown=node:node . .

USER node
```

### ConfigModule 등록

```typescript
// app.module.ts
@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,     // 어디서든 ConfigService 주입 가능
      envFilePath: '.env', // Docker Compose가 .env를 자동 로드하지만 명시
    }),
    DatabaseModule,
    MigrationModule,
  ],
  controllers: [AppController],
})
export class AppModule {}
```

### 유효성 검증 DTO 예시

```typescript
// 향후 Phase에서 사용할 패턴 예시
import { IsNotEmpty, IsString, MaxLength, MinLength } from 'class-validator';

export class CreateSubmissionDto {
  @IsNotEmpty({ message: '답안 내용을 입력해주세요' })
  @IsString()
  @MinLength(10, { message: '답안은 최소 10자 이상이어야 합니다' })
  @MaxLength(5000, { message: '답안은 최대 5000자까지 가능합니다' })
  content: string;
}
```

## Environment Availability

| 의존성 | 요구 사항 | 사용 가능 | 버전 | 비고 |
|--------|----------|-----------|------|------|
| Docker | 컨테이너 실행 | O | 27.4.1 | -- |
| Docker Compose | 개발 환경 오케스트레이션 | O | v2.31.0 | -- |
| Node.js | NestJS 런타임 | O | v20.19.5 | NestJS 11 최소 요구(20+) 충족. 스택 연구에서 22.x를 권장했으나 20.x도 호환 |
| npm | 패키지 관리 | O | 11.6.2 | -- |
| psql | DB 직접 접근 (디버깅) | X | -- | Docker 컨테이너 내부에서 사용 가능 (`docker compose exec db psql`) |

**Missing dependencies with no fallback:** 없음

**Missing dependencies with fallback:**
- psql: 로컬 미설치이나, `docker compose exec db psql -U slw_user -d slw` 명령으로 컨테이너 내부 psql 사용 가능

## State of the Art

| 이전 방식 | 현재 방식 | 변경 시점 | 영향 |
|-----------|-----------|-----------|------|
| Express 4 (NestJS 10) | Express 5 (NestJS 11) | 2025-03 | NestJS 11부터 Express 5가 기본. 라우팅 변경 (path-to-regexp v8) |
| docker-compose.yml (v1) | compose.yaml (v2) | 2023+ | Compose v2가 Docker CLI에 통합. 둘 다 지원되지만 v2 형식 권장 |
| TypeScript 5.x | TypeScript 6.0 | 2026-03 | NestJS 11은 아직 5.x 기준. 6.0 호환성 검증 전까지 5.7.x 유지 |

**Deprecated/outdated:**
- `docker-compose` (하이픈 포함) 명령어: `docker compose` (공백)으로 대체됨
- NestJS 10의 `@nestjs/platform-express`는 Express 4 기반이었으나 11에서 Express 5로 업그레이드

## Open Questions

1. **마이그레이션 실행 시점**
   - 알고 있는 것: npm script로 수동 실행 방식이 학습에 적합 (D-07, CONTEXT.md specifics 섹션)
   - 불확실한 것: Docker 컨테이너 시작 시 자동 실행할지, 별도 명령으로 수동 실행할지
   - 권장: npm script로 수동 실행 (`npm run migration:run`). Docker entrypoint에서 자동 실행하면 개발 중 의도치 않은 마이그레이션 적용 위험이 있다.

2. **node_modules 볼륨 전략**
   - 알고 있는 것: 호스트와 컨테이너의 node_modules가 충돌할 수 있다 (특히 네이티브 바이너리)
   - 불확실한 것: anonymous volume vs named volume 중 최적 선택
   - 권장: anonymous volume (`/usr/src/app/node_modules`)으로 컨테이너 전용 node_modules 유지. 호스트에서도 `npm install`을 별도로 실행하여 IDE 지원(타입 체크, 자동완성) 확보.

## Sources

### Primary (HIGH confidence)
- [NestJS 공식 문서 - Database](https://docs.nestjs.com/techniques/database) -- Raw SQL + pg Pool 패턴
- [NestJS 공식 문서 - Validation](https://docs.nestjs.com/techniques/validation) -- ValidationPipe 글로벌 설정
- [NestJS 공식 문서 - Interceptors](https://docs.nestjs.com/interceptors) -- Response 매핑 패턴
- [NestJS 공식 문서 - Exception Filters](https://docs.nestjs.com/exception-filters) -- 커스텀 필터 패턴
- [node-postgres 공식 문서 - Pooling](https://node-postgres.com/features/pooling) -- Pool 설정, 커넥션 관리
- [node-postgres 공식 문서 - Queries](https://node-postgres.com/features/queries) -- 파라미터 바인딩
- [Docker Compose 공식 문서 - Startup Order](https://docs.docker.com/compose/how-tos/startup-order/) -- healthcheck + depends_on
- npm 레지스트리 (2026-03-30 확인) -- 각 패키지 최신 버전 검증

### Secondary (MEDIUM confidence)
- [NestJS + Docker Compose + PostgreSQL 가이드](https://www.tomray.dev/nestjs-docker-compose-postgres) -- Docker 개발환경 패턴
- [NestJS + Raw SQL PostgreSQL 가이드](https://wanago.io/2022/08/29/api-nestjs-postgresql-raw-sql-queries/) -- Global DatabaseModule 패턴
- [NestJS Docker Hot Reload 예제](https://github.com/TommiCodes/nestjs-local-development-docker-compose-hot-reload) -- 볼륨 마운트 hot reload
- [Docker Compose Health Checks 가이드](https://last9.io/blog/docker-compose-health-checks/) -- pg_isready healthcheck

### Tertiary (LOW confidence)
- 없음

## Metadata

**Confidence breakdown:**
- Standard Stack: HIGH -- npm 레지스트리에서 모든 패키지 버전 직접 확인, 스택 연구에서 검증 완료
- Architecture: HIGH -- NestJS 공식 패턴 + 아키텍처 연구에서 상세 설계 완료, 커뮤니티 표준 패턴
- Pitfalls: HIGH -- PITFALLS.md에서 Phase 1 관련 항목 추출, 공식 문서 + 실무 사례 기반

**Research date:** 2026-03-30
**Valid until:** 2026-04-30 (안정적인 스택, 30일 유효)

---
*Phase: 01-infra-setup*
*Research completed: 2026-03-30*