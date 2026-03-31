# S04 연구: 모바일 클라이언트

**깊이:** Targeted — Expo/expo-router는 프로젝트에 처음 도입하지만 기술 자체는 잘 문서화되어 있고, 백엔드 API가 완성된 상태에서 클라이언트를 붙이는 작업이다.

## 요약

Expo SDK 55 + expo-router + Zustand로 4개 핵심 화면(주제 목록, 답안 작성, 평가 결과, 이력)을 구현한다. 백엔드 API 7개 엔드포인트가 이미 완성되어 있고, 모든 응답은 `{ success: true, data }` envelope 패턴을 따른다. 사용자 식별은 `X-User-Id` UUID 헤더로 처리하며, 앱에서 UUID를 생성하여 영구 저장해야 한다.

**프로젝트 구조:** CNG(Continuous Native Generation) — `ios/`, `android/` 디렉토리를 gitignore하고 `npx expo prebuild`로 필요 시 생성 (D005).

## 권장사항

1. **프로젝트를 `mobile/` 디렉토리에 생성** — `npx create-expo-app@latest --template default@sdk-55 mobile`
2. **expo-router 파일 기반 라우팅** — `app/` 디렉토리에 탭 + 스택 레이아웃
3. **API 클라이언트를 단일 모듈로 추출** — `EXPO_PUBLIC_API_URL` 환경변수로 서버 주소 관리
4. **Zustand 스토어** — userId(앱 최초 실행 시 UUID 생성, AsyncStorage 영구 저장) + 현재 작성 중인 답안 상태
5. **CORS 활성화** — NestJS `main.ts`에 `app.enableCors()` 추가 필요
6. **fetch/useEffect 패턴** — 프로젝트 제약(학습 목적)에 따라 TanStack Query 없이 직접 구현

## 구현 범위

### 대상 요구사항
| ID | 설명 | 이 슬라이스에서 |
|----|------|----------------|
| APP-01 | 쓰기 주제 목록을 보고 선택 | 주제 목록 화면 + 상세 → 작성 진입 |
| APP-02 | 답안 작성 및 임시저장/제출 | 작성 화면 (TextInput + 저장/제출 버튼) |
| APP-03 | AI 평가 결과와 상세 피드백 확인 | 평가 결과 화면 (4항목 점수 + 피드백) |
| APP-04 | 제출 이력과 점수 추이 확인 | 이력 탭 (목록 + 추이 차트 대체 UI) |

### 백엔드 API 인벤토리 (모두 구현 완료)

| 메서드 | 경로 | 용도 | X-User-Id |
|--------|------|------|-----------|
| GET | /prompts | 주제 목록 (필터, 페이지네이션) | 불필요 |
| GET | /prompts/:id | 주제 상세 | 불필요 |
| POST | /submissions | 답안 생성 (임시저장) | 필수 |
| PATCH | /submissions/:id | 답안 수정 (이어쓰기) | 필수 |
| PATCH | /submissions/:id/submit | 답안 제출 | 필수 |
| GET | /submissions | 답안 목록 | 필수 |
| GET | /submissions/:id | 답안 상세 | 필수 |
| DELETE | /submissions/:id | 답안 삭제 | 필수 |
| POST | /submissions/:id/evaluate | AI 평가 요청 | 필수 |
| GET | /evaluations/:submissionId | 평가 결과 조회 | 필수 |
| GET | /evaluations/history | 평가 이력 목록 | 필수 |
| GET | /evaluations/scores/trend | 점수 추이 | 필수 |

### 응답 형식
```typescript
// 성공
{ success: true, data: T }

// 에러
{ success: false, error: { code: string, message: string, details?: any } }

// 페이지네이션 (data 내부)
{ items: T[], total: number, page: number, limit: number, totalPages: number }
```

## 화면 구조 및 라우팅

```
app/
├── _layout.tsx              # Root Stack — (tabs) + 모달 화면
├── (tabs)/
│   ├── _layout.tsx          # Tab Navigator (주제/이력 2탭)
│   ├── index.tsx            # 주제 목록 (APP-01)
│   └── history.tsx          # 평가 이력 목록 (APP-04)
├── prompts/
│   └── [id].tsx             # 주제 상세 + "작성 시작" 진입
├── write/
│   └── [submissionId].tsx   # 답안 작성/수정 (APP-02)
└── evaluation/
    └── [submissionId].tsx   # 평가 결과 (APP-03)
```

### 화면별 역할

1. **주제 목록 (tabs/index)** — GET /prompts, FlatList, 카테고리/난이도 뱃지 표시, 탭하면 주제 상세로 이동
2. **주제 상세 (prompts/[id])** — GET /prompts/:id, 주제 설명 표시, "작성 시작" 버튼 → POST /submissions → write/[submissionId]로 이동
3. **답안 작성 (write/[submissionId])** — TextInput (multiline), 임시저장 버튼(PATCH /submissions/:id), 제출 버튼(PATCH /submissions/:id/submit → POST /submissions/:id/evaluate) → 평가 결과 화면으로 이동
4. **평가 결과 (evaluation/[submissionId])** — GET /evaluations/:submissionId, 4항목 점수 바 + 총점 + 피드백 텍스트 표시
5. **이력 (tabs/history)** — GET /evaluations/history, FlatList, 각 항목 탭하면 평가 결과 화면으로 이동

## 기술 결정

