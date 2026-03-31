---
estimated_steps: 22
estimated_files: 5
skills_used: []
---

# T03: 평가 이력 목록 + 점수 추이 API 구현 및 전체 슬라이스 검증

HIST-01, HIST-02 요구사항을 구현한다.

1. GET /evaluations/history — 사용자의 평가 이력 목록 (페이지네이션)
   - evaluations JOIN submissions JOIN prompts
   - 주제 정보(title, category, difficulty) + 점수 4항목 + total_score + evaluated_at
   - PaginationDto 상속한 GetEvaluationHistoryDto
   - PaginatedResponse<EvaluationHistory> 반환

2. GET /evaluations/scores/trend — 점수 추이
   - 사용자의 평가를 날짜순으로 반환
   - evaluated_at, total_score, grammar_score, logic_score, expression_score, relevance_score
   - 최근 N건 또는 전체 (limit 파라미터)
   - 날짜별 그룹핑은 프론트엔드 책임, API는 raw 데이터 반환

구현할 파일:
- `evaluations.repository.ts`에 findHistoryByUser(), findScoreTrendByUser() 메서드 추가
- `evaluations.service.ts`에 getHistory(), getScoreTrend() 메서드 추가
- `evaluations.controller.ts`에 GET /evaluations/history, GET /evaluations/scores/trend 엔드포인트 추가
- `evaluations/dto/get-evaluation-history.dto.ts` — PaginationDto 상속
- `evaluations/dto/get-score-trend.dto.ts` — limit 파라미터

기존 패턴:
- paramIndex 카운터 방식 동적 WHERE (user_id 필터)
- PaginatedResponse<T> + PaginationDto 상속
- Swagger 데코레이터

전체 슬라이스 검증: Docker Compose 기동 후 전체 흐름(답안 생성 → 제출 → 평가 → 결과 조회 → 이력 → 추이) curl 테스트.

## Inputs

- ``server/src/evaluations/evaluations.repository.ts` — T02에서 생성한 기본 repository (create, findBySubmissionId)`
- ``server/src/evaluations/evaluations.service.ts` — T02에서 생성한 기본 service (evaluate, getResult)`
- ``server/src/evaluations/evaluations.controller.ts` — T02에서 생성한 기본 controller`
- ``server/src/evaluations/evaluations.module.ts` — 모듈 정의`
- ``server/src/common/dto/pagination.dto.ts` — PaginationDto 상속용`
- ``server/src/common/interfaces/paginated.interface.ts` — PaginatedResponse<T>`

## Expected Output

- ``server/src/evaluations/evaluations.repository.ts` — findHistoryByUser() + findScoreTrendByUser() 메서드 추가`
- ``server/src/evaluations/evaluations.service.ts` — getHistory() + getScoreTrend() 메서드 추가`
- ``server/src/evaluations/evaluations.controller.ts` — GET /evaluations/history + GET /evaluations/scores/trend 추가`
- ``server/src/evaluations/dto/get-evaluation-history.dto.ts` — 이력 조회 DTO`
- ``server/src/evaluations/dto/get-score-trend.dto.ts` — 추이 조회 DTO`

## Verification

cd server && npx tsc --noEmit && echo '타입 체크 통과' && cd .. && docker compose up -d --build && sleep 10 && curl -s http://localhost:3100/evaluations/history -H 'X-User-Id: test-user-s03' | grep -q 'items' && echo '이력 조회 성공' && curl -s http://localhost:3100/evaluations/scores/trend -H 'X-User-Id: test-user-s03' | grep -q 'success' && echo '추이 조회 성공'
