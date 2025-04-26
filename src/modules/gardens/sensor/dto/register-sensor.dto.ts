import { ApiProperty } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsPositive,
  IsString,
} from 'class-validator';
import { SensorType } from '@prisma/client';

export class RegisterSensorDto {
  @ApiProperty({
    description: 'Garden ID where the sensor will be installed',
    example: 1,
  })
  @IsInt()
  @IsPositive()
  @IsNotEmpty()
  gardenId: number;

  @ApiProperty({
    description: 'Type of sensor',
    enum: SensorType,
    example: 'HUMIDITY',
  })
  @IsEnum(SensorType)
  @IsNotEmpty()
  type: SensorType;

  @ApiProperty({
    description: 'Name of the sensor',
    example: 'Main Garden Humidity Sensor',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiProperty({
    description: 'Description of the sensor',
    example: 'Measures soil humidity in the main garden area',
    required: false,
  })
  @IsString()
  @IsOptional()
  description?: string;

  @ApiProperty({
    description: 'Location of the sensor within the garden',
    example: 'North corner, near the tomato plants',
    required: false,
  })
  @IsString()
  @IsOptional()
  location?: string;

  @ApiProperty({
    description: 'Unit of measurement for sensor data',
    example: '°C',
    required: false,
  })
  @IsString()
  @IsOptional()
  unit?: string;
}
