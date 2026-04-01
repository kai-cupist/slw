import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';

/**
 * 답안 엔티티 인터페이스
 * submissions 테이블의 컬럼과 1:1 매핑된다.
 */
export interface Submission {
  id: number;
  prompt_id: number;
  user_id: string;
  content: string;
  status: string;
  created_at: Date;
  updated_at: Date;
  deleted_at: Date | null;
}

/**
 * 답안 + 주제 정보 인터페이스
 * submissions JOIN prompts 결과를 매핑한다.
 */
export interface SubmissionWithPrompt extends Submission {
  prompt_title: string;
  prompt_category: string;
  prompt_difficulty: string;
}

/**
 * 답안 레포지토리
 * DatabaseService를 주입받아 submissions 테이블에 Raw SQL 쿼리를 실행한다.
 * 모든 SELECT 쿼리에 deleted_at IS NULL 조건을 포함한다.
 * 모든 쿼리는 파라미터 바인딩($1, $2...)을 사용하여 SQL Injection을 방지한다.
 */
@Injectable()
export class SubmissionsRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 새 답안을 생성한다.
   * @param userId - 사용자 ID
   * @param promptId - 주제 ID
   * @param content - 답안 내용 (빈 문자열 가능)
   * @returns 생성된 답안
   */
  async create(
    userId: string,
    promptId: number,
    content: string,
  ): Promise<Submission> {
    const result = await this.db.queryOne<Submission>(
      `INSERT INTO submissions (user_id, prompt_id, content)
       VALUES ($1, $2, $3)
       RETURNING id, prompt_id, user_id, content, status, created_at, updated_at, deleted_at`,
      [userId, promptId, content],
    );
    return result!;
  }

  /**
   * ID와 사용자 ID로 답안 하나를 조회한다.
   * 삭제된 답안은 조회되지 않는다 (deleted_at IS NULL).
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @returns 답안 또는 null
   */
  async findOneByIdAndUser(
    id: number,
    userId: string,
  ): Promise<Submission | null> {
    return this.db.queryOne<Submission>(
      `SELECT id, prompt_id, user_id, content, status, created_at, updated_at, deleted_at
       FROM submissions
       WHERE id = $1 AND user_id = $2 AND deleted_at IS NULL`,
      [id, userId],
    );
  }

  /**
   * 답안 내용을 수정한다.
   * @param id - 답안 ID
   * @param content - 수정할 내용
   * @returns 수정된 답안
   */
  async updateContent(id: number, content: string): Promise<Submission> {
    const result = await this.db.queryOne<Submission>(
      `UPDATE submissions
       SET content = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, prompt_id, user_id, content, status, created_at, updated_at, deleted_at`,
      [content, id],
    );
    return result!;
  }

  /**
   * 답안 상태를 변경한다.
   * @param id - 답안 ID
   * @param status - 변경할 상태 ('draft' | 'submitted')
   * @returns 상태가 변경된 답안
   */
  async updateStatus(id: number, status: string): Promise<Submission> {
    const result = await this.db.queryOne<Submission>(
      `UPDATE submissions
       SET status = $1, updated_at = NOW()
       WHERE id = $2
       RETURNING id, prompt_id, user_id, content, status, created_at, updated_at, deleted_at`,
      [status, id],
    );
    return result!;
  }

  /**
   * 답안을 soft delete한다. (deleted_at에 현재 시각을 설정)
   * @param id - 답안 ID
   */
  async softDelete(id: number): Promise<void> {
    await this.db.query(
      `UPDATE submissions SET deleted_at = NOW() WHERE id = $1`,
      [id],
    );
  }

  /**
   * 사용자의 답안 목록을 페이지네이션하여 조회한다.
   * prompts 테이블과 JOIN하여 주제 정보(title, category, difficulty)를 포함한다.
   * 동적 WHERE 절은 paramIndex 카운터를 사용하여 파라미터 순서를 안전하게 추적한다.
   * COUNT 쿼리와 데이터 쿼리는 동일한 WHERE 절을 공유한다.
   *
   * @param userId - 사용자 ID
   * @param filters - status 필터 (선택)
   * @param offset - 건너뛸 행 수
   * @param limit - 조회할 최대 행 수
   * @returns 결과 행 배열과 총 건수
   */
  async findAllByUser(
    userId: string,
    filters: { status?: string; promptId?: number },
    offset: number,
    limit: number,
  ): Promise<{ rows: SubmissionWithPrompt[]; total: number }> {
    // 동적 WHERE 절 구성 (paramIndex 카운터 방식)
    const conditions: string[] = ['s.user_id = $1', 's.deleted_at IS NULL'];
    const params: unknown[] = [userId];
    let paramIndex = 2;

    if (filters.status) {
      conditions.push(`s.status = $${paramIndex++}`);
      params.push(filters.status);
    }

    if (filters.promptId) {
      conditions.push(`s.prompt_id = $${paramIndex++}`);
      params.push(filters.promptId);
    }

    const whereClause = `WHERE ${conditions.join(' AND ')}`;

    // COUNT와 SELECT에 동일한 WHERE 절을 공유하여 데이터 불일치를 방지한다.
    const countQuery = `
      SELECT COUNT(*) as total
      FROM submissions s
      JOIN prompts p ON s.prompt_id = p.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT s.id, s.prompt_id, s.user_id, s.content, s.status,
             s.created_at, s.updated_at, s.deleted_at,
             p.title as prompt_title, p.category as prompt_category, p.difficulty as prompt_difficulty
      FROM submissions s
      JOIN prompts p ON s.prompt_id = p.id
      ${whereClause}
      ORDER BY s.created_at DESC
      LIMIT $${paramIndex++} OFFSET $${paramIndex}
    `;

    const [countResult, rows] = await Promise.all([
      this.db.queryOne<{ total: string }>(countQuery, [...params]),
      this.db.query<SubmissionWithPrompt>(dataQuery, [
        ...params,
        limit,
        offset,
      ]),
    ]);

    // PostgreSQL의 COUNT()는 문자열로 반환되므로 parseInt로 변환한다.
    return { rows, total: parseInt(countResult?.total ?? '0', 10) };
  }

  /**
   * ID와 사용자 ID로 답안 상세 정보를 조회한다.
   * prompts 테이블과 JOIN하여 주제 정보를 포함한다.
   * 삭제된 답안은 조회되지 않는다 (deleted_at IS NULL).
   *
   * @param id - 답안 ID
   * @param userId - 사용자 ID
   * @returns 주제 정보가 포함된 답안 또는 null
   */
  async findOneDetailByIdAndUser(
    id: number,
    userId: string,
  ): Promise<SubmissionWithPrompt | null> {
    return this.db.queryOne<SubmissionWithPrompt>(
      `SELECT s.id, s.prompt_id, s.user_id, s.content, s.status,
              s.created_at, s.updated_at, s.deleted_at,
              p.title as prompt_title, p.category as prompt_category, p.difficulty as prompt_difficulty
       FROM submissions s
       JOIN prompts p ON s.prompt_id = p.id
       WHERE s.id = $1 AND s.user_id = $2 AND s.deleted_at IS NULL`,
      [id, userId],
    );
  }
}
