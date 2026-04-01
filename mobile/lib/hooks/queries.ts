import { useQuery } from '@tanstack/react-query';
import { api } from '../api';
import type {
  Prompt,
  Submission,
  Evaluation,
  EvaluationHistory,
  ScoreTrend,
  PaginatedResponse,
} from '../types';

/**
 * 프롬프트 목록 조회
 * staleTime: 5분 — 목록은 자주 바뀌지 않으므로 긴 캐시 유지
 */
export function usePrompts() {
  return useQuery<PaginatedResponse<Prompt>>({
    queryKey: ['prompts'],
    queryFn: () => api.get<PaginatedResponse<Prompt>>('/prompts?page=1&limit=20'),
    staleTime: 300_000,
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
    staleTime: 300_000,
    enabled: !!id,
  });
}

/**
 * 단일 제출물 조회
 * staleTime: 30초 — 제출/평가 후 빠르게 최신 상태를 반영
 */
export function useSubmission(submissionId: string | undefined) {
  return useQuery<Submission>({
    queryKey: ['submission', submissionId],
    queryFn: () => api.get<Submission>(`/submissions/${submissionId}`),
    staleTime: 30_000,
    enabled: !!submissionId,
  });
}

/**
 * 특정 제출물의 평가 결과 조회
 * staleTime: 30초
 */
export function useEvaluation(submissionId: string | undefined) {
  return useQuery<Evaluation>({
    queryKey: ['evaluation', submissionId],
    queryFn: () => api.get<Evaluation>(`/evaluations/${submissionId}`),
    staleTime: 30_000,
    enabled: !!submissionId,
  });
}

/**
 * 평가 이력 목록 조회
 * staleTime: 1분
 */
export function useEvaluationHistory() {
  return useQuery<PaginatedResponse<EvaluationHistory>>({
    queryKey: ['evaluationHistory'],
    queryFn: () =>
      api.get<PaginatedResponse<EvaluationHistory>>('/evaluations/history?page=1&limit=20'),
    staleTime: 60_000,
  });
}

/**
 * 점수 트렌드 조회 (최근 10개)
 * staleTime: 1분
 */
export function useScoreTrend() {
  return useQuery<ScoreTrend[]>({
    queryKey: ['scoreTrend'],
    queryFn: () => api.get<ScoreTrend[]>('/evaluations/scores/trend?limit=10'),
    staleTime: 60_000,
  });
}
