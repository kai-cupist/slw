import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 쓰기 주제 난이도
 * DB CHECK constraint와 동일한 값을 사용한다.
 */
export enum Difficulty {
  BEGINNER = 'beginner',
  INTERMEDIATE = 'intermediate',
  ADVANCED = 'advanced',
}

/**
 * 쓰기 주제 카테고리
 * DB CHECK constraint와 동일한 값을 사용한다.
 */
export enum Category {
  DIARY = '일기',
  LETTER = '편지',
  REVIEW = '감상문',
  EXPLANATION = '설명문',
  ARGUMENT = '논설문',
}

/**
 * 쓰기 주제 목록 조회 DTO
 * PaginationDto를 상속하여 page/limit 파라미터를 재사용하고,
 * category와 difficulty 필터링 파라미터를 추가한다.
 */
export class GetPromptsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '카테고리 필터', enum: Category })
  @IsOptional()
  @IsEnum(Category)
  category?: Category;

  @ApiPropertyOptional({ description: '난이도 필터', enum: Difficulty })
  @IsOptional()
  @IsEnum(Difficulty)
  difficulty?: Difficulty;
}
