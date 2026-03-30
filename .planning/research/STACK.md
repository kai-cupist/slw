# 기술 스택

**프로젝트:** 말하기 듣기 쓰기 (v1 - 쓰기 평가)
**조사일:** 2026-03-30
**전체 신뢰도:** HIGH

## 권장 스택

### 런타임 및 언어

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| Node.js | 22.x LTS | 서버/클라이언트 런타임 | Active LTS (2027-04 지원 종료). NestJS 11은 Node 20+를 요구하며, 22는 안정적이고 장기 지원됨. 24.x LTS도 있으나 최신이라 생태계 호환성 측면에서 22가 안전 |
| TypeScript | 5.7.x | 정적 타입 시스템 | NestJS 11과 Expo SDK 55 모두 TypeScript를 기본 지원. 6.0이 최신이나, NestJS/Expo 공식 호환성이 5.x 계열에서 충분히 검증됨. 프레임워크 호환성 확인 후 6.0 도입 가능 |

> **TypeScript 6.0 참고:** 2026-03-06 릴리스. JS 기반 마지막 버전이며, 7.0부터 Go로 재작성 예정. 프레임워크 생태계 호환성이 확인되면 업그레이드 고려. 신뢰도: MEDIUM

### 백엔드 프레임워크

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| @nestjs/core | ^11.1.17 | 핵심 프레임워크 | 프로젝트 브리프에서 확정. 모듈/서비스/컨트롤러 패턴으로 백엔드 아키텍처 학습에 최적. v11은 개선된 로깅, Express 5 지원 등 포함 |
| @nestjs/common | ^11.1.17 | 데코레이터, 파이프, 가드 등 | @nestjs/core와 동일 버전 유지 필수 |
| @nestjs/platform-express | ^11.1.17 | HTTP 어댑터 (Express 5) | NestJS 11의 기본 HTTP 플랫폼. Express 5.2.x 기반 |
| @nestjs/config | ^4.0.3 | 환경변수 관리 | .env 파일에서 환경변수를 로드하고 DI로 주입. dotenv 래핑하여 NestJS 모듈 패턴과 통합 |
| @nestjs/swagger | ^11.2.6 | API 문서화 | REST API 학습 시 Swagger UI로 즉시 테스트 가능. 데코레이터 기반으로 코드와 문서가 동기화됨 |

> **@nestjs/axios 미사용 이유:** Groq SDK가 자체 HTTP 클라이언트를 내장하고 있어, 별도의 HTTP 모듈이 불필요. 신뢰도: HIGH

### 데이터베이스

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| PostgreSQL | 16.11 | 메인 데이터베이스 | 프로젝트 브리프에서 확정. JSON 타입 지원으로 AI 평가 결과 저장에 적합 |
| pg (node-postgres) | ^8.20.0 | PostgreSQL 클라이언트 | Raw SQL 실행을 위한 사실상의 표준 라이브러리. Pool 기반 커넥션 관리 제공. ORM 없이 SQL을 직접 다루는 이 프로젝트의 핵심 라이브러리 |
| @types/pg | latest | pg 타입 정의 | TypeScript에서 pg 사용 시 타입 안전성 제공 |

> **ORM 사용 금지 (프로젝트 제약):** TypeORM, Prisma, Drizzle 등 모든 ORM을 사용하지 않는다. pg 라이브러리의 Pool.query()로 Raw SQL을 직접 작성하여 SQL 동작 방식을 체득한다.

### DB 접근 패턴 (NestJS + pg)

```typescript
// 커스텀 프로바이더 패턴 — NestJS DI에 pg Pool을 등록
// database.module.ts
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Pool } from 'pg';

export const PG_POOL = 'PG_POOL';

@Module({
  providers: [
    {
      provide: PG_POOL,
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => {
        return new Pool({
          host: configService.get('DB_HOST'),
          port: configService.get('DB_PORT'),
          database: configService.get('DB_NAME'),
          user: configService.get('DB_USER'),
          password: configService.get('DB_PASSWORD'),
          max: 10,
          idleTimeoutMillis: 30000,
          connectionTimeoutMillis: 5000,
        });
      },
    },
  ],
  exports: [PG_POOL],
})
export class DatabaseModule {}
```

