// src/modules/sensor/dto/create-sensor.dto.ts
import { ApiProperty, PartialType, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsString,
  IsEnum,
  IsOptional,
} from 'class-validator';
import {
  SensorType,
  SensorUnit,
  Sensor as SensorModel,
  SensorData,
} from '@prisma/client';

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

  @ApiProperty({
    description: 'Trạng thái hoạt động của sensor',
    example: true,
  })
  isActive: boolean;

  @ApiPropertyOptional({
    description: 'Giá trị đo cuối cùng',
    example: 27.5,
  })
  lastReading: number;

  @ApiPropertyOptional({
    description: 'Thời gian đo cuối cùng',
    example: '2023-06-15T08:30:00Z',
  })
  lastReadingAt: string;

  @ApiProperty({ description: 'Ngày tạo', example: '2023-05-01T08:30:00Z' })
  createdAt: string;

  @ApiProperty({
    description: 'Ngày cập nhật',
    example: '2023-05-02T10:15:00Z',
  })
  updatedAt: string;
}

/**
 * Handwritten mappers from Prisma model to DTOs
 */

/**
 * Map a Prisma Sensor model to SensorDto
 * @param sensor The sensor model
 * @param latestReading Optional latest sensor reading data
 */
export function mapToSensorDto(
  sensor: SensorModel,
  latestReading?: SensorData | null,
): SensorDto {
  // Determine if sensor is active based on having data in the last 24 hours
  const isActive = latestReading
    ? new Date().getTime() - new Date(latestReading.timestamp).getTime() <
      24 * 60 * 60 * 1000
    : false;

  return {
    id: sensor.id,
    sensorKey: sensor.sensorKey,
    type: sensor.type,
    unit: sensor.unit,
    name: sensor.name,
    gardenId: sensor.gardenId,
    isActive: isActive,
    lastReading: latestReading?.value ?? 0,
    lastReadingAt:
      latestReading?.createdAt.toISOString() || new Date().toISOString(),
    createdAt: sensor.createdAt.toISOString(),
    updatedAt: sensor.updatedAt.toISOString(),
  };
}

/**
 * Map an array of Prisma Sensor models to SensorDto[]
 * @param sensors Array of sensor models
 * @param latestReadings Optional map of sensor IDs to their latest reading
 */
export function mapToSensorDtoList(
  sensors: SensorModel[],
  latestReadings?: Map<number, SensorData>,
): SensorDto[] {
  return sensors.map((sensor) =>
    mapToSensorDto(sensor, latestReadings?.get(sensor.id)),
  );
}
