---
estimated_steps: 50
estimated_files: 2
skills_used: []
---

# T04: 평가 결과 + 이력 화면 구현 + 전체 흐름 E2E 검증 (APP-03, APP-04)

## Description

사용자 흐름의 후반부를 구현하고 M001 전체 흐름을 검증한다: 평가 결과 확인 + 이력 목록 + 점수 추이. 이 태스크가 완료되면 앱에서 "주제 선택 → 답안 작성 → 제출 → AI 평가 → 피드백 확인 → 이력 조회" 전체 흐름이 동작한다.

### 화면 라우팅 구조 (expo-router)
```
app/evaluation/[submissionId].tsx → 평가 결과 (GET /evaluations/:submissionId)
app/(tabs)/history.tsx            → 이력 목록 (GET /evaluations/history)
```

### 백엔드 API 엔드포인트
- GET /evaluations/:submissionId — 평가 결과 조회, X-User-Id 필수. 응답: { id, submission_id, grammar_score, logic_score, expression_score, relevance_score, total_score, feedback(JSONB), created_at }
- GET /evaluations/history?page=1&limit=10 — 이력 목록, X-User-Id 필수. 응답: { items: [{ id, submission_id, prompt_title, category, difficulty, grammar_score, logic_score, expression_score, relevance_score, total_score, created_at }], total, page, limit, totalPages }
- GET /evaluations/scores/trend?limit=20 — 점수 추이, X-User-Id 필수. 응답: [{ total_score, grammar_score, logic_score, expression_score, relevance_score, evaluated_at }]

### 평가 결과 화면 상세
- 4항목(문법/논리/표현력/주제 적절성) 각각의 점수를 프로그레스 바 또는 숫자로 표시
- 총점(total_score) 강조 표시
- feedback JSONB에서 항목별 상세 피드백 텍스트 표시
- feedback 구조: { grammar: { score, comment, suggestions }, logic: { ... }, expression: { ... }, relevance: { ... }, overall_comment }

### 이력 화면 상세
- FlatList로 평가 이력 목록 표시 (주제 제목, 총점, 날짜)
- 각 항목 Pressable → evaluation/[submissionId]로 이동
- 점수 추이: v1에서는 차트 라이브러리 없이 숫자 목록 또는 간단한 바 표현

### vercel-react-native-skills 적용
- `ui-pressable`: Pressable 사용
- `ui-styling`: StyleSheet.create
- `rendering-text-in-text-component`: Text 래핑
- `rendering-no-falsy-and`: 조건부 렌더링 패턴
- `list-performance-virtualize`: FlatList 사용

## Steps

1. `mobile/app/evaluation/[submissionId].tsx` 생성 — GET /evaluations/:submissionId 호출, 4항목 점수 바 표시, 총점, feedback 텍스트, 로딩/에러 상태
2. `mobile/app/(tabs)/history.tsx` 구현 — GET /evaluations/history 호출, FlatList, 각 항목 Pressable → 평가 결과 화면 이동, 로딩/에러/빈 상태 처리
3. 점수 추이 섹션을 history 화면 상단에 추가 — GET /evaluations/scores/trend 호출, 간단한 숫자 목록 또는 수평 바 표시 (차트 라이브러리 없이)
4. TypeScript 컴파일 확인
5. 전체 흐름 E2E 검증: Docker Compose 서버 기동 상태에서 앱 실행 → 주제 선택 → 답안 작성 → 제출 → 평가 결과 확인 → 이력 탭에서 확인

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| GET /evaluations/:id | 에러 메시지 표시 | 동일 | 빈 결과 표시 |
| GET /evaluations/history | 에러 메시지 표시 | 동일 | 빈 목록 표시 |
| GET /evaluations/scores/trend | 추이 섹션 숨김 | 동일 | 동일 |

## Must-Haves

- [ ] 평가 결과 화면에 4항목 점수 + 총점 + 피드백이 표시됨
- [ ] 이력 목록이 FlatList로 표시되고 탭하면 평가 결과로 이동
- [ ] 점수 추이가 표시됨 (차트 없이 숫자/바)
- [ ] 모든 화면에서 로딩/에러/빈 상태가 처리됨
- [ ] TypeScript 에러 없음
- [ ] 전체 사용자 흐름이 서버 연동 상태에서 동작

## Verification

- `test -f mobile/app/evaluation/[submissionId].tsx`
- `cd mobile && npx tsc --noEmit`
- `grep -q 'enableCors' server/src/main.ts`
- E2E 수동 검증: 주제 선택 → 답안 작성 → 제출 → 평가 결과 → 이력 전체 흐름

## Inputs

- ``mobile/app/(tabs)/history.tsx` — T01에서 생성된 placeholder`
- ``mobile/lib/api.ts` — T02에서 생성된 API 클라이언트`
- ``mobile/lib/types.ts` — T02에서 생성된 타입 정의`
- ``mobile/stores/userStore.ts` — T02에서 생성된 userStore`

## Expected Output

- ``mobile/app/evaluation/[submissionId].tsx` — 평가 결과 화면 (4항목 점수 + 피드백)`
- ``mobile/app/(tabs)/history.tsx` — 이력 목록 + 점수 추이 화면`

## Verification

test -f mobile/app/evaluation/[submissionId].tsx && cd mobile && npx tsc --noEmit