```typescript
// 서비스에서 사용
import { Inject, Injectable } from '@nestjs/common';
import { Pool } from 'pg';
import { PG_POOL } from './database.module';

@Injectable()
export class PromptService {
  constructor(@Inject(PG_POOL) private readonly pool: Pool) {}

  async findById(id: number) {
    const { rows } = await this.pool.query(
      'SELECT * FROM prompts WHERE id = $1',
      [id],
    );
    return rows[0];
  }
}
```

### AI 평가 (LLM API)

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| groq-sdk | ^1.1.1 | Groq API 클라이언트 | 프로젝트 브리프에서 1순위로 확정. 공식 TypeScript SDK로 타입 안전한 API 호출 제공. OpenAI SDK 호환 인터페이스 |

#### Groq 무료 티어 상세 (2026년 3월 기준)

| 모델 | RPM | RPD | TPM | TPD | 용도 |
|------|-----|-----|-----|-----|------|
| llama-3.3-70b-versatile | 30 | 1,000 | 12,000 | 100,000 | **1순위: 쓰기 평가용.** 70B 파라미터로 한국어 문법/논리/표현력 평가에 충분한 성능 |
| llama-4-scout-17b | 30 | 1,000 | 30,000 | 500,000 | 2순위 대체: 토큰 한도가 높아 긴 텍스트 평가에 유리 |
| llama-3.1-8b-instant | 30 | 14,400 | 6,000 | 500,000 | 개발/테스트용: RPD가 높아 빠른 반복 개발에 적합 |

> **모델 선택 전략:** 개발 중에는 llama-3.1-8b-instant(RPD 14,400)로 빠르게 반복하고, 프로덕션에서는 llama-3.3-70b-versatile(RPD 1,000)로 품질 높은 평가를 제공한다. 신뢰도: HIGH

#### 폴백 API 후보

| 순위 | 서비스 | 무료 한도 | 비고 |
|------|--------|-----------|------|
| 2순위 | Google Gemini API | 일일 250 요청 | Gemini 2.5 Flash, 한국어 품질 양호 |
| 3순위 | OpenRouter | 일일 200 요청 | 29개 무료 모델, 다양한 선택지 |
| 4순위 | Ollama (로컬) | 무제한 | Docker Compose에 추가 가능, GPU 필요 |

### 프론트엔드 (모바일)

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| expo | ~55.0.9 | React Native 개발 플랫폼 | 프로젝트 브리프에서 확정. React Native 0.83 + New Architecture 기반. 빌드/배포 파이프라인 통합 |
| expo-router | ~55.0.8 | 파일 기반 라우팅 | React Navigation 위에 구축된 파일 시스템 기반 네비게이션. 직관적인 라우팅 패턴 |
| react-native | 0.83.x | 네이티브 UI 렌더링 | Expo SDK 55에 포함. New Architecture 전용 (Old Architecture 비활성화 불가) |
| react | 19.2.x | UI 라이브러리 | Expo SDK 55에 포함 |

#### 프론트엔드 상태 관리

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| zustand | ^5.0.12 | 클라이언트 상태 관리 | Provider 없이 훅 기반으로 동작하여 보일러플레이트 최소화. 이 앱의 상태(현재 프롬프트, 작성 중인 답안, 평가 결과)는 단순하므로 Redux의 복잡성이 불필요. 번들 사이즈도 작아 모바일에 적합 |

> **Redux 미사용 이유:** v1의 상태 구조가 단순(프롬프트 목록, 작성 중 답안, 평가 결과)하여 Redux Toolkit의 action/reducer/slice 패턴은 과도함. 신뢰도: HIGH

#### 프론트엔드 서버 상태 (API 데이터)

v1에서는 서버 상태 관리 라이브러리(React Query/TanStack Query)를 **도입하지 않는다.**

- **이유:** 학습 목적이므로 fetch/useEffect 패턴으로 API 호출의 기본 동작(로딩, 에러, 캐시)을 직접 구현하여 이해한다.
- **시기:** v2에서 API 엔드포인트가 늘어나면 TanStack Query 도입을 고려한다.

### 검증 (Validation)

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| class-validator | ^0.15.1 | DTO 검증 | NestJS ValidationPipe와 통합. 데코레이터로 요청 데이터 검증 규칙을 선언적으로 정의. 주간 600만+ 다운로드의 표준 라이브러리 |
| class-transformer | ^0.5.1 | 객체 변환 | plain object를 class instance로 변환하여 class-validator가 동작하도록 지원. NestJS 파이프라인의 필수 요소 |

