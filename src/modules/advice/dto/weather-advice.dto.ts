import { ApiProperty } from '@nestjs/swagger';
import { WeatherMain } from '@prisma/client';

/**
 * DTO for temperature range in weather advice
 */
export class TemperatureRangeDto {
  @ApiProperty({
    description: 'Minimum temperature in Celsius',
    required: false,
  })
  min?: number;

  @ApiProperty({
    description: 'Maximum temperature in Celsius',
    required: false,
  })
  max?: number;
}

/**
 * DTO for humidity range in weather advice
 */
export class HumidityRangeDto {
  @ApiProperty({ description: 'Minimum humidity percentage', required: false })
  min?: number;

  @ApiProperty({ description: 'Maximum humidity percentage', required: false })
  max?: number;
}

/**
 * DTO for wind conditions in weather advice
 */
export class WindConditionsDto {
  @ApiProperty({ description: 'Minimum wind speed in m/s', required: false })
  minSpeed?: number;

  @ApiProperty({ description: 'Maximum wind speed in m/s', required: false })
  maxSpeed?: number;
}

/**
 * DTO for weather-based advice for garden care
 */
export class WeatherAdviceDto {
  @ApiProperty({ description: 'Unique identifier for the advice' })
  id: number;

  @ApiProperty({ description: 'Short title for the advice' })
  title: string;

  @ApiProperty({ description: 'Detailed explanation of the advice' })
  description: string;

  @ApiProperty({
    description: 'Weather condition this advice applies to',
    enum: WeatherMain,
  })
  weatherCondition: WeatherMain;

  @ApiProperty({
    description: 'Temperature range this advice applies to',
    type: TemperatureRangeDto,
    required: false,
  })
  temperature?: TemperatureRangeDto;

  @ApiProperty({
    description: 'Humidity range this advice applies to',
    type: HumidityRangeDto,
    required: false,
  })
  humidity?: HumidityRangeDto;

  @ApiProperty({
    description: 'Wind conditions this advice applies to',
    type: WindConditionsDto,
    required: false,
  })
  wind?: WindConditionsDto;

  @ApiProperty({ description: 'Icon to represent this advice' })
  icon: string;

  @ApiProperty({
    description: 'Priority level (1-5, with 5 being highest priority)',
    minimum: 1,
    maximum: 5,
  })
  priority: number;

  @ApiProperty({
    description: 'Recommended time to perform the activity',
    required: false,
  })
  bestTimeOfDay?: string;

  @ApiProperty({
    description: 'Garden types this advice is most relevant for',
    type: [String],
    required: false,
  })
  applicableGardenTypes?: string[];

  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
