# M002: 

## Vision
모바일 앱의 데이터 패칭을 TanStack Query로 전환하고, 임시저장→이어쓰기 흐름이 자연스럽게 동작하게 하며, pull-to-refresh와 mutation 후 자동 갱신 등 UX를 개선한다.

## Slice Overview
| ID | Slice | Risk | Depends | Done | After this |
|----|-------|------|---------|------|------------|
| S01 | TanStack Query 도입 및 전체 화면 전환 | medium | — | ✅ | 모든 화면에서 TanStack Query 기반 데이터 패칭이 동작하고, fetch/useEffect 코드가 제거된다 |
| S02 | Submissions 임시저장-이어쓰기 흐름 완성 | medium | S01 | ✅ | 프롬프트 상세에서 기존 draft가 있으면 이어서 작성 버튼이 표시되고, 임시저장 후 앱 재시작 시에도 draft가 유지된다 |
| S03 | UX 향상 — pull-to-refresh 및 자동 갱신 | low | S01 | ⬜ | 목록 화면에서 당겨서 새로고침이 동작하고, 답안 제출 후 이력 화면이 자동으로 갱신된다 |