> **편의 라이브러리 도입 근거:** class-validator/class-transformer는 NestJS의 ValidationPipe가 내부적으로 의존하는 라이브러리로, NestJS의 검증 파이프라인을 직접 구현하는 것보다 프레임워크 패턴을 학습하는 것이 목적에 부합. 신뢰도: HIGH

### 인프라

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| Docker Compose | v2 (최신) | 로컬 개발 환경 | 프로젝트 브리프에서 확정. PostgreSQL + NestJS 앱을 하나의 명령으로 실행/종료 |
| postgres (Docker 이미지) | 16.11-alpine | DB 컨테이너 | alpine 이미지로 용량 최소화. 프로젝트에서 확정한 PostgreSQL 16.11 사용 |

### 테스트

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| jest | ^29.x | 단위/통합 테스트 | NestJS CLI가 기본 생성하는 테스트 프레임워크. NestJS 공식 문서의 모든 테스트 예제가 Jest 기반. 학습 목적에서는 프레임워크 기본 설정을 따르는 것이 효율적 |
| @nestjs/testing | ^11.1.17 | NestJS 테스트 유틸리티 | Test.createTestingModule() 등 NestJS 모듈 테스트에 필요한 유틸리티 |
| supertest | ^7.x | E2E 테스트 | HTTP 요청 테스트를 위한 사실상의 표준. NestJS 공식 E2E 테스트 가이드에서 사용 |

> **Vitest 미사용 이유:** Vitest가 2026년 기준으로 성능이 우수하나, NestJS는 데코레이터 메타데이터에 의존하여 ESBuild/SWC 설정이 복잡해질 수 있음. 학습 프로젝트에서는 NestJS 기본 설정(Jest)을 따르는 것이 디버깅 비용을 줄임. 신뢰도: MEDIUM

### 개발 도구

| 기술 | 버전 | 용도 | 선택 이유 |
|------|------|------|-----------|
| @nestjs/cli | latest | 프로젝트 스캐폴딩 | nest new, nest generate로 모듈/서비스/컨트롤러 생성. 프로젝트 구조를 일관되게 유지 |
| eslint | ^9.x | 코드 품질 | NestJS CLI가 기본 설정하는 린터. flat config 기반 |
| prettier | ^3.x | 코드 포매팅 | NestJS CLI 기본 포함. 코드 스타일 자동 통일 |

## 명시적으로 사용하지 않는 것

| 카테고리 | 제외 대상 | 미사용 이유 |
|----------|-----------|-------------|
| ORM | TypeORM, Prisma, Drizzle, Sequelize | **프로젝트 핵심 제약.** SQL 동작 방식을 직접 체득하기 위해 Raw SQL만 사용 |
| 마이그레이션 도구 | node-pg-migrate, knex migrate | **프로젝트 핵심 제약.** 수동 SQL 스크립트로 마이그레이션 관리 |
| 서버 상태 관리 | TanStack Query, SWR | 학습 목적으로 fetch/useEffect 패턴을 직접 구현. v2에서 도입 고려 |
| HTTP 클라이언트 | @nestjs/axios, axios | Groq SDK가 HTTP 클라이언트를 내장하고 있어 불필요 |
| LangChain | @langchain/groq | 단순한 LLM API 호출에 추상화 레이어를 추가하는 것은 과도. groq-sdk로 직접 호출이 학습에 적합 |
| CSS-in-JS | styled-components, emotion | React Native의 StyleSheet API를 직접 사용. 학습 목적에 부합 |
| 폼 라이브러리 | react-hook-form, formik | v1의 폼은 텍스트 입력 하나뿐이므로 라이브러리 도입이 과도 |

## 대안 비교

