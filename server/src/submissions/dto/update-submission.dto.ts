import { ApiProperty } from '@nestjs/swagger';
import { IsString, MaxLength } from 'class-validator';

/**
 * 답안 수정 DTO
 * content만 수정 가능하며, 필수 값이다 (빈 요청 방지).
 */
export class UpdateSubmissionDto {
  @ApiProperty({
    description: '수정할 답안 내용',
    example: '오늘은 날씨가 좋았다. 공원에서 산책했다.',
    maxLength: 5000,
  })
  @IsString()
  @MaxLength(5000)
  content: string;
}
