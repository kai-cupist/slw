---
estimated_steps: 29
estimated_files: 1
skills_used: []
---

# T01: write/index.tsx에 isSubmitting + submitPhase state로 제출 로딩 UX 구현

handleSubmit 전체 흐름을 단일 isSubmitting state로 감싸고, 단계별 submitPhase 텍스트(저장 중.../제출 중.../AI 평가 중...)를 버튼에 표시한다.

현재 문제: `submitting`이 `evaluate.isPending`만 추적하므로 submitSubmission 단계 동안 버튼이 active 상태다.

수정 패턴:
1. `const [isSubmitting, setIsSubmitting] = useState(false)` 추가
2. `const [submitPhase, setSubmitPhase] = useState('')` 추가
3. `evaluate`에서 `isPending: submitting` 구조분해 제거 (evaluate.isPending은 더 이상 직접 사용 불필요)
4. handleSubmit 수정:
   - 진입 조건을 `if (submitting)` → `if (isSubmitting)`으로 교체
   - try 블록 전 `setIsSubmitting(true)` 호출
   - ensureCreatedAndSave 전 `setSubmitPhase('저장 중...')` 호출
   - submitSubmission 전 `setSubmitPhase('제출 중...')` 호출
   - evaluate 전 `setSubmitPhase('AI 평가 중...')` 호출
   - finally에서 `setIsSubmitting(false); setSubmitPhase('')` 호출
5. TextInput editable 조건: `!isSubmitted && !submitting` → `!isSubmitted && !isSubmitting`
6. 임시저장 버튼 disabled: `saving || submitting` → `saving || isSubmitting`
7. 제출 버튼 disabled: `saving || submitting` → `saving || isSubmitting`
8. 제출 버튼 내부 표시:
   ```tsx
   {isSubmitting ? (
     <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
       <ActivityIndicator size="small" color="#fff" />
       <Text style={styles.submitButtonText}>{submitPhase}</Text>
     </View>
   ) : (
     <Text style={styles.submitButtonText}>제출</Text>
   )}
   ```
9. styles.submitButton에 `minWidth` 또는 고정 너비를 추가해 submitPhase 텍스트가 길어져도 레이아웃이 깨지지 않도록 처리. 버튼 flex:1을 유지하면 자동으로 늘어나므로 추가 스타일 불필요 — 현재 flex:1이 이미 적용되어 있음.

주의: TanStack Query v5에서 뮤테이션 로딩은 `isPending` (K010). `submitting` 변수 참조를 모두 `isSubmitting`으로 교체해야 타입 에러 없음.

## Inputs

- `mobile/app/write/index.tsx`

## Expected Output

- `mobile/app/write/index.tsx`

## Verification

cd mobile && npx tsc --noEmit && grep -q 'isSubmitting' app/write/index.tsx && grep -q 'submitPhase' app/write/index.tsx && grep -q 'AI 평가 중' app/write/index.tsx
