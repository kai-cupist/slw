/**
 * 페이지네이션 응답 인터페이스
 * 목록 API의 응답 데이터 형식을 정의한다.
 * 컨트롤러에서 이 형식으로 반환하면 ResponseInterceptor가 { success: true, data } 로 래핑한다.
 */
export interface PaginatedResponse<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
