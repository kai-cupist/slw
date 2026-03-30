-- 쓰기 주제(프롬프트) 테이블
-- 5개 카테고리(일기, 편지, 감상문, 설명문, 논설문)와 3단계 난이도(beginner, intermediate, advanced)를
-- CHECK constraint로 제한하여 데이터 무결성을 보장한다.
CREATE TABLE prompts (
    id SERIAL PRIMARY KEY,
    title VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    category VARCHAR(50) NOT NULL,
    difficulty VARCHAR(20) NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT chk_difficulty CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
    CONSTRAINT chk_category CHECK (category IN ('일기', '편지', '감상문', '설명문', '논설문'))
);

-- 카테고리별 조회 성능을 위한 인덱스
CREATE INDEX idx_prompts_category ON prompts (category);

-- 난이도별 조회 성능을 위한 인덱스
CREATE INDEX idx_prompts_difficulty ON prompts (difficulty);
