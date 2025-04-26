import { ApiProperty } from '@nestjs/swagger';
import { DailyAggregateDto } from './daily-aggregate.dto';
import { SensorType } from '@prisma/client';

/**
 * DTO representing analytics data for a sensor over a time period
 */
export class SensorAnalyticsDto {
  @ApiProperty({ description: 'Sensor ID', example: 123 })
  sensorId: number;

  @ApiProperty({ description: 'Type of sensor data', enum: SensorType, example: SensorType.TEMPERATURE })
  sensorType: SensorType;

  @ApiProperty({ description: 'Unit of measurement', example: '°C' })
  unit: string;

  @ApiProperty({
    description: 'Daily aggregated data',
    type: () => [DailyAggregateDto],
  })
  dailyData: DailyAggregateDto[];
}
