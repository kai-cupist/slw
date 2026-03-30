---
phase: 02-prompts-submissions
verified: 2026-03-30T14:15:27Z
status: passed
score: 5/5 success criteria verified
---

# Phase 2: 쓰기 주제 및 답안 관리 Verification Report

**Phase Goal:** 사용자가 쓰기 주제를 탐색하고, 답안을 작성/임시저장/제출/삭제하며, 과거 제출 이력을 조회할 수 있는 상태
**Verified:** 2026-03-30T14:15:27Z
**Status:** passed
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths (Success Criteria from ROADMAP.md)

| #   | Truth                                                                                                                | Status   | Evidence                                                                                                                                   |
| --- | -------------------------------------------------------------------------------------------------------------------- | -------- | ------------------------------------------------------------------------------------------------------------------------------------------ |
| 1   | API로 쓰기 주제 목록을 조회하면 난이도와 카테고리가 포함된 주제들이 반환되고, 개별 주제의 상세 내용을 확인할 수 있다 | VERIFIED | GET /prompts 반환값에 category, difficulty 필드 포함, GET /prompts/1 상세 정보 반환 확인, GET /prompts/99999는 404 반환                    |
| 2   | 사용자가 주제에 대해 답안을 작성하고 임시저장한 뒤, 나중에 이어쓰기/수정할 수 있다                                   | VERIFIED | POST /submissions로 draft 생성, PATCH /submissions/:id로 content 수정 성공 확인                                                            |
| 3   | 임시저장된 답안을 최종 제출하면 상태가 draft에서 submitted로 전환되고, 제출된 답안은 soft delete로 삭제할 수 있다    | VERIFIED | PATCH /submissions/:id/submit로 status="submitted" 전환 확인, DELETE /submissions/:id 후 목록에서 사라짐 확인                              |
| 4   | 과거 제출 내역을 페이지네이션된 목록으로 조회할 수 있고, 특정 제출의 상세 내용을 확인할 수 있다                      | VERIFIED | GET /submissions 응답에 items/total/page/limit/totalPages 포함, GET /submissions/:id에 prompt_title/prompt_category/prompt_difficulty 포함 |
| 5   | DB에 시드 데이터(20-30개 주제)가 존재하여 즉시 테스트할 수 있다                                                      | VERIFIED | API 응답에서 total=30 확인, 5개 카테고리 x 6개 = 30개 (카테고리당 3난이도 x 2개)                                                           |

**Score:** 5/5 truths verified

### Required Artifacts

