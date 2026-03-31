import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Max, Min } from 'class-validator';

/**
 * 점수 추이 조회 DTO
 * limit 파라미터로 최근 N건을 제한한다.
 * limit을 지정하지 않으면 전체 평가 기록을 반환한다.
 */
export class GetScoreTrendDto {
  @ApiPropertyOptional({
    description: '조회할 최근 평가 건수 (미지정 시 전체)',
    minimum: 1,
    maximum: 100,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
