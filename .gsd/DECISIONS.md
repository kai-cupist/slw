- pg Pool을 @Global() 커스텀 프로바이더로 등록하여 전역 주입 가능하게 함
- connectionTimeoutMillis 5000ms로 컨테이너 시작 시 DB 준비 대기 안정성 확보
- DatabaseService에 query/queryOne/withTransaction 3개 메서드로 Raw SQL 인터페이스 확립
- 마이그레이션 디렉토리 fallback 로직으로 로컬/Docker 환경 모두 지원
- HttpExceptionFilter에서 ValidationPipe 에러의 message 배열을 details 필드로 변환
- Swagger UI를 /api-docs 경로에 설정
- VARCHAR + CHECK constraint 사용 (PostgreSQL ENUM 대신) - 마이그레이션 시 값 추가/변경이 용이
- Partial index로 deleted_at IS NULL 조건 적용 - 삭제된 행은 인덱스에서 제외하여 성능 최적화
- UserIdGuard는 전역이 아닌 컨트롤러 단위 적용 - prompts는 공개 데이터이므로 가드 불필요
- 동적 WHERE 절에 paramIndex 카운터 방식 사용 - 필터 조합에 따라 안전하게 파라미터 바인딩
- PromptsService를 export하여 SubmissionsModule 등에서 주제 존재 확인에 재사용
- 주제 API에 UserIdGuard 미적용 - 공개 데이터이므로 인증 불필요
- PromptsService 주입으로 prompt_id 유효성 검증 - SubmissionsModule에서 PromptsModule import
- soft delete 후 { deleted: true } 반환 - ResponseInterceptor가 Envelope 래핑
- submitted 상태 답안 수정/재제출 차단 시 구체적 한국어 에러 메시지 사용

---

## Decisions Table

| # | When | Scope | Decision | Choice | Rationale | Revisable? | Made By |
|---|------|-------|----------|--------|-----------|------------|---------|
| D001 | M001/S03 계획 | architecture | LLM API 호출과 DB 트랜잭션 분리 | LLM API 호출은 트랜잭션 밖에서, DB 저장(evaluations INSERT + submissions UPDATE)은 트랜잭션 안에서 처리 | LLM API 호출은 외부 I/O로 2~5초 소요되며, 트랜잭션 안에서 실행하면 그 동안 DB 커넥션을 점유한다. API 호출 결과를 받은 후 DB 쓰기만 트랜잭션으로 묶으면 커넥션 점유 시간이 최소화되고, LLM 실패 시 DB 변경 없이 깔끔하게 에러를 반환할 수 있다. | Yes | agent |
| D002 | M001/S03/T02 | architecture | LLM 호출과 DB 저장의 트랜잭션 경계 | LLM 호출은 트랜잭션 밖에서, DB 저장(evaluations INSERT + submissions UPDATE)은 트랜잭션 안에서 처리 | 외부 API 호출을 트랜잭션 안에 넣으면 DB 커넥션을 오래 점유하고, 타임아웃 시 롤백 비용이 커진다. LLM 호출 후 결과를 받은 뒤에만 DB에 쓰면, API 실패 시 DB 상태가 깨끗하게 유지된다. | Yes | agent |
| D003 | M001/S03/T02 | architecture | 중복 평가 요청 처리 전략 | 중복 평가 요청 시 에러 대신 기존 결과 반환으로 멱등성 확보 | 네트워크 불안정 시 클라이언트가 재시도할 수 있으므로, 이미 evaluated된 답안에 대해 409 에러를 반환하는 대신 기존 결과를 반환하면 클라이언트 로직이 단순해지고 무료 API 호출 한도를 절약한다. | Yes | agent |
| D004 | M001/S03/T03 | pattern | NestJS 컨트롤러 라우트 선언 순서 | 구체적 경로(/history, /scores/trend)를 파라미터 경로(/:submissionId)보다 먼저 선언하여 라우트 충돌 방지 | NestJS(Express)는 라우트를 선언 순서대로 매칭한다. /:submissionId가 먼저 선언되면 /history를 submissionId로 인식하여 의도하지 않은 핸들러가 호출된다. 구체적 경로를 먼저 선언하면 이 문제를 구조적으로 방지할 수 있다. | Yes | agent |
| D005 |  | architecture | Expo 프로젝트 생성 방식 | CNG(Continuous Native Generation) 구조 — ios/android 디렉토리를 gitignore하고 npx expo prebuild로 필요 시 생성 | 사용자가 CNG 구조를 명시적으로 요청. Expo 공식 기본값이며, 네이티브 디렉토리를 코드 관리에서 제외하여 프로젝트 유지보수가 단순해짐 | Yes | human |
| D006 | M001/S04 계획 | architecture | Expo 프로젝트 구조 및 프론트엔드 상태 관리 전략 | CNG 방식으로 mobile/ 디렉토리에 Expo SDK 55 프로젝트 생성. ios/, android/ 디렉토리를 gitignore하고 npx expo prebuild로 필요 시 생성. Zustand + AsyncStorage로 userId 관리, fetch/useEffect로 서버 상태 직접 관리(TanStack Query 미사용) | CNG는 Expo 권장 방식으로 네이티브 디렉토리를 git에서 제외하여 관리 부담 최소화. 학습 목적 프로젝트이므로 서버 상태를 직접 구현하여 fetch/useEffect 패턴 학습. Zustand는 v1의 단순한 상태(userId)에 적합한 가벼운 스토어. | Yes | agent |
| D007 |  | requirement | APP-02: 앱에서 답안을 작성하고 임시저장/제출할 수 있다 | validated | S04/T03에서 write/[submissionId] 화면으로 답안 작성/임시저장/제출 구현. 미저장 변경사항 자동 저장 후 submit+evaluate 순차 호출. | Yes | agent |
