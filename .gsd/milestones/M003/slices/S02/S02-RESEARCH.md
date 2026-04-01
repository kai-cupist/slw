# S02: 제출 로딩 UX 개선 — Research

**Date:** 2026-04-01

## Summary

write 화면의 제출 흐름은 현재 3단계 비동기 순서(저장 → submitSubmission → evaluate)로 구성되어 있으나, `submitting` 상태가 마지막 `evaluate.isPending`만 추적한다. 그 결과 `submitSubmission` 단계가 실행되는 동안 제출 버튼은 active 상태로 보이고, 사용자는 진행 상황을 알 수 없다.

개선 포인트는 단순하다: handleSubmit 전체 흐름(저장→제출→평가)을 단일 로컬 `isSubmitting` state로 감싸면 된다. 단계별 진행 텍스트("저장 중...", "제출 중...", "AI 평가 중...")를 표시하면 Groq API 대기 시간(2~5초) 동안 사용자가 앱이 멈췄다고 오해하지 않는다.

evaluation 화면은 수정 불필요 — `router.replace`로 진입할 때 evaluate 결과가 서버에 이미 저장된 상태이므로 `useEvaluation` hook이 즉시 결과를 가져온다. 기존 로딩 스피너도 이미 구현되어 있다.

## Recommendation

`mobile/app/write/index.tsx` 단일 파일 수정. 로컬 `isSubmitting` boolean state와 `submitPhase` string state를 추가한다. handleSubmit 진입 시 `isSubmitting = true`, 각 단계마다 phase 텍스트 업데이트, 성공/실패 모두 finally에서 `isSubmitting = false`. 버튼 disabled 조건과 TextInput editable 조건을 `isSubmitting`으로 교체한다.

## Implementation Landscape

### Key Files

- `mobile/app/write/index.tsx` — 수정 대상. handleSubmit, 제출 버튼 UI, TextInput editable 조건 변경
- `mobile/app/evaluation/[submissionId].tsx` — 수정 불필요. ActivityIndicator 로딩 이미 구현됨
- `mobile/lib/hooks/mutations.ts` — 수정 불필요. useSubmitSubmission / useEvaluate 동일하게 사용
- `mobile/lib/hooks/queries.ts` — 수정 불필요

### 현재 상태 분석

```tsx
// write/index.tsx 현재
const { mutateAsync: submitSubmission } = useSubmitSubmission();       // isPending 미사용
const { mutateAsync: evaluate, isPending: submitting } = useEvaluate(); // 이것만 추적

// handleSubmit 내부
await submitSubmission(sid);   // 이 단계 동안 submitting = false → 버튼 active
await evaluate(sid);           // 이 단계만 submitting = true
router.replace(`/evaluation/${sid}`);
```

### 개선 패턴

```tsx
// 추가할 state
const [isSubmitting, setIsSubmitting] = useState(false);
const [submitPhase, setSubmitPhase] = useState('');

// handleSubmit 수정
const handleSubmit = async () => {
  if (isSubmitting) return;
  // ...
  setIsSubmitting(true);
  try {
    setSubmitPhase('저장 중...');
    sid = await ensureCreatedAndSave(content);
    
    setSubmitPhase('제출 중...');
    await submitSubmission(sid);
    
    setSubmitPhase('AI 평가 중...');
    await evaluate(sid);
    
    router.replace(`/evaluation/${sid}`);
  } catch (err) { ... } finally {
    setIsSubmitting(false);
    setSubmitPhase('');
  }
};

// 버튼 disabled — isSubmitting으로 통일
disabled={saving || isSubmitting}

// TextInput editable
editable={!isSubmitted && !isSubmitting}

// 버튼 내 표시
{isSubmitting ? (
  <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
    <ActivityIndicator size="small" color="#fff" />
    <Text style={styles.submitButtonText}>{submitPhase}</Text>
  </View>
) : (
  <Text style={styles.submitButtonText}>제출</Text>
)}
```

### Build Order

T01 하나로 충분. write/index.tsx만 수정하면 슬라이스 완성.

### Verification Approach

```bash
cd mobile && npx tsc --noEmit  # 타입 오류 없음 확인
```

런타임 확인: Expo Go에서 write 화면에서 제출 탭 → "저장 중..." → "제출 중..." → "AI 평가 중..." 단계별 텍스트 + 버튼 비활성화 확인 → evaluation 화면 자동 전환 확인

## Constraints

- `submitting` (evaluate.isPending)은 삭제하지 않고 `isSubmitting`과 공존 가능 — 단, 버튼 disabled 조건은 `isSubmitting`으로 통일
- `saving` 상태는 임시저장 버튼 전용으로 유지
- TanStack Query v5: 뮤테이션 로딩은 `isPending` (K010)
