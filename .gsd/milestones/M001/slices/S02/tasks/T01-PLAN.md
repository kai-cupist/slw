# T01: 02-prompts-submissions 01

**Slice:** S02 — **Milestone:** M001

## Description

Phase 2의 DB 스키마(prompts, submissions 테이블)와 시드 데이터를 마이그레이션 SQL로 생성하고,
후속 Plan에서 사용할 공통 인프라(X-User-Id 가드/데코레이터, 페이지네이션 DTO/인터페이스)를 구축한다.

Purpose: Phase 2의 모든 API 엔드포인트가 의존하는 DB 테이블과 공통 코드를 선행 구축한다.
Output: 마이그레이션 SQL 3개 + 공통 인프라 TypeScript 4개

## Must-Haves

- [ ] "prompts 테이블이 DB에 존재하고, category와 difficulty에 CHECK constraint가 적용되어 있다"
- [ ] "submissions 테이블이 DB에 존재하고, prompt_id FK, status CHECK, deleted_at 컬럼이 있다"
- [ ] "시드 데이터 25-30개 주제가 5개 카테고리 x 3단계 난이도로 DB에 삽입되어 있다"
- [ ] "X-User-Id 헤더가 없는 요청은 400 에러로 거부된다"
- [ ] "페이지네이션 DTO가 page/limit 쿼리 파라미터를 타입 변환 및 검증한다"

## Files

- `migrations/001_create_prompts.sql`
- `migrations/002_create_submissions.sql`
- `migrations/003_seed_prompts.sql`
- `server/src/common/guards/user-id.guard.ts`
- `server/src/common/decorators/user-id.decorator.ts`
- `server/src/common/dto/pagination.dto.ts`
- `server/src/common/interfaces/paginated.interface.ts`
