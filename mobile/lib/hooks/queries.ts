import { useInfiniteQuery, useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Prompt,
  Submission,
  Evaluation,
  EvaluationHistory,
  ScoreTrend,
  PaginatedResponse,
  SubmissionWithPrompt,
} from '../types';

const PAGE_LIMIT = 20;

/**
 * 프롬프트 무한 스크롤 목록 조회
 * getNextPageParam: 마지막 페이지의 page < totalPages면 다음 페이지 번호 반환
 */
export function usePrompts() {
  return useInfiniteQuery<PaginatedResponse<Prompt>>({
    queryKey: ['prompts'],
    queryFn: ({ pageParam }) =>
      api.get<PaginatedResponse<Prompt>>(
        `/prompts?page=${pageParam}&limit=${PAGE_LIMIT}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

/**
 * 단일 프롬프트 조회
 * id가 없으면 쿼리를 실행하지 않는다.
 */
export function usePrompt(id: string | undefined) {
  return useQuery<Prompt>({
    queryKey: ['prompt', id],
    queryFn: () => api.get<Prompt>(`/prompts/${id}`),
    enabled: !!id,
  });
}

/**
 * 단일 제출물 조회
 */
export function useSubmission(submissionId: string | undefined) {
  return useQuery<Submission>({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get<Submission>(`/submissions/${submissionId}`),
    enabled: !!submissionId,
  });
}

/**
 * 특정 제출물의 평가 결과 조회
 */
export function useEvaluation(submissionId: string | undefined) {
  return useQuery<Evaluation>({
    queryKey: ['evaluation', submissionId],
    queryFn: () => api.get<Evaluation>(`/evaluations/${submissionId}`),
    enabled: !!submissionId,
  });
}

/**
 * 평가 이력 무한 스크롤 목록 조회
 */
export function useEvaluationHistory() {
  return useInfiniteQuery<PaginatedResponse<EvaluationHistory>>({
    queryKey: ['evaluationHistory'],
    queryFn: ({ pageParam }) =>
      api.get<PaginatedResponse<EvaluationHistory>>(
        `/evaluations/history?page=${pageParam}&limit=${PAGE_LIMIT}`,
      ),
    initialPageParam: 1,
    getNextPageParam: (lastPage) =>
      lastPage.page < lastPage.totalPages ? lastPage.page + 1 : undefined,
  });
}

/**
 * 점수 트렌드 조회 (최근 10개)
 */
export function useScoreTrend() {
  return useQuery<ScoreTrend[]>({
    queryKey: ['scoreTrend'],
    queryFn: () => api.get<ScoreTrend[]>('/evaluations/scores/trend?limit=10'),
  });
}

/**
 * 특정 프롬프트의 기존 draft 제출물 조회 (최대 1개)
 * enabled: promptId가 있을 때만 실행
 */
export function usePromptDraft(promptId: string | undefined) {
  return useQuery<PaginatedResponse<SubmissionWithPrompt>>({
    queryKey: ['promptDraft', promptId],
    queryFn: () =>
      api.get<PaginatedResponse<SubmissionWithPrompt>>(
        '/submissions?status=draft&promptId=' + promptId + '&limit=1',
      ),
    enabled: !!promptId,
  });
}
