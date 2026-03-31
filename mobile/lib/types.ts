/**
 * 서버 API 응답 타입 정의
 * 서버의 ResponseInterceptor와 HttpExceptionFilter가 통일하는 envelope 형식을 미러링한다.
 */

// ── Envelope ──

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ── Pagination ──

export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

// ── Prompt ──

export interface Prompt {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  created_at: string; // ISO 8601 — JSON 직렬화 시 Date → string
  updated_at: string;
}

// ── Submission ──

export interface Submission {
  id: number;
  prompt_id: number;
  user_id: string;
  content: string;
  status: string; // 'pending' | 'evaluated' | 'failed'
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
}

export interface SubmissionWithPrompt extends Submission {
  prompt_title: string;
  prompt_category: string;
  prompt_difficulty: string;
}

// ── Evaluation ──

export interface EvaluationFeedback {
  grammar: string;
  logic: string;
  expression: string;
  relevance: string;
  overall: string;
}

export interface Evaluation {
  id: number;
  submission_id: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
  total_score: number;
  feedback: EvaluationFeedback;
  raw_response: Record<string, unknown>;
  evaluated_at: string;
}

// ── Evaluation History ──

export interface EvaluationHistory {
  id: number;
  submission_id: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
  total_score: number;
  evaluated_at: string;
  prompt_title: string;
  prompt_category: string;
  prompt_difficulty: string;
}

// ── Score Trend ──

export interface ScoreTrend {
  evaluated_at: string;
  total_score: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
}
