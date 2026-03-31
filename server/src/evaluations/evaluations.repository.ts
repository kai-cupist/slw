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
}
