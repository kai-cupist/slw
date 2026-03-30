import {
  Injectable,
  CanActivate,
  ExecutionContext,
  BadRequestException,
} from '@nestjs/common';
import type { Request } from 'express';

/**
 * X-User-Id 헤더 검증 가드
 * v1에서는 인증 없이 X-User-Id 헤더로 사용자를 식별한다.
 * 헤더가 없거나 빈 문자열이면 400 에러를 반환한다.
 * submissions 컨트롤러에만 @UseGuards(UserIdGuard)로 적용한다.
 * (prompts는 공개 데이터이므로 가드 불필요)
 */
@Injectable()
export class UserIdGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest<Request>();
    const userIdHeader = request.headers['x-user-id'];

    if (typeof userIdHeader !== 'string' || userIdHeader.trim() === '') {
      throw new BadRequestException('X-User-Id 헤더가 필요합니다');
    }

    return true;
  }
}
