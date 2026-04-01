---
estimated_steps: 1
estimated_files: 1
skills_used: []
---

# T06: 이력 화면 리디자인 + 전체 검증

history.tsx 스타일 교체, 전체 tsc + 구 색상 하드코딩 제거 검증

## Inputs

- `mobile/lib/theme.ts`
- `mobile/components/ScoreBar.tsx`
- `mobile/components/Badge.tsx`

## Expected Output

- `mobile/app/(tabs)/history.tsx`

## Verification

tsc --noEmit && ! rg "'#2196F3'" mobile/app/ && ! rg "'#4CAF50'" mobile/app/
