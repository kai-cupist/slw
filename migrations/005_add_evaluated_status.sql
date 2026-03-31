-- submissions 테이블의 status CHECK constraint에 'evaluated' 상태를 추가한다.
-- 기존 제약조건을 삭제하고 새로 생성하여 'draft', 'submitted', 'evaluated' 3가지 상태를 허용한다.
ALTER TABLE submissions DROP CONSTRAINT chk_status;
ALTER TABLE submissions ADD CONSTRAINT chk_status CHECK (status IN ('draft', 'submitted', 'evaluated'));
