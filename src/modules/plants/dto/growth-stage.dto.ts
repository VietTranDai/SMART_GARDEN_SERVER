import { ApiProperty } from '@nestjs/swagger';

export class GrowthStageDto {
  @ApiProperty({ description: 'GrowthStage ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID of the related PlantType', example: 1 })
  plantTypeId: number;

  @ApiProperty({ description: 'Stage name', example: 'Seeding' })
  stageName: string;

  @ApiProperty({ description: 'Stage order', example: 1 })
  order: number;

  @ApiProperty({ description: 'Duration of the stage in days', example: 7 })
  duration: number;

  @ApiProperty({
    description: 'Short description',
    example: 'Germination phase',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Minimum optimal temperature (°C)', example: 20 })
  optimalTemperatureMin: number;

  @ApiProperty({ description: 'Maximum optimal temperature (°C)', example: 30 })
  optimalTemperatureMax: number;

  @ApiProperty({ description: 'Minimum optimal humidity (%)', example: 60 })
  optimalHumidityMin: number;

  @ApiProperty({ description: 'Maximum optimal humidity (%)', example: 80 })
  optimalHumidityMax: number;

  @ApiProperty({
    description: 'Minimum optimal soil pH',
    example: 5.5,
    required: false,
  })
  optimalPHMin?: number;

  @ApiProperty({
    description: 'Maximum optimal soil pH',
    example: 6.5,
    required: false,
  })
  optimalPHMax?: number;

  @ApiProperty({
    description: 'Minimum optimal light intensity (lux)',
    example: 5000,
    required: false,
  })
  optimalLightMin?: number;

  @ApiProperty({
    description: 'Maximum optimal light intensity (lux)',
    example: 10000,
    required: false,
  })
  optimalLightMax?: number;

  @ApiProperty({
    description: 'Light requirement',
    example: 'Full sun',
    required: false,
  })
  lightRequirement?: string;

  @ApiProperty({
    description: 'Water requirement',
    example: 'Moderate',
    required: false,
  })
  waterRequirement?: string;

  @ApiProperty({
    description: 'Nutrient requirement',
    example: 'NPK 10-10-10',
    required: false,
  })
  nutrientRequirement?: string;

  @ApiProperty({
    description: 'Care instructions',
    example: 'Keep soil moist',
    required: false,
  })
  careInstructions?: string;

  @ApiProperty({
    description: 'Pest/disease susceptibility',
    example: 'Aphids, Blight',
    required: false,
  })
  pestSusceptibility?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
