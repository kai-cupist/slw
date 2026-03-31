import { Injectable } from '@nestjs/common';
import { DatabaseService } from '../database/database.service';
import { PoolClient } from 'pg';

/**
 * 평가 결과 엔티티 인터페이스
 * evaluations 테이블의 컬럼과 1:1 매핑된다.
 */
export interface Evaluation {
  id: number;
  submission_id: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
  total_score: number;
  feedback: {
    grammar: string;
    logic: string;
    expression: string;
    relevance: string;
    overall: string;
  };
  raw_response: Record<string, unknown>;
  evaluated_at: Date;
}

/**
 * 평가 결과 레포지토리
 * DatabaseService를 주입받아 evaluations 테이블에 Raw SQL 쿼리를 실행한다.
 * 모든 쿼리는 파라미터 바인딩($1, $2...)을 사용하여 SQL Injection을 방지한다.
 */
@Injectable()
export class EvaluationsRepository {
  constructor(private readonly db: DatabaseService) {}

  /**
   * 평가 결과를 저장한다.
   * 트랜잭션 내에서 호출될 수 있도록 PoolClient를 선택적으로 받는다.
   *
   * @param params - 평가 결과 데이터
   * @param client - 트랜잭션 PoolClient (선택)
   * @returns 저장된 평가 결과
   */
  async create(
    params: {
      submissionId: number;
      grammarScore: number;
      logicScore: number;
      expressionScore: number;
      relevanceScore: number;
      totalScore: number;
      feedback: Record<string, string>;
      rawResponse: Record<string, unknown>;
    },
    client?: PoolClient,
  ): Promise<Evaluation> {
    const sql = `
      INSERT INTO evaluations (
        submission_id, grammar_score, logic_score, expression_score,
        relevance_score, total_score, feedback, raw_response
      )
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      RETURNING id, submission_id, grammar_score, logic_score,
                expression_score, relevance_score, total_score,
                feedback, raw_response, evaluated_at
    `;
    const values = [
      params.submissionId,
      params.grammarScore,
      params.logicScore,
      params.expressionScore,
      params.relevanceScore,
      params.totalScore,
      JSON.stringify(params.feedback),
      JSON.stringify(params.rawResponse),
    ];

    if (client) {
      const result = await client.query(sql, values);
      return result.rows[0] as Evaluation;
    }

    const result = await this.db.queryOne<Evaluation>(sql, values);
    return result!;
  }

  /**
   * submission_id로 평가 결과를 조회한다.
   * evaluations 테이블의 UNIQUE 제약에 의해 최대 1건만 반환된다.
   *
   * @param submissionId - 답안 ID
   * @returns 평가 결과 또는 null
   */
  async findBySubmissionId(submissionId: number): Promise<Evaluation | null> {
    return this.db.queryOne<Evaluation>(
      `SELECT id, submission_id, grammar_score, logic_score,
              expression_score, relevance_score, total_score,
              feedback, raw_response, evaluated_at
       FROM evaluations
       WHERE submission_id = $1`,
      [submissionId],
    );
  }

  /**
   * 사용자의 평가 이력 목록을 페이지네이션으로 조회한다.
   * evaluations → submissions → prompts 3테이블 JOIN으로
   * 주제 정보(title, category, difficulty) + 점수 + 평가일을 반환한다.
   *
   * @param userId - 사용자 ID
   * @param offset - 건너뛸 행 수
   * @param limit - 조회할 최대 행 수
   * @returns 평가 이력 배열과 총 건수
   */
  async findHistoryByUser(
    userId: string,
    offset: number,
    limit: number,
  ): Promise<{ rows: EvaluationHistory[]; total: number }> {
    const whereClause = `WHERE s.user_id = $1 AND s.deleted_at IS NULL`;

    const countQuery = `
      SELECT COUNT(*) as total
      FROM evaluations e
      JOIN submissions s ON e.submission_id = s.id
      ${whereClause}
    `;

    const dataQuery = `
      SELECT e.id, e.submission_id, e.grammar_score, e.logic_score,
             e.expression_score, e.relevance_score, e.total_score,
             e.evaluated_at,
             p.title as prompt_title, p.category as prompt_category,
             p.difficulty as prompt_difficulty
      FROM evaluations e
      JOIN submissions s ON e.submission_id = s.id
      JOIN prompts p ON s.prompt_id = p.id
      ${whereClause}
      ORDER BY e.evaluated_at DESC
      LIMIT $2 OFFSET $3
    `;

    const [countResult, rows] = await Promise.all([
      this.db.queryOne<{ total: string }>(countQuery, [userId]),
      this.db.query<EvaluationHistory>(dataQuery, [userId, limit, offset]),
    ]);

    return { rows, total: parseInt(countResult?.total ?? '0', 10) };
  }

  /**
   * 사용자의 점수 추이를 조회한다.
   * 평가일 오름차순(과거→최근)으로 점수 데이터를 반환한다.
   * limit을 지정하면 최근 N건만 반환한다.
   *
   * @param userId - 사용자 ID
   * @param limit - 조회할 최근 건수 (미지정 시 전체)
   * @returns 점수 추이 배열
   */
  async findScoreTrendByUser(
    userId: string,
    limit?: number,
  ): Promise<ScoreTrend[]> {
    const params: unknown[] = [userId];
    let paramIndex = 2;

    // 최근 N건을 오름차순으로 가져오기 위해 서브쿼리로 DESC 정렬 후 다시 ASC 정렬
    let limitClause = '';
    if (limit) {
      limitClause = `LIMIT $${paramIndex}`;
      params.push(limit);
    }

    const sql = `
      SELECT evaluated_at, total_score, grammar_score,
             logic_score, expression_score, relevance_score
      FROM (
        SELECT e.evaluated_at, e.total_score, e.grammar_score,
               e.logic_score, e.expression_score, e.relevance_score
        FROM evaluations e
        JOIN submissions s ON e.submission_id = s.id
        WHERE s.user_id = $1 AND s.deleted_at IS NULL
        ORDER BY e.evaluated_at DESC
        ${limitClause}
      ) sub
      ORDER BY evaluated_at ASC
    `;

    return this.db.query<ScoreTrend>(sql, params);
  }
}

/**
 * 평가 이력 항목 인터페이스
 * evaluations + submissions + prompts JOIN 결과의 일부 컬럼
 */
export interface EvaluationHistory {
  id: number;
  submission_id: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
  total_score: number;
  evaluated_at: Date;
  prompt_title: string;
  prompt_category: string;
  prompt_difficulty: string;
}

/**
 * 점수 추이 인터페이스
 * 날짜별 점수 데이터 (프론트엔드에서 차트로 렌더링)
 */
export interface ScoreTrend {
  evaluated_at: Date;
  total_score: number;
  grammar_score: number;
  logic_score: number;
  expression_score: number;
  relevance_score: number;
}
