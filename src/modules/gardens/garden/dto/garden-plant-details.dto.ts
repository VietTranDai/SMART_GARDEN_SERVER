import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class GrowthStageDto {
  @ApiProperty({ description: 'Growth stage ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Growth stage name', example: 'Seeding' })
  name: string;

  @ApiProperty({
    description: 'Order of this stage in growth cycle',
    example: 1,
  })
  order: number;

  @ApiProperty({ description: 'Duration of this stage in days', example: 14 })
  duration: number;

  @ApiPropertyOptional({
    description: 'Description of this growth stage',
    example: 'Initial growth from seed',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Care instructions for this stage',
    example: 'Keep soil moist and provide indirect light',
  })
  careInstructions?: string;
}

export class GardenPlantDetailsDto {
  @ApiProperty({ description: 'Garden ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'Garden name', example: 'My Tomato Garden' })
  gardenName: string;

  @ApiPropertyOptional({ description: 'Plant name', example: 'Tomato' })
  plantName: string | null;

  @ApiPropertyOptional({
    description: 'Current growth stage',
    example: 'Seeding',
  })
  currentGrowthStage: string | null;

  @ApiPropertyOptional({
    description: 'Date when the plant was started (ISO format)',
    example: '2023-04-15T00:00:00Z',
  })
  plantStartDate: Date | null;

  @ApiPropertyOptional({
    description: 'Total growth duration in days',
    example: 90,
  })
  growthDuration: number | null;

  @ApiProperty({
    description: 'Growth stages for this plant',
    type: [GrowthStageDto],
  })
  growthStages: GrowthStageDto[];

  @ApiProperty({
    description: 'Completion percentage of growth cycle',
    example: 35,
    minimum: 0,
    maximum: 100,
  })
  completionPercentage: number;
}
