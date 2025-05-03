import { ApiProperty } from '@nestjs/swagger';

export class PlantTypeDto {
  @ApiProperty({ description: 'PlantType ID', example: 1 })
  id: number;

  @ApiProperty({ description: 'PlantType name', example: 'Cây cảnh' })
  name: string;

  @ApiProperty({
    description: 'Short description',
    example: 'Các loại cây trồng làm cảnh',
    required: false,
  })
  description?: string;

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: Date;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: Date;
}
