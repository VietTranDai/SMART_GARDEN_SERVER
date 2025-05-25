import { ApiProperty } from '@nestjs/swagger';
import { WeatherMain } from '@prisma/client';

/**
 * DTO for temperature conditions in weather advice
 */
export class TemperatureConditionsDto {
  @ApiProperty({ description: 'Minimum temperature in Celsius' })
  min: number;

  @ApiProperty({ description: 'Maximum temperature in Celsius' })
  max: number;
}

/**
 * DTO for humidity conditions in weather advice
 */
export class HumidityConditionsDto {
  @ApiProperty({ description: 'Minimum humidity percentage' })
  min: number;

  @ApiProperty({ description: 'Maximum humidity percentage' })
  max: number;
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
 * DTO for recovery timeline in weather advice
 */
export class RecoveryTimelineDto {
  @ApiProperty({ description: 'Immediate recovery actions/observations' })
  immediate: string;

  @ApiProperty({ description: 'Short-term recovery actions/observations' })
  shortTerm: string;

  @ApiProperty({ description: 'Medium-term recovery actions/observations' })
  mediumTerm: string;

  @ApiProperty({ description: 'Long-term recovery actions/observations' })
  longTerm: string;
}

/**
 * DTO for weather-based advice for garden care
 */
export class WeatherAdviceDto {
  // Core Information
  @ApiProperty({ description: 'Unique identifier for the advice' })
  id: number;

  @ApiProperty({ description: 'Short title for the advice' })
  title: string;

  @ApiProperty({ description: 'Detailed explanation of the advice' })
  description: string;

  // Detailed Guidance
  @ApiProperty({
    description: 'Step-by-step instructions for the advice',
    type: [String],
  })
  detailedSteps: string[];

  @ApiProperty({
    description: 'Reasons behind giving this advice',
    type: [String],
  })
  reasons: string[];

  @ApiProperty({
    description: 'Helpful tips related to the advice',
    type: [String],
  })
  tips: string[];

  @ApiProperty({
    description: 'Precautions to take while following the advice',
    type: [String],
    required: false,
  })
  precautions?: string[];

  // Personalization
  @ApiProperty({ description: 'Personalized message for the user' })
  personalizedMessage: string;

  @ApiProperty({
    description: 'Order in which this advice should be displayed',
    required: false,
  })
  displayOrder?: number;

  // Timing Information
  @ApiProperty({
    description: 'Recommended time of day to perform the activity',
    required: false,
  })
  bestTimeOfDay?: string;

  @ApiProperty({
    description: 'Estimated duration to complete the activity',
    required: false,
  })
  duration?: string;

  @ApiProperty({
    description: 'Recommended frequency for the activity',
    required: false,
  })
  frequency?: string;

  // Priority and Urgency
  @ApiProperty({
    description: 'Urgency level of the advice',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'],
  })
  urgencyLevel: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

  @ApiProperty({
    description: 'Difficulty level to implement the advice',
    enum: ['EASY', 'MEDIUM', 'HARD'],
  })
  difficultyLevel: 'EASY' | 'MEDIUM' | 'HARD';

  @ApiProperty({
    description: 'Priority level (1-5, with 5 being highest priority)',
    minimum: 1,
    maximum: 5,
  })
  priority: number;

  // Health and Impact
  @ApiProperty({
    description: 'Potential health impact on the plant',
    enum: ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'POSITIVE'],
    required: false,
  })
  healthImpact?: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL' | 'POSITIVE';

  // Environmental Conditions
  @ApiProperty({
    description: 'Weather condition this advice applies to',
    enum: WeatherMain,
  })
  weatherCondition: WeatherMain;

  @ApiProperty({
    description: 'Temperature range this advice applies to',
    type: TemperatureConditionsDto,
    required: false,
  })
  temperature?: TemperatureConditionsDto;

  @ApiProperty({
    description: 'Humidity range this advice applies to',
    type: HumidityConditionsDto,
    required: false,
  })
  humidity?: HumidityConditionsDto;

  @ApiProperty({
    description: 'Wind conditions this advice applies to',
    type: WindConditionsDto,
    required: false,
  })
  wind?: WindConditionsDto;

  // Advanced Features
  @ApiProperty({
    description: 'Potential risk factors if advice is not followed',
    type: [String],
    required: false,
  })
  riskFactors?: string[];

  @ApiProperty({
    description: 'Indicators of successful implementation of the advice',
    type: [String],
    required: false,
  })
  successIndicators?: string[];

  @ApiProperty({
    description: 'Timeline for plant recovery after implementing advice',
    type: RecoveryTimelineDto,
    required: false,
  })
  recoveryTimeline?: RecoveryTimelineDto;

  @ApiProperty({
    description: 'Links to related resources or further reading',
    type: [String],
    required: false,
  })
  relatedResources?: string[];

  // Metadata
  @ApiProperty({ description: 'Icon to represent this advice' })
  icon: string;

  @ApiProperty({
    description: 'Garden types this advice is most relevant for',
    type: [String],
  })
  applicableGardenTypes: string[];

  @ApiProperty({
    description: 'Specific plant types this advice is relevant for',
    type: [String],
    required: false,
  })
  plantTypes?: string[];

  @ApiProperty({
    description: 'Seasons this advice is most applicable to',
    type: [String],
    required: false,
  })
  seasonality?: string[];

  // Timestamps
  @ApiProperty({ description: 'Creation timestamp' })
  createdAt: string;

  @ApiProperty({ description: 'Last update timestamp' })
  updatedAt: string;
}
