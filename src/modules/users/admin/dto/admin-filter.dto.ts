import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsInt } from 'class-validator';
import { Transform, Type } from 'class-transformer';

export class AdminFilterDto {
  @ApiPropertyOptional({
    description: 'Page number for pagination',
    example: 1,
    default: 1,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Number of items per page',
    example: 10,
    default: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  limit?: number = 10;

  @ApiPropertyOptional({
    description: 'Sort by field name',
    example: 'userId',
    default: 'userId',
  })
  @IsOptional()
  sortBy?: string = 'userId';

  @ApiPropertyOptional({
    description: 'Sort direction',
    example: 'DESC',
    default: 'ASC',
  })
  @IsOptional()
  @Transform(({ value }) => value.toUpperCase())
  sortOrder?: 'ASC' | 'DESC' = 'ASC';
}