| Artifact                                              | Expected                                    | Status   | Details                                                                             |
| ----------------------------------------------------- | ------------------------------------------- | -------- | ----------------------------------------------------------------------------------- |
| `migrations/001_create_prompts.sql`                   | prompts 테이블 DDL + CHECK + 인덱스         | VERIFIED | CREATE TABLE + chk_difficulty + chk_category + idx 2개                              |
| `migrations/002_create_submissions.sql`               | submissions 테이블 DDL + FK + partial index | VERIFIED | REFERENCES prompts(id), chk_status, deleted_at, WHERE deleted_at IS NULL 3개 인덱스 |
| `migrations/003_seed_prompts.sql`                     | 시드 데이터 INSERT 30개                     | VERIFIED | 5개 카테고리 x 3난이도 x 2개 = 30개 INSERT                                          |
| `server/src/common/guards/user-id.guard.ts`           | X-User-Id 헤더 검증 가드                    | VERIFIED | headers['x-user-id'] 읽기, 빈 문자열 거부, BadRequestException                      |
| `server/src/common/decorators/user-id.decorator.ts`   | X-User-Id 값 추출 데코레이터                | VERIFIED | createParamDecorator, headers['x-user-id'] 반환                                     |
| `server/src/common/dto/pagination.dto.ts`             | 페이지네이션 쿼리 DTO                       | VERIFIED | page=1, limit=10 기본값, @Type/@IsInt/@Min/@Max 검증                                |
| `server/src/common/interfaces/paginated.interface.ts` | 페이지네이션 응답 인터페이스                | VERIFIED | items/total/page/limit/totalPages 필드                                              |
| `server/src/prompts/prompts.repository.ts`            | Raw SQL 주제 조회                           | VERIFIED | findAll(동적 WHERE + paramIndex) + findOneById, this.db.query/queryOne 호출         |
| `server/src/prompts/prompts.service.ts`               | 주제 비즈니스 로직                          | VERIFIED | findAll(페이지네이션) + findOne(NotFoundException)                                  |
| `server/src/prompts/prompts.controller.ts`            | GET /prompts, GET /prompts/:id              | VERIFIED | @Get(), @Get(':id'), ParseIntPipe, UserIdGuard 미적용                               |
| `server/src/prompts/prompts.module.ts`                | Prompts NestJS 모듈                         | VERIFIED | PromptsService exports                                                              |
| `server/src/prompts/dto/get-prompts.dto.ts`           | 필터링 + 페이지네이션 DTO                   | VERIFIED | GetPromptsDto extends PaginationDto, Category/Difficulty enum                       |
| `server/src/submissions/submissions.repository.ts`    | Raw SQL CRUD + 소유권 검증                  | VERIFIED | 7개 메서드, deleted_at IS NULL 전 SELECT, paramIndex, parseInt, JOIN prompts        |
| `server/src/submissions/submissions.service.ts`       | 답안 비즈니스 로직                          | VERIFIED | 6개 메서드, 상태 전환 규칙, 소유권 검증, prompt_id 유효성, 빈 내용 제출 차단        |
| `server/src/submissions/submissions.controller.ts`    | 6개 submissions API 라우트                  | VERIFIED | @UseGuards(UserIdGuard), @UserId(), POST/PATCH/PATCH-submit/DELETE/GET/GET-id       |
| `server/src/submissions/submissions.module.ts`        | Submissions NestJS 모듈                     | VERIFIED | imports: [PromptsModule]                                                            |
| `server/src/submissions/dto/create-submission.dto.ts` | 생성 DTO                                    | VERIFIED | prompt_id 필수, content 선택, @MaxLength(5000)                                      |
| `server/src/submissions/dto/update-submission.dto.ts` | 수정 DTO                                    | VERIFIED | content 필수, @MaxLength(5000)                                                      |
| `server/src/submissions/dto/get-submissions.dto.ts`   | 목록 조회 DTO                               | VERIFIED | extends PaginationDto, SubmissionStatus enum                                        |
| `server/src/app.module.ts`                            | PromptsModule + SubmissionsModule 등록      | VERIFIED | imports 배열에 PromptsModule, SubmissionsModule 포함                                |

### Key Link Verification

| From                         | To                       | Via                           | Status | Details                             |
| ---------------------------- | ------------------------ | ----------------------------- | ------ | ----------------------------------- |
| `submissions.controller.ts`  | `user-id.guard.ts`       | @UseGuards(UserIdGuard)       | WIRED  | 클래스 레벨에 적용, import 확인     |
| `submissions.controller.ts`  | `user-id.decorator.ts`   | @UserId() 파라미터 데코레이터 | WIRED  | 6개 핸들러 모두에서 사용            |
| `submissions.repository.ts`  | `database.service.ts`    | this.db.query/queryOne        | WIRED  | DI 주입, 모든 메서드에서 호출       |
| `submissions.repository.ts`  | submissions 테이블       | deleted_at IS NULL            | WIRED  | 모든 SELECT에 조건 포함             |
| `prompts.repository.ts`      | `database.service.ts`    | this.db.query/queryOne        | WIRED  | DI 주입, findAll + findOneById      |
| `prompts.controller.ts`      | `prompts.service.ts`     | this.promptsService           | WIRED  | findAll + findOne 호출              |
| `prompts.service.ts`         | `prompts.repository.ts`  | this.promptsRepository        | WIRED  | findAll + findOneById 호출          |
| `app.module.ts`              | `prompts.module.ts`      | imports 배열                  | WIRED  | PromptsModule import 확인           |
| `app.module.ts`              | `submissions.module.ts`  | imports 배열                  | WIRED  | SubmissionsModule import 확인       |
| `submissions.module.ts`      | `prompts.module.ts`      | imports: [PromptsModule]      | WIRED  | PromptsService DI로 prompt_id 검증  |
| `submissions.service.ts`     | `prompts.service.ts`     | PromptsService 주입           | WIRED  | create()에서 findOne(promptId) 호출 |
| `002_create_submissions.sql` | `001_create_prompts.sql` | REFERENCES prompts(id) FK     | WIRED  | FK 제약 확인                        |

