import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * X-User-Id 헤더 값 추출 데코레이터
 * UserIdGuard가 헤더 존재 여부를 검증한 후, 이 데코레이터로 값을 추출한다.
 * 사용법: @UserId() userId: string
 */
export const UserId = createParamDecorator(
  (data: unknown, ctx: ExecutionContext): string => {
    const request = ctx.switchToHttp().getRequest();
    return request.headers['x-user-id'] as string;
  },
);
