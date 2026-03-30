import { Controller, Get, ServiceUnavailableException } from '@nestjs/common';
import { DatabaseService } from './database/database.service';

@Controller()
export class AppController {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 헬스체크 엔드포인트
   * DB 연결 상태를 확인하여 서비스 가용성을 판단한다.
   */
  @Get('health')
  async healthCheck() {
    try {
      await this.db.query('SELECT 1');
      return { status: 'ok', database: 'connected' };
    } catch {
      throw new ServiceUnavailableException('데이터베이스 연결 실패');
    }
  }
}
