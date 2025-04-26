import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
import { SensorType } from '@prisma/client';

export class UpdateSensorDto {
  @ApiPropertyOptional({
    description: 'Type of sensor',
    enum: SensorType,
    example: 'HUMIDITY',
  })
  @IsEnum(SensorType)
  @IsOptional()
  type?: SensorType;

  @ApiPropertyOptional({
    description: 'Name of the sensor',
    example: 'Main Garden Humidity Sensor',
  })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the sensor',
    example: 'Measures soil humidity in the main garden area',
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Location of the sensor within the garden',
    example: 'North corner, near the tomato plants',
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Unit of measurement for sensor data',
    example: '%',
    required: false,
  })
  @IsString()
  @IsOptional()
  unit?: string;
}
