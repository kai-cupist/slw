---
estimated_steps: 5
estimated_files: 3
skills_used: []
---

# T01: 서버 GetSubmissionsDto에 promptId 필터 추가 및 Repository/Service 연결

서버 `GET /submissions` 엔드포인트가 `promptId` 쿼리 파라미터를 받아 특정 프롬프트의 답안만 필터링할 수 있도록 DTO → Repository → Service 3개 파일을 수정한다.

1. `GetSubmissionsDto`에 `@ApiPropertyOptional`, `@IsOptional()`, `@Type(() => Number)`, `@IsInt()` 데코레이터와 함께 `promptId?: number` 필드를 추가한다. `@Type(() => Number)`는 쿼리 파라미터 문자열→숫자 변환을 위해 필수 (기존 PaginationDto의 page/limit 패턴 동일하게 적용).
2. `SubmissionsRepository.findAllByUser` 시그니처의 `filters` 타입에 `promptId?: number`를 추가하고, 동적 WHERE 절 구성 블록에 `if (filters.promptId)` 분기를 추가하여 `s.prompt_id = $${paramIndex++}` 조건을 append한다. `params`에도 `filters.promptId`를 push한다. 기존 `paramIndex` 카운터 패턴을 그대로 따른다.
3. `SubmissionsService.findAll`에서 `submissionsRepository.findAllByUser` 호출 시 `filters`에 `promptId: dto.promptId`를 추가로 전달한다.
4. `cd server && npm run build`로 타입 에러 없이 빌드되는지 확인한다.

## Inputs

- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/submissions/submissions.repository.ts`
- `server/src/submissions/submissions.service.ts`
- `server/src/common/dto/pagination.dto.ts`

## Expected Output

- `server/src/submissions/dto/get-submissions.dto.ts`
- `server/src/submissions/submissions.repository.ts`
- `server/src/submissions/submissions.service.ts`

## Verification

cd server && npm run build 2>&1 | tail -5 && echo 'BUILD OK'
