import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsInt, IsOptional, IsString, MaxLength, Min } from 'class-validator';

/**
 * 답안 생성 DTO
 * prompt_id는 필수이며, content는 선택(임시저장 시 빈 문자열 허용)이다.
 */
export class CreateSubmissionDto {
  @ApiProperty({ description: '주제 ID', example: 1 })
  @IsInt()
  @Min(1)
  prompt_id: number;

  @ApiPropertyOptional({
    description: '답안 내용 (임시저장 시 빈 문자열 가능)',
    example: '오늘은 날씨가 좋았다.',
    maxLength: 5000,
  })
  @IsOptional()
  @IsString()
  @MaxLength(5000)
  content?: string = '';
}
