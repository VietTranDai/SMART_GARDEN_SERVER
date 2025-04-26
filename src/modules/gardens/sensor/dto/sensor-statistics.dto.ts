import { ApiProperty } from '@nestjs/swagger';
import { SensorType } from '@prisma/client';

export class SensorStatisticsDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: 1,
  })
  sensorId: number;

  @ApiProperty({
    description: 'Type of sensor',
    enum: SensorType,
    example: 'TEMPERATURE',
  })
  sensorType: SensorType;

  @ApiProperty({
    description: 'Name of the sensor',
    example: 'Main Garden Temperature Sensor',
  })
  sensorName?: string;

  @ApiProperty({
    description: 'Start date of the statistics period',
    example: '2023-09-25T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date of the statistics period',
    example: '2023-09-25T23:59:59.999Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Total number of data points in the period',
    example: 240,
  })
  totalReadings: number;

  @ApiProperty({
    description: 'Average value of readings',
    example: 24.5,
  })
  averageValue: number;

  @ApiProperty({
    description: 'Minimum value recorded',
    example: 18.2,
  })
  minValue: number;

  @ApiProperty({
    description: 'Maximum value recorded',
    example: 32.8,
  })
  maxValue: number;

  @ApiProperty({
    description: 'Standard deviation of readings',
    example: 2.3,
  })
  stdDeviation: number;

  @ApiProperty({
    description: 'First reading timestamp in the period',
    example: '2023-09-25T00:05:00.000Z',
  })
  firstReadingTime: Date;

  @ApiProperty({
    description: 'Last reading timestamp in the period',
    example: '2023-09-25T23:55:00.000Z',
  })
  lastReadingTime: Date;
}

export class DailyAggregateDto {
  @ApiProperty({
    description: 'Date for this aggregate',
    example: '2023-09-25',
  })
  date: string;

  @ApiProperty({
    description: 'Average value for this day',
    example: 24.5,
  })
  averageValue: number;

  @ApiProperty({
    description: 'Minimum value for this day',
    example: 18.2,
  })
  minValue: number;

  @ApiProperty({
    description: 'Maximum value for this day',
    example: 32.8,
  })
  maxValue: number;

  @ApiProperty({
    description: 'Number of readings for this day',
    example: 24,
  })
  readingsCount: number;
}

export class SensorAnalyticsDto {
  @ApiProperty({
    description: 'Sensor ID',
    example: 1,
  })
  sensorId: number;

  @ApiProperty({
    description: 'Type of sensor',
    enum: SensorType,
    example: 'TEMPERATURE',
  })
  sensorType: SensorType;

  @ApiProperty({
    description: 'Daily aggregates',
    type: [DailyAggregateDto],
  })
  dailyAggregates: DailyAggregateDto[];

  @ApiProperty({
    description: 'Overall average value',
    example: 24.5,
  })
  overallAverage: number;

  @ApiProperty({
    description: 'Overall minimum value',
    example: 18.2,
  })
  overallMinimum: number;

  @ApiProperty({
    description: 'Overall maximum value',
    example: 32.8,
  })
  overallMaximum: number;

  @ApiProperty({
    description: 'Analytics period start date',
    example: '2023-09-01',
  })
  periodStart: string;

  @ApiProperty({
    description: 'Analytics period end date',
    example: '2023-09-30',
  })
  periodEnd: string;
}
