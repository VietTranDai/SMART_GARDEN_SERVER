import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, IsInt, IsEnum } from 'class-validator';
import { Type } from 'class-transformer';
import { SensorType } from '@prisma/client';

/**
 * DTO for query parameters when fetching sensor data
 */
export class SensorDataQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Start date for data retrieval (ISO string)',
    example: '2023-05-01T00:00:00Z',
  })
  @IsOptional()
  @IsString()
  startDate?: string;

  @ApiPropertyOptional({
    description: 'End date for data retrieval (ISO string)',
    example: '2023-05-31T23:59:59Z',
  })
  @IsOptional()
  @IsString()
  endDate?: string;

  @ApiPropertyOptional({
    description: 'Maximum number of records to retrieve',
    example: 100,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  limit?: number;

  @ApiPropertyOptional({
    description: 'Number of records to skip (for pagination)',
    example: 0,
  })
  @IsOptional()
  @IsInt()
  @Type(() => Number)
  offset?: number;
}

/**
 * Extended query params for garden sensor data that includes optional sensor type filter
 */
export class GardenSensorDataQueryParamsDto extends SensorDataQueryParamsDto {
  @ApiPropertyOptional({
    description: 'Filter data by sensor type',
    enum: SensorType,
  })
  @IsOptional()
  @IsEnum(SensorType)
  sensorType?: SensorType;
}
