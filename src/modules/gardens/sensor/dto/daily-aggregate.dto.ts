import { ApiProperty } from '@nestjs/swagger';

/**
 * DTO representing the daily aggregate data for a sensor
 */
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
