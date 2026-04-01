# S04: 전체 UI 디자인 개선 — UAT

**Milestone:** M003
**Written:** 2026-04-01T07:10:47.986Z

## 전제 조건

- `cd mobile && npx expo start` 또는 Expo Go로 앱 실행 가능한 환경
- 백엔드 서버 실행 중 (또는 API mocking)
- tsc 컴파일: `cd mobile && npx tsc --noEmit` → exit 0

## 테스트 케이스

### TC-01: theme.ts와 공통 컴포넌트 파일 존재 확인

**전제조건:** 없음

**단계:**
1. `test -f mobile/lib/theme.ts` 실행
2. `test -f mobile/components/Badge.tsx` 실행
3. `test -f mobile/components/ScoreBar.tsx` 실행
4. `test -f mobile/components/LoadingView.tsx` 실행
5. `test -f mobile/components/ErrorView.tsx` 실행

**기대 결과:** 모든 명령 exit 0

---

### TC-02: TypeScript 컴파일 에러 없음

**전제조건:** mobile/ 디렉토리에 node_modules 설치 완료

**단계:**
1. `cd mobile && npx tsc --noEmit` 실행

**기대 결과:** exit 0, stderr 출력 없음

---

### TC-03: 인라인 DIFFICULTY_COLORS/scoreColor 완전 제거 확인

**전제조건:** 없음

**단계:**
1. `rg 'DIFFICULTY_COLORS|scoreColor' mobile/app/` 실행

**기대 결과:** exit 1 (매칭 없음) — app/ 내 어떤 파일에도 DIFFICULTY_COLORS나 scoreColor 문자열이 없어야 함

---

### TC-04: 주제 목록 화면 — 카테고리·난이도 뱃지 표시

**전제조건:** 앱 실행, 백엔드 연결

**단계:**
1. 앱 홈 탭(주제 목록) 진입
2. 목록 아이템의 뱃지 확인

**기대 결과:**
- 카테고리 뱃지: 파란 배경(#2196F3), 흰색 텍스트
- 난이도 뱃지: beginner=#4CAF50, intermediate=#FF9800, advanced=#F44336
- 인라인 badge View 없이 CategoryBadge/DifficultyBadge 공통 컴포넌트 사용

---

### TC-05: 주제 목록 화면 — 로딩/에러 상태

**전제조건:** 앱 실행

**단계:**
1. 네트워크 차단 후 앱 재시작 → 에러 상태 확인
2. 네트워크 복구 후 '다시 시도' 버튼 탭

**기대 결과:**
- 로딩 중: ActivityIndicator + "주제를 불러오는 중..." 텍스트
- 에러 시: 에러 메시지 + "다시 시도" 버튼
- 버튼 탭 시 refetch 실행

---

### TC-06: 주제 상세 화면 — 카테고리·난이도 뱃지

**전제조건:** 앱 실행, 주제 목록에서 아이템 탭

**단계:**
1. 주제 상세 화면 진입
2. metaRow의 뱃지 2개 확인

**기대 결과:**
- CategoryBadge: 파란 배경
- DifficultyBadge: 난이도별 색상
- 로딩 분기: LoadingView("주제를 불러오는 중...")

---

### TC-07: 평가 결과 화면 — ScoreBar 공통 컴포넌트

**전제조건:** 평가 완료된 submission 존재

**단계:**
1. 평가 결과 화면 진입
2. 4개 항목 ScoreBar 확인 (문법, 논리, 표현력, 주제 적절성)
3. 총점 색상 확인

**기대 결과:**
- ScoreBar 4개: label + 프로그레스 바 + 점수(x.x/10) 표시
- 바 색상: score≥8 초록, ≥5 주황, <5 빨강
- 총점 텍스트 색상: 동일 로직 적용

---

### TC-08: 글쓰기 화면 — 색상 theme 적용

**전제조건:** 앱 실행, 글쓰기 화면 진입

**단계:**
1. 텍스트 입력 영역 배경색 확인
2. '저장' 버튼 색상 확인
3. '제출 및 평가' 버튼 색상 확인

**기대 결과:**
- 텍스트 입력 영역: colors.inputBackground (#FAFAFA) — `rg "'#FAFAFA'" mobile/app/write/` → exit 1(매칭 없음)
- 버튼: colors.primary (#2196F3)

---

### TC-09: 이력 화면 — 공통 컴포넌트 적용

**전제조건:** 평가 완료된 이력 1건 이상 존재

**단계:**
1. 이력 탭 진입
2. 이력 아이템의 난이도 뱃지 확인
3. TrendSection 미니 ScoreBar 확인
4. 로딩/에러 상태 확인

**기대 결과:**
- 난이도 뱃지: DifficultyBadge 공통 컴포넌트 사용 (인라인 DIFFICULTY_COLORS 없음)
- 미니 ScoreBar: size="mini", 라벨 4개(문법/논리/표현/주제)
- 로딩: "이력을 불러오는 중..."
- 에러: 에러 메시지 + "다시 시도" 버튼

---

### TC-10: 삭제 버튼 isPending 처리

**전제조건:** 이력 1건 이상 존재

**단계:**
1. 이력 아이템 스와이프하여 삭제 버튼 노출
2. 삭제 버튼 탭 직후 버튼 상태 확인 (빠른 연속 탭 시도)

**기대 결과:**
- 삭제 요청 중: 버튼 disabled, opacity 0.5로 시각적 피드백
- 삭제 완료 후: 목록에서 해당 아이템 제거
- 연속 탭 시 중복 요청 없음
