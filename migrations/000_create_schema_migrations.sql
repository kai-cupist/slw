-- 마이그레이션 이력 추적 테이블
-- 적용된 SQL 마이그레이션 파일의 이름과 적용 시각을 기록한다.
CREATE TABLE IF NOT EXISTS schema_migrations (
    id SERIAL PRIMARY KEY,
    filename VARCHAR(255) NOT NULL UNIQUE,
    applied_at TIMESTAMP NOT NULL DEFAULT NOW()
);
