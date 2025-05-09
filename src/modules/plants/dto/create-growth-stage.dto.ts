import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsNotEmpty,
  IsInt,
  IsNumber,
  Min,
  Max,
  IsOptional,
} from 'class-validator';

export class CreateGrowthStageDto {
  @ApiProperty({ description: 'ID of the related Plant', example: 1 })
  @IsNumber()
  @IsNotEmpty()
  plantId: number;

  @ApiProperty({ description: 'Stage name', example: 'Seeding' })
  @IsString()
  @IsNotEmpty()
  stageName: string;

  @ApiProperty({ description: 'Stage order', example: 1 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  order: number;

  @ApiProperty({ description: 'Duration of the stage in days', example: 7 })
  @IsInt()
  @IsNotEmpty()
  @Min(1)
  duration: number;

  @ApiPropertyOptional({
    description: 'Short description',
    example: 'Germination phase',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Minimum optimal temperature (°C)',
    example: 20,
  })
  @IsNumber()
  @IsNotEmpty()
  optimalTemperatureMin: number;

  @ApiProperty({
    description: 'Maximum optimal temperature (°C)',
    example: 30,
  })
  @IsNumber()
  @IsNotEmpty()
  optimalTemperatureMax: number;

  @ApiProperty({ description: 'Minimum optimal humidity (%)', example: 60 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  optimalHumidityMin: number;

  @ApiProperty({ description: 'Maximum optimal humidity (%)', example: 80 })
  @IsNumber()
  @IsNotEmpty()
  @Min(0)
  @Max(100)
  optimalHumidityMax: number;

  @ApiPropertyOptional({
    description: 'Minimum optimal soil pH',
    example: 5.5,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(14)
  optimalPHMin: number;

  @ApiPropertyOptional({
    description: 'Maximum optimal soil pH',
    example: 6.5,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  @Max(14)
  optimalPHMax: number;

  @ApiPropertyOptional({
    description: 'Minimum optimal light intensity (lux)',
    example: 5000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  optimalLightMin: number;

  @ApiPropertyOptional({
    description: 'Maximum optimal light intensity (lux)',
    example: 10000,
  })
  @IsNumber()
  @IsOptional()
  @Min(0)
  optimalLightMax: number;

  @ApiPropertyOptional({
    description: 'Light requirement',
    example: 'Full sun',
  })
  @IsString()
  @IsOptional()
  lightRequirement?: string;

  @ApiPropertyOptional({
    description: 'Water requirement',
    example: 'Moderate',
  })
  @IsString()
  @IsOptional()
  waterRequirement?: string;

  @ApiPropertyOptional({
    description: 'Nutrient requirement',
    example: 'NPK 10-10-10',
  })
  @IsString()
  @IsOptional()
  nutrientRequirement?: string;

  @ApiPropertyOptional({
    description: 'Care instructions',
    example: 'Keep soil moist',
  })
  @IsString()
  @IsOptional()
  careInstructions?: string;

  @ApiPropertyOptional({
    description: 'Pest/disease susceptibility',
    example: 'Aphids, Blight',
  })
  @IsString()
  @IsOptional()
  pestSusceptibility?: string;
}
