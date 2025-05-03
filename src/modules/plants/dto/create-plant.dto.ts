import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsNumber,
} from 'class-validator';

export class CreatePlantDto {
  @ApiPropertyOptional({ description: 'Plant type ID', example: 1 })
  @IsNumber()
  @IsOptional()
  plantTypeId?: number;

  @ApiProperty({ description: 'Plant name', example: 'Tomato' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Scientific name',
    example: 'Solanum lycopersicum',
  })
  @IsString()
  @IsOptional()
  scientificName?: string;

  @ApiPropertyOptional({
    description: 'Plant family',
    example: 'Solanaceae',
  })
  @IsString()
  @IsOptional()
  family?: string;

  @ApiPropertyOptional({
    description: 'Short description',
    example: 'Likes sun, needs moderate water.',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Total growth duration in days',
    example: 90,
  })
  @IsInt()
  @IsOptional()
  growthDuration?: number;
}