### Data-Flow Trace (Level 4)

| Artifact                    | Data Variable  | Source                                                     | Produces Real Data     | Status  |
| --------------------------- | -------------- | ---------------------------------------------------------- | ---------------------- | ------- |
| `prompts.controller.ts`     | findAll result | PromptsRepository -> DB query (SELECT FROM prompts)        | Yes (30개 시드 데이터) | FLOWING |
| `prompts.controller.ts`     | findOne result | PromptsRepository -> DB queryOne (SELECT WHERE id=$1)      | Yes                    | FLOWING |
| `submissions.controller.ts` | create result  | SubmissionsRepository -> DB queryOne (INSERT RETURNING)    | Yes                    | FLOWING |
| `submissions.controller.ts` | findAll result | SubmissionsRepository -> DB query (SELECT JOIN prompts)    | Yes                    | FLOWING |
| `submissions.controller.ts` | findOne result | SubmissionsRepository -> DB queryOne (SELECT JOIN prompts) | Yes                    | FLOWING |

### Behavioral Spot-Checks

| Behavior                           | Command                                       | Result                                                   | Status |
| ---------------------------------- | --------------------------------------------- | -------------------------------------------------------- | ------ |
| GET /prompts 페이지네이션          | curl GET /prompts?limit=2                     | total=30, items 2개, totalPages=15                       | PASS   |
| GET /prompts 카테고리 필터링       | curl GET /prompts?category=일기               | total=6, 일기 카테고리만 반환                            | PASS   |
| GET /prompts/:id 상세 조회         | curl GET /prompts/1                           | success=true, 상세 데이터 반환                           | PASS   |
| GET /prompts/99999 404             | curl GET /prompts/99999                       | NOT_FOUND 에러                                           | PASS   |
| POST /submissions X-User-Id 없이   | curl POST /submissions (헤더 없음)            | BAD_REQUEST "X-User-Id 헤더가 필요합니다"                | PASS   |
| POST /submissions 생성             | curl POST /submissions (헤더 포함)            | id=4, status=draft                                       | PASS   |
| PATCH /submissions/:id 수정        | curl PATCH /submissions/4                     | content 변경 확인                                        | PASS   |
| PATCH /submissions/:id/submit 제출 | curl PATCH /submissions/4/submit              | status=submitted                                         | PASS   |
| 이미 제출된 답안 수정 차단         | curl PATCH /submissions/4 (submitted)         | BAD_REQUEST "이미 제출된 답안은 수정할 수 없습니다"      | PASS   |
| 이미 제출된 답안 재제출 차단       | curl PATCH /submissions/4/submit (submitted)  | BAD_REQUEST "이미 제출된 답안입니다"                     | PASS   |
| 소유권 검증                        | curl GET /submissions/4 (다른 userId)         | NOT_FOUND                                                | PASS   |
| GET /submissions 목록              | curl GET /submissions                         | items/total/page/limit/totalPages 포함, prompt 정보 포함 | PASS   |
| GET /submissions/:id 상세          | curl GET /submissions/4                       | prompt_title/prompt_category/prompt_difficulty 포함      | PASS   |
| DELETE soft delete                 | curl DELETE /submissions/4                    | deleted=true, 이후 목록에서 사라짐                       | PASS   |
| 빈 내용 제출 차단                  | curl PATCH /submissions/5/submit (빈 content) | BAD_REQUEST "내용이 비어있는 답안은 제출할 수 없습니다"  | PASS   |
| 잘못된 prompt_id                   | curl POST /submissions (prompt_id=99999)      | BAD_REQUEST "유효하지 않은 주제입니다"                   | PASS   |

