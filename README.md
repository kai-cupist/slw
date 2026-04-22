<div align="center">

<img src="mobile/assets/images/background_image.jpg" alt="말하기 듣기 쓰기 6-2" width="280" />

# 말하기 듣기 쓰기

> 6학년 2학기 국어 교과서에서 영감을 받은, AI 언어 학습 앱.
>
> _선생님 대신 LLM이, 빨간 펜 대신 JSON이._

</div>

---

## 뭐하는 앱이에요?

이름 그대로입니다. 말하기·듣기·쓰기.

지금은 **쓰기**만 됩니다. 주제를 받고 글을 쓰면, AI가 문법·논리·표현력·주제 적절성을 평가하고 피드백을 돌려줍니다. 초등학교 국어 시간에 하던 그거 맞습니다. 다만 선생님이 Groq API로 교체되었습니다.

나중에는 말하기(음성 녹음 → 발음·유창성 평가)와 듣기(음성 콘텐츠 → 이해도 테스트)도 붙일 예정입니다. 교과서 제목에 걸맞은 앱이 되는 게 목표입니다.

```
현재: 📝 주제 선택 → ✍️ 글쓰기 → 🤖 AI 평가 → 📊 피드백 확인
예정: 🎙️ 말하기 평가 / 🎧 듣기 평가
```

---

## 왜 만들었어요?

두 가지 이유입니다.

첫째, 백엔드를 제대로 배우고 싶었습니다. 프론트엔드만 하다 보니 서버가 블랙박스처럼 느껴졌고, DB 설계부터 API 설계, 외부 API 연동까지 직접 손으로 구현해보는 경험이 필요했습니다.

둘째, 글쓰기 실력을 키우고 싶었습니다. 서버 공부를 하면서 동시에 AI 피드백으로 언어 능력도 향상시킬 수 있으면 일석이조니까요.

---

## 기술 스택

| 영역    | 기술                                         |
| ------- | -------------------------------------------- |
| 백엔드  | NestJS 11, TypeScript, PostgreSQL 16         |
| DB 접근 | Raw SQL (pg)                                 |
| AI      | Groq API (Llama 3.3 70B)                     |
| 모바일  | Expo SDK 55, React Native, TanStack Query v5 |
| 인프라  | Docker Compose                               |

---

## 시작하기

### 사전 준비

- Docker Desktop
- Node.js 22.x
- Groq API 키 ([무료 발급](https://console.groq.com))

### 실행

```bash
# 1. 환경변수 설정
cp .env.example .env
# .env에 GROQ_API_KEY 입력

# 2. DB + 서버 실행
docker compose up -d

# 3. 마이그레이션 실행
#    로컬에서 직접 실행하면 DB 포트 충돌이 발생합니다.
#    반드시 컨테이너 안에서 실행하세요.
docker compose exec api npm run migration:run

# 4. 모바일 앱 실행
cd mobile
npm install
npx expo start
```

- 서버: `http://localhost:3100`
- Swagger: `http://localhost:3100/api-docs`

---

## 프로젝트 구조

```
slw/
├── server/           # NestJS 백엔드
│   └── src/
│       ├── prompts/      # 쓰기 주제 API
│       ├── submissions/  # 답안 API
│       ├── evaluations/  # AI 평가 API
│       └── llm/          # Groq 연동
├── mobile/           # Expo 모바일 앱
│   └── app/
│       ├── (tabs)/       # 탭 네비게이션
│       ├── prompts/      # 주제 화면
│       ├── write/        # 작성 화면
│       └── evaluation/   # 결과 화면
└── migrations/       # 수동 SQL 마이그레이션 파일
```

---

---

<div align="center">

_"바르고 효과적인 국어 생활을 한다."_
— 6학년 2학기 국어 교과서, 학습 목표

</div>
