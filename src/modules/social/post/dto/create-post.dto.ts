import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsString,
  IsPositive,
} from 'class-validator';

export class CreatePostDto {
  @ApiProperty({
    description: 'Tiêu đề bài viết',
    example: 'Cách trồng cà chua trong chậu',
  })
  @IsString()
  @IsNotEmpty()
  title: string;

  @ApiProperty({
    description: 'Nội dung bài viết',
    example: 'Bài viết hướng dẫn chi tiết cách trồng cà chua...',
  })
  @IsString()
  @IsNotEmpty()
  content: string;

  @ApiPropertyOptional({
    description: 'ID của khu vườn liên quan (nếu có)',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsOptional()
  gardenId?: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  @IsString()
  @IsOptional()
  plantName?: string;

  @ApiPropertyOptional({
    description: 'Giai đoạn phát triển của cây',
    example: 'Seedling',
  })
  @IsString()
  @IsOptional()
  plantGrowStage?: string;

  @ApiPropertyOptional({
    description: 'Danh sách ID của các thẻ',
    type: [Number],
    example: [1, 2, 3],
  })
  @IsOptional()
  tagIds?: number[];

  @ApiPropertyOptional({
    description: 'Danh sách URL của các hình ảnh',
    type: [String],
    example: ['http://example.com/image1.jpg'],
  })
  @IsOptional()
  imageUrls?: string[];
}