### Requirements Coverage

| Requirement | Source Plan | Description                                                        | Status    | Evidence                                          |
| ----------- | ----------- | ------------------------------------------------------------------ | --------- | ------------------------------------------------- |
| PROMPT-01   | 02-02       | 사용자가 쓰기 주제 목록을 조회할 수 있다                           | SATISFIED | GET /prompts 동작 확인, 페이지네이션+필터링 포함  |
| PROMPT-02   | 02-02       | 사용자가 쓰기 주제의 상세 내용을 확인할 수 있다                    | SATISFIED | GET /prompts/:id 동작 확인, 404 처리 포함         |
| PROMPT-03   | 02-01       | 주제에 난이도(초급/중급/고급)와 카테고리가 표시된다                | SATISFIED | CHECK constraint + Difficulty/Category enum 정의  |
| PROMPT-04   | 02-01       | DB에 시드 데이터(20-30개 주제)가 포함된다                          | SATISFIED | 30개 시드 데이터 확인 (5 카테고리 x 3 난이도 x 2) |
| SUB-01      | 02-03       | 사용자가 주제에 대해 답안을 작성하고 임시저장할 수 있다            | SATISFIED | POST /submissions로 draft 생성 확인               |
| SUB-02      | 02-03       | 사용자가 임시저장된 답안을 이어쓰기/수정할 수 있다                 | SATISFIED | PATCH /submissions/:id로 content 수정 확인        |
| SUB-03      | 02-03       | 사용자가 답안을 최종 제출할 수 있다 (draft -> submitted 상태 전환) | SATISFIED | PATCH /submissions/:id/submit로 상태 전환 확인    |
| SUB-04      | 02-03       | 사용자가 제출한 답안을 삭제할 수 있다 (soft delete)                | SATISFIED | DELETE /submissions/:id로 soft delete 확인        |
| SUB-05      | 02-03       | 사용자가 과거 제출 내역을 목록으로 조회할 수 있다 (페이지네이션)   | SATISFIED | GET /submissions 페이지네이션 응답 확인           |
| SUB-06      | 02-03       | 사용자가 특정 제출의 상세 내용을 확인할 수 있다                    | SATISFIED | GET /submissions/:id 상세(prompt 정보 JOIN) 확인  |

### Anti-Patterns Found

| File   | Line | Pattern | Severity | Impact |
| ------ | ---- | ------- | -------- | ------ |
| (없음) | -    | -       | -        | -      |

검사 대상: prompts/_, submissions/_, common/guards, common/decorators, common/dto, common/interfaces, migrations/\*
TODO/FIXME/PLACEHOLDER/빈 구현/하드코딩 빈 값 -- 모두 해당 없음

### Human Verification Required

### 1. Swagger UI 문서화 확인

**Test:** 브라우저에서 http://localhost:3000/api-docs 접속
**Expected:** prompts/submissions 태그로 API가 문서화되어 있고, X-User-Id 헤더 필드가 submissions 섹션에 표시된다
**Why human:** Swagger UI 렌더링과 인터랙티브 테스트는 브라우저에서만 확인 가능

### 2. 한국어 카테고리 URL 인코딩 확인

**Test:** Swagger UI에서 category 필터에 한국어 카테고리(일기, 편지 등)를 선택하여 요청
**Expected:** URL 인코딩이 올바르게 처리되어 필터링 결과가 반환된다
**Why human:** Swagger UI의 enum 선택 UI와 URL 인코딩 동작은 브라우저에서 확인 필요

## Gaps Summary

없음. 모든 Success Criteria가 충족되었고, 10개 요구사항(PROMPT-01~04, SUB-01~06)이 모두 만족되었다. 16개 behavioral spot-check가 전부 통과했으며, anti-pattern이 발견되지 않았다. TypeScript 컴파일도 에러 없이 성공한다.

---

_Verified: 2026-03-30T14:15:27Z_
_Verifier: Claude (gsd-verifier)_
