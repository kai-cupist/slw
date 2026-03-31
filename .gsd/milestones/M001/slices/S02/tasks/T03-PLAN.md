# T03: 02-prompts-submissions 03

**Slice:** S02 — **Milestone:** M001

## Description

답안(submissions) CRUD API 6개 엔드포인트를 구현한다. 답안 생성/임시저장, 수정/이어쓰기, 최종 제출(draft->submitted), soft delete, 목록 조회(페이지네이션), 상세 조회를 제공한다. X-User-Id 헤더로 사용자를 식별하고 소유권을 검증한다.

Purpose: 사용자가 쓰기 답안을 전체 라이프사이클(생성-수정-제출-삭제-조회)로 관리할 수 있는 API를 제공한다.
Output: SubmissionsModule (Repository + Service + Controller + DTO 3개) + AppModule 등록

## Must-Haves

- [ ] "사용자가 주제에 대해 답안을 생성하고 임시저장할 수 있다 (POST /submissions)"
- [ ] "사용자가 임시저장된 답안을 수정할 수 있다 (PATCH /submissions/:id)"
- [ ] "사용자가 답안을 최종 제출할 수 있다 (PATCH /submissions/:id/submit, draft->submitted)"
- [ ] "이미 제출된 답안은 수정/재제출이 불가능하다 (400 에러)"
- [ ] "사용자가 답안을 soft delete할 수 있다 (DELETE /submissions/:id)"
- [ ] "사용자가 자신의 제출 이력을 페이지네이션으로 조회할 수 있다 (GET /submissions)"
- [ ] "사용자가 특정 제출의 상세 내용을 확인할 수 있다 (GET /submissions/:id)"
- [ ] "X-User-Id 없이 submissions API에 접근하면 400 에러가 발생한다"
- [ ] "다른 사용자의 답안에 접근할 수 없다 (소유권 검증)"

## Files

- `server/src/submissions/submissions.module.ts`
- `server/src/submissions/submissions.controller.ts`
- `server/src/submissions/submissions.service.ts`
- `server/src/submissions/submissions.repository.ts`
- `server/src/submissions/dto/create-submission.dto.ts`
- `server/src/submissions/dto/update-submission.dto.ts`
- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/app.module.ts`
