# M001: 쓰기 평가 MVP

**Vision:** "주제 선택 → 답안 작성 → 제출 → AI 평가 → 피드백 확인" 핵심 흐름이 끝까지 동작하는 v1을 완성한다.

## Success Criteria


## Slices

- [ ] **S01: Infra Setup** `risk:medium` `depends:[]`
  > After this: NestJS 프로젝트를 생성하고, Docker Compose로 PostgreSQL + NestJS 개발 환경을 구성하며, DatabaseModule(pg Pool 기반)을 구축한다.
- [ ] **S02: Prompts Submissions** `risk:medium` `depends:[S01]`
  > After this: Phase 2의 DB 스키마(prompts, submissions 테이블)와 시드 데이터를 마이그레이션 SQL로 생성하고,
후속 Plan에서 사용할 공통 인프라(X-User-Id 가드/데코레이터, 페이지네이션 DTO/인터페이스)를 구축한다.
- [ ] **S03: AI 평가 및 이력** `risk:medium` `depends:[S02]`
  > After this: 답안 제출 시 Groq LLM API가 호출되어 문법/논리/표현력/주제 적절성 4항목 점수와 상세 피드백이 반환되고, 과거 평가 이력과 점수 추이를 조회할 수 있다
- [ ] **S04: 모바일 클라이언트** `risk:medium` `depends:[S03]`
  > After this: Expo 앱에서 쓰기 주제를 선택하고, 답안을 작성/제출하고, AI 평가 결과와 이력을 확인하는 전체 사용자 흐름이 동작한다
