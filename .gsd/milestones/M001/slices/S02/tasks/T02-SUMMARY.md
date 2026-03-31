---
id: T02
parent: S02
milestone: M001
provides:
  - GET /prompts 목록 API (필터링 + 페이지네이션)
  - GET /prompts/:id 상세 API (404 처리)
  - PromptsModule (Repository + Service + Controller)
  - GetPromptsDto (category/difficulty 필터)
  - Prompt 인터페이스
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 2min
verification_result: passed
completed_at: 2026-03-30
blocker_discovered: false
---
# T02: 02-prompts-submissions 02

**# Phase 02 Plan 02: 쓰기 주제 API Summary**

## What Happened

# Phase 02 Plan 02: 쓰기 주제 API Summary

**Raw SQL 기반 Repository-Service-Controller 계층으로 GET /prompts (필터링/페이지네이션) + GET /prompts/:id (상세/404) API 구현**

## Performance

- **Duration:** 2min
- **Started:** 2026-03-30T14:01:15Z
- **Completed:** 2026-03-30T14:03:39Z
- **Tasks:** 2
- **Files modified:** 6

## Accomplishments

- PromptsRepository: Raw SQL로 동적 WHERE 절 구성 (paramIndex 카운터 방식), COUNT/SELECT 동일 WHERE 공유
- PromptsService: 페이지네이션 계산 (offset/limit/totalPages), 404 NotFoundException 처리
- PromptsController: GET /prompts (필터링+페이지네이션), GET /prompts/:id (상세), Swagger 문서화
- GetPromptsDto: PaginationDto 상속, Category/Difficulty enum으로 타입 안전한 필터링

## Task Commits

Each task was committed atomically:

1. **Task 1: PromptsRepository + PromptsService + GetPromptsDto 구현** - `5b46053` (feat)
2. **Task 2: PromptsController + PromptsModule + AppModule 등록** - `ddbc18d` (feat)

## Files Created/Modified

- `server/src/prompts/dto/get-prompts.dto.ts` - Category/Difficulty enum + PaginationDto 상속 필터 DTO
- `server/src/prompts/prompts.repository.ts` - Prompt 인터페이스 + Raw SQL 쿼리 (findAll, findOneById)
- `server/src/prompts/prompts.service.ts` - 페이지네이션 계산 + 404 처리 비즈니스 로직
- `server/src/prompts/prompts.controller.ts` - GET /prompts, GET /prompts/:id 라우트 + Swagger
- `server/src/prompts/prompts.module.ts` - NestJS 모듈 등록, PromptsService export
- `server/src/app.module.ts` - PromptsModule import 추가

## Decisions Made

- 동적 WHERE 절에 paramIndex 카운터 방식 사용 - SQL Injection 방지하면서 유연한 필터 조합 지원
- PromptsService를 module exports에 포함 - 향후 SubmissionsModule에서 주제 존재 확인에 활용
- 주제 API에 UserIdGuard 미적용 - 공개 데이터이므로 인증 없이 접근 가능

## Deviations from Plan

None - plan executed exactly as written.

## Issues Encountered

- 워크트리 환경에서 node_modules가 없어 npm install 필요 - 설치 후 TypeScript 컴파일 정상 통과
- Docker 컨테이너가 메인 소스를 마운트하므로 워크트리 코드 반영 불가 - TypeScript 컴파일로 정적 검증 완료, 런타임 검증은 머지 후 수행

## User Setup Required

None - no external service configuration required.

## Next Phase Readiness

- Prompts 읽기 전용 API 완성 - 사용자가 주제를 탐색하고 선택할 수 있음
- PromptsService가 export되어 SubmissionsModule에서 주제 존재 확인 가능
- 다음 플랜(02-03)에서 submissions CRUD API 구현 시 PromptsModule 의존성 활용 가능

## Self-Check: PASSED

- 6/6 파일 존재 확인 완료
- 2/2 커밋 해시 확인 완료 (5b46053, ddbc18d)

---

_Phase: 02-prompts-submissions_
_Completed: 2026-03-30_
