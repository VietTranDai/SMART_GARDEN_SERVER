import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsArray, Min, Max } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class SearchPostDto {
  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo tiêu đề bài viết', 
    example: 'cà chua' 
  })
  @IsOptional()
  @IsString()
  title?: string;

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo nội dung bài viết', 
    example: 'trồng cây' 
  })
  @IsOptional()
  @IsString()
  content?: string;

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo tên cây trồng', 
    example: 'Tomato' 
  })
  @IsOptional()
  @IsString()
  plantName?: string;

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo giai đoạn phát triển', 
    example: 'Seedling' 
  })
  @IsOptional()
  @IsString()
  plantGrowStage?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo ID người làm vườn', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gardenerId?: number;

  @ApiPropertyOptional({ 
    description: 'Lọc theo ID khu vườn', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gardenId?: number;

  @ApiPropertyOptional({ 
    description: 'Lọc theo danh sách ID thẻ', 
    example: [1, 2, 3],
    type: [Number]
  })
  @IsOptional()
  @IsArray()
  @Type(() => Number)
  @IsInt({ each: true })
  tagIds?: number[];

  @ApiPropertyOptional({ 
    description: 'Lọc theo tên thẻ', 
    example: 'hydroponic' 
  })
  @IsOptional()
  @IsString()
  tagName?: string;

  @ApiPropertyOptional({ 
    description: 'Số lượng vote tối thiểu', 
    example: 5 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minVotes?: number;

  @ApiPropertyOptional({ 
    description: 'Số trang', 
    example: 1,
    default: 1
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({ 
    description: 'Số bài viết mỗi trang', 
    example: 10,
    default: 10
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(50)
  limit?: number = 10;

  @ApiPropertyOptional({ 
    description: 'Sắp xếp theo', 
    example: 'createdAt',
    enum: ['createdAt', 'total_vote', 'title'],
    default: 'createdAt'
  })
  @IsOptional()
  @IsString()
  sortBy?: 'createdAt' | 'total_vote' | 'title' = 'createdAt';

  @ApiPropertyOptional({ 
    description: 'Thứ tự sắp xếp', 
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc'
  })
  @IsOptional()
  @IsString()
  sortOrder?: 'asc' | 'desc' = 'desc';

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm tổng hợp (tìm trong title, content, plantName)', 
    example: 'cà chua hữu cơ' 
  })
  @IsOptional()
  @IsString()
  generalSearch?: string;
} 