| 카테고리 | 선택 | 대안 | 미선택 이유 |
|----------|------|------|-------------|
| DB 클라이언트 | pg | postgres.js (slonik) | pg가 NestJS 생태계에서 가장 널리 사용되고 문서/예제가 풍부. postgres.js는 Tagged Template 기반이라 학습 곡선 있음 |
| 상태 관리 | zustand | Redux Toolkit | v1 앱의 상태가 단순하여 Redux의 보일러플레이트가 과도. Zustand의 훅 기반 API가 직관적 |
| 상태 관리 | zustand | Jotai | Jotai의 원자적 상태 모델은 복잡한 상태 의존성에 유리하나, 이 앱의 상태 구조에서는 Zustand의 store 패턴이 더 명확 |
| 테스트 | Jest | Vitest | Vitest가 성능 면에서 우수하나, NestJS 데코레이터/메타데이터와의 호환성 설정이 추가 필요. 학습 프로젝트에서는 프레임워크 기본 설정 우선 |
| AI SDK | groq-sdk | @ai-sdk/groq (Vercel) | Vercel AI SDK는 스트리밍 UI 등 고급 기능을 제공하나, 이 프로젝트에서는 단순 요청/응답이면 충분. groq-sdk가 더 가볍고 직접적 |
| AI 모델 | Groq (Llama 3.3 70B) | Google Gemini | Groq 무료 티어의 RPD(1,000)가 Gemini(250)보다 4배 많고, 추론 속도가 빠름 |

## 설치 명령어

```bash
# 1. NestJS 프로젝트 생성
npx @nestjs/cli new slw-api --strict

# 2. 백엔드 핵심 의존성
npm install pg @nestjs/config @nestjs/swagger class-validator class-transformer groq-sdk

# 3. 백엔드 개발 의존성
npm install -D @types/pg

# 4. Expo 프로젝트 생성
npx create-expo-app slw-app --template tabs

# 5. 프론트엔드 의존성
npx expo install zustand
```

## 버전 호환성 매트릭스

| 구성 요소 | 최소 요구 | 권장 | 비고 |
|-----------|-----------|------|------|
| Node.js | 20.x | 22.x LTS | NestJS 11은 20+, Expo SDK 55는 20.19.4+ |
| npm | 10.x | 최신 | Node.js 22에 포함된 버전 |
| PostgreSQL | 16 | 16.11 | 프로젝트 브리프에서 확정 |
| Docker Compose | v2 | 최신 | compose.yaml 형식 사용 |

## 신뢰도 평가

| 영역 | 신뢰도 | 근거 |
|------|--------|------|
| NestJS 11 + pg | HIGH | npm 레지스트리에서 버전 확인, 공식 문서에서 Raw SQL 패턴 검증 |
| Groq 무료 티어 | HIGH | 공식 문서(console.groq.com/docs/rate-limits)에서 한도 확인 |
| Expo SDK 55 | HIGH | npm 레지스트리에서 버전 확인, 공식 변경로그에서 React Native 0.83 확인 |
| Zustand 5.x | HIGH | npm 레지스트리에서 버전 확인, 다수의 2026년 비교 분석 글에서 모바일 앱 권장 확인 |
| TypeScript 버전 | MEDIUM | 6.0이 최신이나 NestJS/Expo와의 호환성은 추가 검증 필요. 5.7.x가 안전한 선택 |
| Jest vs Vitest | MEDIUM | NestJS 기본이 Jest이나, Vitest로 전환하는 프로젝트도 증가 중. 학습 목적으로는 Jest가 적합 |

## 출처

- [NestJS 11 공식 발표](https://trilon.io/blog/announcing-nestjs-11-whats-new)
- [NestJS 공식 문서 - Database](https://docs.nestjs.com/techniques/database)
- [pg (node-postgres) npm](https://www.npmjs.com/package/pg) - v8.20.0
- [Expo SDK 55 변경로그](https://expo.dev/changelog/sdk-55)
- [Groq Rate Limits 공식 문서](https://console.groq.com/docs/rate-limits)
- [groq-sdk npm](https://www.npmjs.com/package/groq-sdk) - v1.1.1
- [Zustand npm](https://www.npmjs.com/package/zustand) - v5.0.12
- [NestJS + Raw SQL 가이드](https://wanago.io/2022/08/29/api-nestjs-postgresql-raw-sql-queries/)
- [Node.js 릴리스 일정](https://nodejs.org/en/about/previous-releases)
- [TypeScript 6.0 발표](https://devblogs.microsoft.com/typescript/announcing-typescript-6-0/)
- [@nestjs/swagger npm](https://www.npmjs.com/package/@nestjs/swagger) - v11.2.6
- [@nestjs/config npm](https://www.npmjs.com/package/@nestjs/config) - v4.0.3
- [class-validator npm](https://www.npmjs.com/package/class-validator) - v0.15.1