### API 클라이언트 설계
```typescript
// lib/api.ts
const API_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3100';

async function request<T>(path: string, options?: RequestInit): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...options?.headers as Record<string, string>,
  };
  // userId가 필요한 경로에 자동 주입
  const userId = useUserStore.getState().userId;
  if (userId) headers['X-User-Id'] = userId;

  const res = await fetch(`${API_URL}${path}`, { ...options, headers });
  const json = await res.json();
  if (!json.success) throw new ApiError(json.error);
  return json.data;
}
```

### 사용자 식별 (X-User-Id)
- 앱 최초 실행 시 `crypto.randomUUID()` (또는 `expo-crypto`)로 UUID 생성
- `AsyncStorage`에 영구 저장
- Zustand 스토어의 `userId` 필드로 관리 — API 클라이언트가 자동 주입
- v2에서 인증 추가 시 이 UUID를 서버측 user_id와 연결하는 마이그레이션 가능

### 상태 관리 (Zustand)
```typescript
// stores/userStore.ts — userId 영구 관리
interface UserState {
  userId: string | null;
  isLoaded: boolean;
  loadUserId: () => Promise<void>;
}

// 앱 시작 시 AsyncStorage에서 로드, 없으면 생성하여 저장
```

### CORS 설정 (서버 변경 필요)
`server/src/main.ts`에 `app.enableCors()` 추가. 개발 환경에서는 전체 origin 허용, 프로덕션에서는 제한.

### 네트워크 주소 문제
- iOS 시뮬레이터: `localhost`로 접근 가능
- Android 에뮬레이터: `10.0.2.2`로 접근
- 실기기: 호스트 머신의 LAN IP 필요
- `EXPO_PUBLIC_API_URL` 환경변수로 관리하여 환경별 대응

## 주의사항

1. **CORS 미설정** — 현재 NestJS 서버에 CORS 설정이 없다. Expo 개발 서버(web)에서 접근 시 필수. React Native 네이티브 앱에서는 CORS가 적용되지 않지만, Expo Go 웹뷰 디버깅 시 문제될 수 있으므로 추가 권장.
2. **AI 평가 응답 시간** — Groq API 호출이 수 초 걸릴 수 있다. 제출 → 평가 흐름에서 로딩 상태 UI가 필수적이다.
3. **점수 추이 시각화** — v1에서는 차트 라이브러리 도입 대신 숫자 목록이나 간단한 바 표현으로 처리. 차트 라이브러리(react-native-chart-kit 등)는 v2로 연기.
4. **Node.js 버전** — 현재 시스템에 24.x가 설치되어 있으나, Expo SDK 55 공식 요구는 20+이므로 호환 문제 없음.
5. **Expo Go vs Development Build** — 기본 의존성만 사용하므로 Expo Go로 충분. 네이티브 모듈이 필요해지면 `npx expo prebuild`로 전환.

## 작업 분할 가이드 (플래너용)

### 자연스러운 작업 경계

1. **프로젝트 초기화 + 서버 CORS** — `npx create-expo-app`, 디렉토리 구조 설정, 환경변수, NestJS CORS 활성화, 라우팅 레이아웃 스켈레톤. 이 작업이 끝나면 앱이 실행되고 빈 화면이 표시된다.
2. **API 클라이언트 + Zustand 스토어 + userId** — `lib/api.ts` 모듈, Zustand userStore (AsyncStorage 연동), 에러 처리 유틸. 이 작업이 끝나면 앱에서 서버 API를 호출할 수 있다.
3. **주제 목록/상세 + 답안 작성 화면** — (tabs)/index, prompts/[id], write/[submissionId] 구현. 핵심 흐름의 전반부(주제 선택 → 작성 → 제출).
4. **평가 결과 + 이력 화면** — evaluation/[submissionId], (tabs)/history 구현. 핵심 흐름의 후반부(평가 확인 → 이력 조회).

### 검증 전략
- 각 태스크 완료 시 Expo 개발 서버 실행 + TypeScript 에러 없음 확인
- 최종 검증: Docker Compose 서버 기동 상태에서 Expo 앱으로 "주제 선택 → 작성 → 제출 → 평가 → 이력 확인" 전체 흐름 수행

### vercel-react-native-skills 적용 포인트
- `list-performance-virtualize`: 주제 목록과 이력 목록에 FlatList 사용 (데이터 적으므로 FlashList는 불필요)
- `ui-pressable`: TouchableOpacity 대신 Pressable 사용
- `ui-styling`: StyleSheet.create 사용
- `rendering-text-in-text-component`: 모든 문자열을 Text 컴포넌트로 래핑
- `rendering-no-falsy-and`: 조건부 렌더링 시 `{count && <View/>}` 대신 `{count > 0 && <View/>}` 패턴
- `react-state-minimize`: Zustand 스토어에서 필요한 필드만 선택적 구독

## 사용 가능한 스킬

### 이미 설치됨
- `vercel-react-native-skills` — React Native/Expo 베스트 프랙티스 (리스트 성능, 애니메이션, UI 패턴 등)

### 설치 고려
- `expo/skills@use-dom` (10.2K installs) — Expo use-dom 컴포넌트. v1에서는 웹 컴포넌트를 쓰지 않으므로 불필요.
- `jezweb/claude-skills@zustand-state-management` (1.2K installs) — Zustand 패턴. v1 스토어가 단순하므로 선택적.

**권장:** 추가 스킬 설치 불필요. 이미 설치된 `vercel-react-native-skills`로 충분.
