import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, Min, Max } from 'class-validator';
import { Type } from 'class-transformer';

export class SearchPostDto {
  @ApiPropertyOptional({ 
    description: 'Tìm kiếm tổng hợp trong title, content, plantName', 
    example: 'cà chua hữu cơ' 
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({ 
    description: 'Tìm kiếm theo tên tag', 
    example: 'hydroponic' 
  })
  @IsOptional()
  @IsString()
  tagName?: string;

  @ApiPropertyOptional({ 
    description: 'Lọc theo ID người làm vườn', 
    example: 1 
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  gardenerId?: number;

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
  @Max(100)
  limit?: number = 10;
} 