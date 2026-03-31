---
id: T03
parent: S02
milestone: M001
provides:
  - SubmissionsModule (Repository + Service + Controller)
  - 6개 submissions API 엔드포인트 (POST, PATCH, PATCH/submit, DELETE, GET, GET/:id)
  - 답안 상태 전환 규칙 (draft -> submitted 단방향)
  - 소유권 검증 (userId 기반)
  - soft delete 패턴
requires: []
affects: []
key_files: []
key_decisions: []
patterns_established: []
observability_surfaces: []
drill_down_paths: []
duration: 4min
verification_result: passed
completed_at: 2026-03-30
blocker_discovered: false
---
# T03: 02-prompts-submissions 03

**# Phase 02 Plan 03: Submissions CRUD API Summary**

## What Happened

# Phase 02 Plan 03: Submissions CRUD API Summary

**Raw SQL 기반 답안(submissions) 6개 CRUD API - 생성/수정/제출/삭제/목록/상세 + 상태 전환 규칙 + 소유권 검증**

## Performance

- **Duration:** 4min
- **Started:** 2026-03-30T14:05:57Z
- **Completed:** 2026-03-30T14:10:21Z
- **Tasks:** 2
- **Files modified:** 8

## Accomplishments

- SubmissionsRepository 7개 메서드: Raw SQL로 INSERT/SELECT/UPDATE + JOIN prompts + 동적 WHERE + 페이지네이션 구현
- SubmissionsService 6개 메서드: 상태 전환 규칙(draft->submitted 단방향), 소유권 검증, prompt_id 유효성 검증, 빈 내용 제출 차단
- SubmissionsController 6개 엔드포인트: @UseGuards(UserIdGuard) 클래스 레벨 적용, @UserId() 파라미터 데코레이터, Swagger 문서화
- 14개 API 시나리오 검증 통과 (생성-수정-제출-삭제-조회-소유권-에러 전체 라이프사이클)

## Task Commits

각 태스크별 원자적 커밋:

1. **Task 1: SubmissionsRepository + SubmissionsService + DTO 3개 구현** - `203d5dd` (feat)
2. **Task 2: SubmissionsController + SubmissionsModule + AppModule 등록 및 API 동작 검증** - `2d59e5b` (feat)

## Files Created/Modified

- `server/src/submissions/submissions.repository.ts` - Raw SQL CRUD 7개 메서드 (Submission, SubmissionWithPrompt 인터페이스 포함)
- `server/src/submissions/submissions.service.ts` - 비즈니스 로직 6개 메서드 (상태 전환, 소유권, prompt_id 검증)
- `server/src/submissions/submissions.controller.ts` - 6개 API 엔드포인트 (UserIdGuard, UserId 데코레이터, Swagger)
- `server/src/submissions/submissions.module.ts` - NestJS 모듈 (PromptsModule import)
- `server/src/submissions/dto/create-submission.dto.ts` - 생성 DTO (prompt_id 필수, content 선택, 5000자 제한)
- `server/src/submissions/dto/update-submission.dto.ts` - 수정 DTO (content 필수, 5000자 제한)
- `server/src/submissions/dto/get-submissions.dto.ts` - 목록 DTO (PaginationDto 상속, SubmissionStatus enum)
- `server/src/app.module.ts` - SubmissionsModule 추가

## Decisions Made

- PromptsService를 SubmissionsModule에서 주입하여 prompt_id 유효성 검증 - PromptsService.findOne()의 NotFoundException을 catch하여 BadRequestException('유효하지 않은 주제입니다')으로 변환
- DELETE 응답은 { deleted: true }를 반환하여 ResponseInterceptor가 { success: true, data: { deleted: true } }로 래핑
- submitted 상태 답안의 수정/재제출을 별도 에러 메시지로 구분 ("이미 제출된 답안은 수정할 수 없습니다" vs "이미 제출된 답안입니다")

## Deviations from Plan

None - 계획대로 정확히 실행됨

## Issues Encountered

- Docker worktree에서 빌드가 실패하여 메인 프로젝트의 Docker 컨테이너에 파일을 복사하여 API 검증을 수행함 (docker-credential-desktop 이슈)

## User Setup Required

없음 - 외부 서비스 설정 불필요

## Next Phase Readiness

- 답안 전체 라이프사이클(생성-수정-제출-삭제-조회) API가 완성되어 Phase 3 AI 평가 연동 준비 완료
- submitted 상태의 답안을 Phase 3에서 AI 평가 API로 전달하는 흐름을 구현할 수 있음
- Submission 인터페이스와 SubmissionWithPrompt 인터페이스를 Phase 3에서 활용 가능

## Self-Check: PASSED

- 8개 파일 모두 존재 확인
- 2개 커밋 모두 존재 확인 (203d5dd, 2d59e5b)

---

_Phase: 02-prompts-submissions_
_Completed: 2026-03-30_
