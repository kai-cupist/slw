-- AI 평가 결과 테이블
-- 답안(submissions)에 대한 AI 평가 결과를 저장한다.
-- submission_id에 UNIQUE 제약을 두어 하나의 답안에 하나의 평가만 존재하도록 한다.
-- 4개 평가 항목(문법, 논리, 표현력, 주제 적절성)과 총점, 상세 피드백, 원본 응답을 저장한다.
CREATE TABLE evaluations (
    id SERIAL PRIMARY KEY,
    submission_id INTEGER NOT NULL UNIQUE REFERENCES submissions(id),
    grammar_score SMALLINT NOT NULL,
    logic_score SMALLINT NOT NULL,
    expression_score SMALLINT NOT NULL,
    relevance_score SMALLINT NOT NULL,
    total_score NUMERIC(3,1) NOT NULL,
    feedback JSONB NOT NULL,
    raw_response JSONB NOT NULL,
    evaluated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_grammar_score CHECK (grammar_score BETWEEN 1 AND 10),
    CONSTRAINT chk_logic_score CHECK (logic_score BETWEEN 1 AND 10),
    CONSTRAINT chk_expression_score CHECK (expression_score BETWEEN 1 AND 10),
    CONSTRAINT chk_relevance_score CHECK (relevance_score BETWEEN 1 AND 10)
);

-- submission_id로 평가 결과 조회용 인덱스 (UNIQUE 제약이 이미 인덱스를 생성하므로 별도 불필요)
-- 사용자별 평가 이력 조회를 위해 submissions 테이블과 JOIN할 때 submission_id 인덱스가 사용됨
