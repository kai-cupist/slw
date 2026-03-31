---
estimated_steps: 43
estimated_files: 4
skills_used: []
---

# T03: 주제 목록/상세 + 답안 작성/제출 화면 구현 (APP-01, APP-02)

## Description

사용자 흐름의 전반부를 구현한다: 주제 목록 → 주제 상세 → 답안 작성 → 임시저장/제출. 앱 진입 시 userId가 로드되도록 Root Layout에서 userStore.loadUserId()를 호출한다.

### 화면 라우팅 구조 (expo-router)
```
app/(tabs)/index.tsx    → 주제 목록 (GET /prompts)
app/prompts/[id].tsx    → 주제 상세 (GET /prompts/:id) + "작성 시작" 버튼
app/write/[submissionId].tsx → 답안 작성/수정 (PATCH /submissions/:id, PATCH /:id/submit)
```

### 백엔드 API 엔드포인트
- GET /prompts?page=1&limit=10 — 주제 목록 (X-User-Id 불필요)
- GET /prompts/:id — 주제 상세 (X-User-Id 불필요)
- POST /submissions { prompt_id, content? } — 답안 생성, X-User-Id 필수
- PATCH /submissions/:id { content } — 답안 수정, X-User-Id 필수, draft만 가능
- PATCH /submissions/:id/submit — 제출, X-User-Id 필수, body 없음
- POST /submissions/:id/evaluate — 평가 요청, X-User-Id 필수, body 없음

### vercel-react-native-skills 적용
- `ui-pressable`: TouchableOpacity 대신 Pressable 사용
- `ui-styling`: StyleSheet.create 사용
- `rendering-text-in-text-component`: 모든 문자열을 Text 컴포넌트로 래핑
- `rendering-no-falsy-and`: 조건부 렌더링 시 `count > 0 &&` 패턴
- `list-performance-virtualize`: FlatList 사용 (데이터 적으므로 FlashList 불필요)

## Steps

1. `mobile/app/_layout.tsx` 수정 — 앱 시작 시 `userStore.loadUserId()` 호출, isLoaded가 false이면 로딩 표시
2. `mobile/app/(tabs)/index.tsx` 구현 — GET /prompts 호출, FlatList, 카테고리/난이도 뱃지 표시, Pressable로 주제 상세 이동, 로딩/에러 상태 처리
3. `mobile/app/prompts/[id].tsx` 생성 — GET /prompts/:id 호출, 주제 설명 표시, "작성 시작" 버튼 → POST /submissions → write/[submissionId]로 router.push
4. `mobile/app/write/[submissionId].tsx` 생성 — GET /submissions/:id로 기존 내용 로드, TextInput(multiline), "임시저장" 버튼(PATCH /submissions/:id), "제출" 버튼(PATCH submit → POST evaluate → evaluation/[submissionId]로 이동), 제출 중 로딩 UI
5. TypeScript 컴파일 확인

## Failure Modes

| Dependency | On error | On timeout | On malformed response |
|------------|----------|-----------|----------------------|
| GET /prompts | 에러 메시지 표시 + 재시도 안내 | 동일 | 빈 목록 표시 |
| POST /submissions | Alert로 에러 표시 | 로딩 해제 + 에러 표시 | Alert 에러 |
| PATCH submit + POST evaluate | 로딩 해제 + 에러 표시, 다시 시도 가능 | 동일 | 동일 |

## Must-Haves

- [ ] 주제 목록이 FlatList로 표시되고 카테고리/난이도 뱃지가 보임
- [ ] 주제 탭 → 상세 → 작성 시작으로 네비게이션이 연결됨
- [ ] 답안 작성/임시저장/제출이 동작함
- [ ] 제출 시 자동으로 평가 요청 후 결과 화면으로 이동
- [ ] 로딩/에러 상태가 모든 화면에서 처리됨
- [ ] Pressable, StyleSheet.create, Text 래핑 등 RN 베스트 프랙티스 준수

## Verification

- `test -f mobile/app/prompts/[id].tsx && test -f mobile/app/write/[submissionId].tsx`
- `cd mobile && npx tsc --noEmit`

## Inputs

- ``mobile/app/_layout.tsx` — T01에서 생성된 Root Layout`
- ``mobile/app/(tabs)/index.tsx` — T01에서 생성된 placeholder`
- ``mobile/lib/api.ts` — T02에서 생성된 API 클라이언트`
- ``mobile/stores/userStore.ts` — T02에서 생성된 userStore`
- ``mobile/lib/types.ts` — T02에서 생성된 타입 정의`

## Expected Output

- ``mobile/app/_layout.tsx` — userId 로드 로직 추가`
- ``mobile/app/(tabs)/index.tsx` — 주제 목록 화면 (FlatList + 뱃지 + 네비게이션)`
- ``mobile/app/prompts/[id].tsx` — 주제 상세 + 작성 시작 화면`
- ``mobile/app/write/[submissionId].tsx` — 답안 작성/임시저장/제출 화면`

## Verification

test -f mobile/app/prompts/[id].tsx && test -f mobile/app/write/[submissionId].tsx && cd mobile && npx tsc --noEmit
