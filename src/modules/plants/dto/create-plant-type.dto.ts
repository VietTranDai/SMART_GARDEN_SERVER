import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional } from 'class-validator';

export class CreatePlantTypeDto {
  @ApiProperty({ description: 'PlantType name', example: 'Cây cảnh' })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Short description',
    example: 'Các loại cây trồng làm cảnh',
  })
  @IsString()
  @IsOptional()
  description?: string;
}
