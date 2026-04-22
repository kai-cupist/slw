# mobile

**말하기 듣기 쓰기**의 Expo 클라이언트. 상세 소개·전체 실행법은 [루트 README](../README.md) 참고.

## Stack

- Expo SDK 55 (CNG, **expo-dev-client 기반**)
- expo-router (file-based routing, typed routes)
- TanStack Query v5 · Zustand
- React Compiler 활성화 (`experiments.reactCompiler: true`)

> `ios/`, `android/` 디렉토리는 gitignore되어 있습니다. `app.json`이 네이티브 설정의 단일 소스이고, 필요 시 `npm run prebuild`로 재생성합니다.

## 개발 실행

```bash
npm install
npx expo start        # Metro 번들러 + dev client 안내
```

루트에서 `docker compose up -d`로 API 서버가 이미 떠 있어야 합니다 (`http://localhost:3100`).

## 네이티브 빌드가 필요할 때

네이티브 모듈을 추가하거나 `app.json`의 플러그인·번들 ID 등을 바꿨을 때만.

```bash
npm run prebuild      # ios/, android/ 재생성 (expo prebuild --clean)
npm run ios           # iOS 시뮬레이터 빌드·실행
npm run android       # Android 에뮬레이터 빌드·실행
```

## 스크립트

| 명령                              | 설명                      |
| --------------------------------- | ------------------------- |
| `npm run start`                   | Metro 번들러              |
| `npm run lint` / `lint:check`     | ESLint (자동 수정 / 검사) |
| `npm run typecheck`               | `tsc --noEmit`            |
| `npm run format` / `format:check` | Prettier                  |

## 디렉토리

```
mobile/
├── app/              # expo-router 라우트
│   ├── (tabs)/           # 탭 네비게이션 (홈, 히스토리)
│   ├── prompts/[id]      # 주제 상세
│   ├── write/            # 작성
│   └── evaluation/[submissionId]  # AI 평가 결과
├── components/       # 재사용 UI
├── lib/              # theme.ts (colors/spacing/radius/shadow/typography 토큰), API 클라이언트
└── stores/           # Zustand 스토어
```

스타일은 `lib/theme.ts`의 토큰만 사용합니다 (하드코딩 색상·픽셀 금지).
