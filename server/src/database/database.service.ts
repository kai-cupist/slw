import { Inject, Injectable, OnModuleDestroy } from '@nestjs/common';
import { Pool, PoolClient } from 'pg';
import { DATABASE_POOL } from './database.constants';

/**
 * 데이터베이스 서비스
 * pg Pool을 래핑하여 Raw SQL 쿼리 실행 메서드를 제공한다.
 * 모든 쿼리는 파라미터 바인딩($1, $2...)을 사용하여 SQL Injection을 방지한다.
 */
@Injectable()
export class DatabaseService implements OnModuleDestroy {
  constructor(@Inject(DATABASE_POOL) private readonly pool: Pool) {}

  /**
   * SQL 쿼리를 실행하고 모든 결과 행을 반환한다.
   * @param text - SQL 쿼리 문자열 (파라미터는 $1, $2... 형식)
   * @param params - 쿼리 파라미터 배열
   * @returns 결과 행 배열
   */
  async query<T = any>(text: string, params?: unknown[]): Promise<T[]> {
    const result = await this.pool.query(text, params);
    return result.rows;
  }

  /**
   * SQL 쿼리를 실행하고 첫 번째 결과 행만 반환한다.
   * 결과가 없으면 null을 반환한다.
   * @param text - SQL 쿼리 문자열 (파라미터는 $1, $2... 형식)
   * @param params - 쿼리 파라미터 배열
   * @returns 첫 번째 결과 행 또는 null
   */
  async queryOne<T = any>(
    text: string,
    params?: unknown[],
  ): Promise<T | null> {
    const result = await this.pool.query(text, params);
    return result.rows[0] ?? null;
  }

  /**
   * 트랜잭션 내에서 콜백 함수를 실행한다.
   * 콜백이 성공하면 COMMIT, 에러가 발생하면 ROLLBACK한다.
   * finally 블록에서 클라이언트를 반드시 릴리스한다.
   * @param callback - 트랜잭션 내에서 실행할 함수 (PoolClient를 인자로 받음)
   * @returns 콜백 함수의 반환값
   */
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>,
  ): Promise<T> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }

  /**
   * 모듈이 파괴될 때 커넥션 풀을 정리한다. (graceful shutdown)
   */
  async onModuleDestroy() {
    await this.pool.end();
  }
}
