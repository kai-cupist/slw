/**
 * API 응답 Envelope 패턴 타입 정의
 * 모든 API 응답은 이 형식으로 통일된다.
 */

/** 성공 응답 형식 */
export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
}

/** 에러 응답 형식 */
export interface ApiErrorResponse {
  success: false;
  error: {
    code: string;
    message: string;
    details?: any;
  };
}

/** 통합 API 응답 타입 */
export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;
