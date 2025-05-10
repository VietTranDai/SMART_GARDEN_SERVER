import { ApiProperty } from '@nestjs/swagger';
import { SensorType, SensorUnit } from '@prisma/client';
import { SensorDataDto } from './sensor-data.dto';

/**
 * Extended data point for a trend graph
 */
export class TrendDataPointDto {
  @ApiProperty({
    description: 'Value at this point in the trend',
    example: 25.4,
  })
  value: number;

  @ApiProperty({
    description: 'Timestamp for this data point',
    example: '2023-09-25T08:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  timestamp: string;
}

/**
 * Extended sensor data with additional information for display
 */
export class SensorDataExtendedDto extends SensorDataDto {
  @ApiProperty({
    description: 'Type of the sensor',
    enum: SensorType,
    example: SensorType.TEMPERATURE,
  })
  type: SensorType;

  @ApiProperty({
    description: 'Human-readable name for this type of sensor',
    example: 'Temperature',
  })
  name: string;

  @ApiProperty({
    description: 'Unit of measurement',
    example: '°C',
  })
  unit: string;

  @ApiProperty({
    description: 'Last time the sensor was updated',
    example: '2023-09-25T08:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  lastUpdated: Date;

  @ApiProperty({
    description: 'ID of the garden this sensor belongs to',
    example: 1,
  })
  gardenId: number;

  @ApiProperty({
    description: 'Whether the sensor is currently active',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Historical trend data points',
    type: [TrendDataPointDto],
  })
  trendData?: TrendDataPointDto[];
}
