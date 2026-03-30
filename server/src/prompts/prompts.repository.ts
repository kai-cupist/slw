import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * 쓰기 주제 엔티티 인터페이스
 * prompts 테이블의 컬럼과 1:1 매핑된다.
 */
export interface Prompt {
  id: number;
  title: string;
  description: string;
  category: string;
  difficulty: string;
  created_at: Date;
  updated_at: Date;
}

/**
 * 쓰기 주제 레포지토리
 * DatabaseService를 주입받아 prompts 테이블에 Raw SQL 쿼리를 실행한다.
 * 모든 쿼리는 파라미터 바인딩($1, $2...)을 사용하여 SQL Injection을 방지한다.
 */
@Injectable()
export class PromptsRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 쓰기 주제 목록을 조회한다.
   * 동적 WHERE 절을 paramIndex 카운터 방식으로 구성하여
   * 필터 조합에 따라 안전하게 파라미터를 바인딩한다.
   *
   * @param filters - category, difficulty 필터 (선택)
   * @param offset - 건너뛸 행 수
   * @param limit - 조회할 최대 행 수
   * @returns 결과 행 배열과 총 건수
   */
  async findAll(
    filters: { category?: string; difficulty?: string },
    offset: number,
    limit: number,
  ): Promise<{ rows: Prompt[]; total: number }> {
    // 동적 WHERE 절 구성 (paramIndex 카운터 방식)
    const conditions: string[] = [];
    const params: unknown[] = [];
    let paramIndex = 1;

    if (filters.category) {
      conditions.push(`category = $${paramIndex++}`);
      params.push(filters.category);
    }
    if (filters.difficulty) {
      conditions.push(`difficulty = $${paramIndex++}`);
      params.push(filters.difficulty);
    }

    const whereClause =
      conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // COUNT와 SELECT에 동일한 WHERE 절을 공유하여 데이터 불일치를 방지한다.
    const countQuery = `SELECT COUNT(*) as total FROM prompts ${whereClause}`;
    const dataQuery = `
      SELECT id, title, description, category, difficulty, created_at, updated_at
      FROM prompts ${whereClause}
      ORDER BY created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const [countResult, rows] = await Promise.all([
      this.db.queryOne<{ total: string }>(countQuery, [...params]),
      this.db.query<Prompt>(dataQuery, [...params, limit, offset]),
    ]);

    // PostgreSQL의 COUNT()는 문자열로 반환되므로 parseInt로 변환한다.
    return { rows, total: parseInt(countResult?.total ?? '0', 10) };
  }

  /**
   * ID로 쓰기 주제 하나를 조회한다.
   * @param id - 주제 ID
   * @returns 주제 객체 또는 null
   */
  async findOneById(id: number): Promise<Prompt | null> {
    return this.db.queryOne<Prompt>(
      'SELECT id, title, description, category, difficulty, created_at, updated_at FROM prompts WHERE id = $1',
      [id],
    );
  }
}
