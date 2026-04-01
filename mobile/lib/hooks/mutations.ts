import { useMutation, useQueryClient } from '@tanstack/react-query';
import { api } from '../api';
import type { Submission, Evaluation } from '../types';

/**
 * 새 제출물 생성
 * promptId를 받아 POST /submissions를 호출하고 Submission을 반환한다.
 */
export function useCreateSubmission() {
  return useMutation<Submission, Error, number>({
    mutationFn: (promptId: number) =>
      api.post<Submission>('/submissions', { prompt_id: promptId }),
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
 * invalidate는 호출측(화면)에서 결과를 받은 뒤 처리한다.
 */
export function useEvaluate() {
  return useMutation<Evaluation, Error, string>({
    mutationFn: (submissionId: string) =>
      api.post<Evaluation>(`/submissions/${submissionId}/evaluate`, {}),
  });
}
