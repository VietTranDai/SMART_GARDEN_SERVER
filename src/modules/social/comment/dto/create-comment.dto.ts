import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';

export class CreateCommentDto {
  @ApiProperty({ description: 'ID của bài viết được bình luận', example: 1 })
  @IsInt()
  @IsPositive()
  postId: number;

  @ApiProperty({
    description: 'Nội dung bình luận',
    example: 'Bài viết rất hữu ích!',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'ID của bình luận cha (nếu là trả lời cho bình luận khác)',
    example: 5,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  parentId?: number;
}
