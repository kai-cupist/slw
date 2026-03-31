# T02: 02-prompts-submissions 02

**Slice:** S02 — **Milestone:** M001

## Description

쓰기 주제(prompts) 읽기 전용 API를 구현한다. GET /prompts (목록, 필터링, 페이지네이션)와 GET /prompts/:id (상세) 두 엔드포인트를 제공한다.

Purpose: 사용자가 쓰기 주제를 탐색하고 선택할 수 있는 API를 제공한다.
Output: PromptsModule (Repository + Service + Controller + DTO) + AppModule 등록

## Must-Haves

- [ ] "GET /prompts 요청 시 주제 목록이 페이지네이션되어 반환된다"
- [ ] "GET /prompts?category=일기&difficulty=beginner로 필터링이 가능하다"
- [ ] "GET /prompts/:id 요청 시 해당 주제의 상세 정보가 반환된다"
- [ ] "존재하지 않는 주제 ID로 요청하면 404 에러가 반환된다"
- [ ] "주제 API에는 X-User-Id 가드가 적용되지 않는다 (공개 데이터)"

## Files

- `server/src/prompts/prompts.module.ts`
- `server/src/prompts/prompts.controller.ts`
- `server/src/prompts/prompts.service.ts`
- `server/src/prompts/prompts.repository.ts`
- `server/src/prompts/dto/get-prompts.dto.ts`
- `server/src/app.module.ts`
