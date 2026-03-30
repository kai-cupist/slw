-- 답안(제출물) 테이블
-- 사용자가 작성한 쓰기 답안을 저장한다.
-- prompt_id FK로 주제와 연결하고, soft delete를 위한 deleted_at 컬럼을 포함한다.
-- status는 draft(임시저장)와 submitted(최종 제출) 두 가지 상태만 허용한다.
CREATE TABLE submissions (
    id SERIAL PRIMARY KEY,
    prompt_id INTEGER NOT NULL REFERENCES prompts(id),
    user_id VARCHAR(100) NOT NULL,
    content TEXT NOT NULL DEFAULT '',
    status VARCHAR(20) NOT NULL DEFAULT 'draft',
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    deleted_at TIMESTAMP,
    CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted'))
);

-- 사용자별 답안 조회용 부분 인덱스 (삭제되지 않은 것만)
CREATE INDEX idx_submissions_user_id ON submissions (user_id) WHERE deleted_at IS NULL;

-- 주제별 답안 조회용 부분 인덱스 (삭제되지 않은 것만)
CREATE INDEX idx_submissions_prompt_id ON submissions (prompt_id) WHERE deleted_at IS NULL;

-- 사용자가 특정 주제에 대해 작성 중인 임시저장 답안 조회용 복합 부분 인덱스
CREATE INDEX idx_submissions_user_prompt_draft ON submissions (user_id, prompt_id)
    WHERE status = 'draft' AND deleted_at IS NULL;
