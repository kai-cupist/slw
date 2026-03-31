import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 평가 이력 목록 조회 DTO
 * PaginationDto를 상속하여 page/limit 파라미터를 재사용한다.
 * 현재는 추가 필터 없이 사용자의 전체 평가 이력을 페이지네이션으로 조회한다.
 */
export class GetEvaluationHistoryDto extends PaginationDto {}
