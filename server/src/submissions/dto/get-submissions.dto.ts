import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsEnum, IsInt, IsOptional } from 'class-validator';
import { PaginationDto } from '../../common/dto/pagination.dto';

/**
 * 답안 상태 열거형
 * draft: 임시저장, submitted: 최종 제출
 */
export enum SubmissionStatus {
  DRAFT = 'draft',
  SUBMITTED = 'submitted',
}

/**
 * 답안 목록 조회 DTO
 * PaginationDto를 상속하여 페이지네이션 + status + promptId 필터를 지원한다.
 */
export class GetSubmissionsDto extends PaginationDto {
  @ApiPropertyOptional({ description: '상태 필터', enum: SubmissionStatus })
  @IsOptional()
  @IsEnum(SubmissionStatus)
  status?: SubmissionStatus;

  @ApiPropertyOptional({ description: '주제 ID 필터 — 특정 프롬프트의 답안만 조회' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  promptId?: number;
}
