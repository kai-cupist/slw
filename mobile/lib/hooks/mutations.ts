import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Submission, Evaluation } from '../types';

/**
 * 새 제출물 생성
 * promptId를 받아 POST /submissions를 호출하고 Submission을 반환한다.
 * 성공 후 해당 prompt의 draft 캐시를 무효화하여 "이어서 작성" 버튼이 즉시 반영되도록 한다.
 */
export function useCreateSubmission() {
  const queryClient = useQueryClient();
  return useMutation<Submission, Error, number>({
    mutationFn: (promptId: number) =>
      api.post<Submission>('/submissions', { prompt_id: promptId }),
    onSuccess: (_data, promptId) => {
      queryClient.invalidateQueries({
        queryKey: ['promptDraft', String(promptId)],
      });
    },
  });
}

/**
 * 제출물 내용 임시 저장
 * 성공 후 해당 submission 캐시를 무효화하여 최신 상태를 다시 불러온다.
 */
export function useSaveSubmission() {
  const queryClient = useQueryClient();
  return useMutation<
    Submission,
    Error,
    { submissionId: string; content: string }
  >({
    mutationFn: ({ submissionId, content }) =>
      api.patch<Submission>(`/submissions/${submissionId}`, { content }),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['submission', variables.submissionId],
      });
    },
  });
}

/**
 * 제출물 최종 제출
 * 성공 후 해당 submission 캐시를 무효화한다.
 */
export function useSubmitSubmission() {
  const queryClient = useQueryClient();
  return useMutation<Submission, Error, string>({
    mutationFn: (submissionId: string) =>
      api.patch<Submission>(`/submissions/${submissionId}/submit`),
    onSuccess: (_data, submissionId) => {
      queryClient.invalidateQueries({
        queryKey: ['submission', submissionId],
      });
    },
  });
}

/**
 * AI 평가 요청
 * POST /submissions/:id/evaluate 호출 후 Evaluation을 반환한다.
 * 성공 시 evaluationHistory와 scoreTrend 캐시를 무효화하여 이력 화면을 자동 갱신한다.
 */
export function useEvaluate() {
  const queryClient = useQueryClient();
  return useMutation<Evaluation, Error, string>({
    mutationFn: (submissionId: string) =>
      api.post<Evaluation>(`/submissions/${submissionId}/evaluate`, {}),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['evaluationHistory'] });
      queryClient.invalidateQueries({ queryKey: ['scoreTrend'] });
    },
  });
}
