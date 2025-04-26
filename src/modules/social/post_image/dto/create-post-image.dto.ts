import { ApiProperty } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsPositive,
  IsString,
  IsUrl,
} from 'class-validator';

export class CreatePostImageDto {
  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  @IsNotEmpty()
  @IsNumber()
  @IsPositive()
  postId: number;

  @ApiProperty({
    description: 'URL của hình ảnh',
    example: 'https://example.com/images/tomato.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  url: string;
}
