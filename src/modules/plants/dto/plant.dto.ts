import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PlantTypeDto } from './plant-type.dto';

export class PlantDto {
  @ApiProperty({ description: 'Plant ID', example: 1 })
  id: number;

  @ApiPropertyOptional({
    description: 'Plant type relationship',
    type: () => PlantTypeDto,
  })
  plantType?: PlantTypeDto;

  @ApiPropertyOptional({ description: 'Plant type ID', example: 1 })
  plantTypeId?: number;

  @ApiProperty({ description: 'Plant name', example: 'Tomato' })
  name: string;

  @ApiPropertyOptional({
    description: 'Scientific name',
    example: 'Solanum lycopersicum',
  })
  scientificName?: string;

  @ApiPropertyOptional({
    description: 'Plant family',
    example: 'Solanaceae',
  })
  family?: string;

  @ApiPropertyOptional({
    description: 'Short description',
    example: 'Likes sun, needs moderate water.',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Total growth duration in days',
    example: 90,
  })
  growthDuration?: number;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
