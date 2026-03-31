import { useUserStore } from '../stores/userStore';
import type { ApiResponse } from './types';

/**
 * API 에러 클래스
 * 서버의 { success: false, error: { code, message } } 응답을 구조화한다.
 */
export class ApiError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: unknown,
    public readonly status?: number,
  ) {
    super(message);
    this.name = 'ApiError';
  }
}

/**
 * API 베이스 URL
 * EXPO_PUBLIC_ 접두사가 있는 환경변수는 Expo에서 클라이언트에 번들링된다.
 */
const BASE_URL = process.env.EXPO_PUBLIC_API_URL ?? 'http://localhost:3100';

/**
 * 공통 fetch 래퍼
 * - envelope 파싱: success 필드를 확인하여 data를 추출하거나 ApiError를 throw
 * - X-User-Id 자동 주입: userStore에 userId가 있으면 헤더에 추가
 * - Content-Type: JSON 기본 설정
 */
async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const url = `${BASE_URL}${path}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string> | undefined),
  };

  // userId가 로드되어 있으면 자동 주입
  const userId = useUserStore.getState().userId;
  if (userId) {
    headers['X-User-Id'] = userId;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  // 네트워크 레벨 에러 (non-JSON 응답 등)
  if (
    !response.ok &&
    response.headers.get('content-type')?.includes('application/json') === false
  ) {
    throw new ApiError(
      'NETWORK_ERROR',
      `HTTP ${response.status}: ${response.statusText}`,
      undefined,
      response.status,
    );
  }

  const json: ApiResponse<T> = await response.json();

  if (!json.success) {
    throw new ApiError(
      json.error.code,
      json.error.message,
      json.error.details,
      response.status,
    );
  }

  return json.data;
}

// ── Public API ──

export const api = {
  get: <T>(path: string) => request<T>(path, { method: 'GET' }),

  post: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'POST',
      body: JSON.stringify(body),
    }),

  put: <T>(path: string, body: unknown) =>
    request<T>(path, {
      method: 'PUT',
      body: JSON.stringify(body),
    }),

  patch: <T>(path: string, body?: unknown) =>
    request<T>(path, {
      method: 'PATCH',
      ...(body !== undefined ? { body: JSON.stringify(body) } : {}),
    }),

  delete: <T>(path: string) => request<T>(path, { method: 'DELETE' }),
};
