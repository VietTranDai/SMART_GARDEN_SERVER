import { ApiProperty } from '@nestjs/swagger';

export class PlantTypeDto {
  @ApiProperty({ description: 'PlantType ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'PlantType name', example: 'Tomato' })
  name: string;

  @ApiProperty({
    description: 'Scientific name',
    example: 'Solanum lycopersicum',
    required: false,
  })
  scientificName?: string;

  @ApiProperty({
    description: 'PlantType family',
    example: 'Solanaceae',
    required: false,
  })
  family?: string;

  @ApiProperty({
    description: 'Short description',
    example: 'Likes sun, needs moderate water.',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Total growth duration in days',
    example: 90,
    required: false,
  })
  growthDuration?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
