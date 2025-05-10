// src/modules/sensor/dto/create-sensor.dto.ts
import { ApiProperty, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import { SensorType, SensorUnit, Sensor as SensorModel } from '@prisma/client';

export class CreateSensorDto {
  @ApiProperty({ description: 'ID của vườn mà sensor thuộc về', example: 1 })
  @IsInt()
  gardenId: number;

  @ApiProperty({
    description: 'Loại sensor',
    enum: SensorType,
    example: SensorType.TEMPERATURE,
  })
  @IsEnum(SensorType)
  type: SensorType;

  @ApiProperty({
    description: 'Đơn vị đo',
    enum: SensorUnit,
    example: SensorUnit.CELSIUS,
  })
  @IsEnum(SensorUnit)
  unit: SensorUnit;

  @ApiProperty({
    description: 'Tên sensor',
    example: 'Outdoor Temperature Sensor',
  })
  @IsString()
  @IsNotEmpty()
  name: string;

  @ApiPropertyOptional({
    description: 'Khóa duy nhất cho sensor (tự động tạo nếu không có)',
    example: 'temp_550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  @IsOptional()
  sensorKey?: string;
}

export class UpdateSensorDto extends PartialType(CreateSensorDto) {}

export class SensorDto {
  @ApiProperty({ description: 'ID sensor', example: 100 })
  id: number;

  @ApiProperty({
    description: 'Khóa UUID của sensor',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  sensorKey: string;

  @ApiProperty({
    description: 'Loại sensor',
    enum: SensorType,
    example: SensorType.HUMIDITY,
  })
  type: SensorType;

  @ApiProperty({
    description: 'Đơn vị đo',
    enum: SensorUnit,
    example: SensorUnit.PERCENT,
  })
  unit: SensorUnit;

  @ApiProperty({ description: 'Tên sensor', example: 'Soil Moisture Sensor A' })
  name: string;

  @ApiProperty({ description: 'ID của vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'Ngày tạo', example: '2025-05-01T08:30:00Z' })
  createdAt: Date;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2025-05-02T10:15:00Z',
  })
  updatedAt: Date;
}

/**
 * Handwritten mappers from Prisma model to DTOs
 */

/**
 * Map a Prisma Sensor model to SensorDto
 */
export function mapToSensorDto(sensor: SensorModel): SensorDto {
  return {
    id: sensor.id,
    sensorKey: sensor.sensorKey,
    type: sensor.type,
    unit: sensor.unit,
    name: sensor.name,
    gardenId: sensor.gardenId,
    createdAt: sensor.createdAt,
    updatedAt: sensor.updatedAt,
  };
}

/**
 * Map an array of Prisma Sensor models to SensorDto[]
 */
export function mapToSensorDtoList(sensors: SensorModel[]): SensorDto[] {
  return sensors.map(mapToSensorDto);
}
