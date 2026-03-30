import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  HttpException,
  HttpStatus,
} from '@nestjs/common';
import { Response } from 'express';

/**
 * HTTP 예외 필터
 * 모든 HttpException을 { success: false, error: { code, message, details? } } 형식으로 통일한다.
 * ValidationPipe에서 발생하는 에러의 message 배열은 details 필드로 변환한다.
 */
@Catch(HttpException)
export class HttpExceptionFilter implements ExceptionFilter {
  catch(exception: HttpException, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse();

    const errorMessage =
      typeof exceptionResponse === 'string'
        ? exceptionResponse
        : (exceptionResponse as any).message;

    response.status(status).json({
      success: false,
      error: {
        code: HttpStatus[status] || 'UNKNOWN_ERROR',
        message: Array.isArray(errorMessage)
          ? errorMessage.join(', ')
          : errorMessage,
        ...(Array.isArray(errorMessage) && { details: errorMessage }),
      },
    });
  }
}
