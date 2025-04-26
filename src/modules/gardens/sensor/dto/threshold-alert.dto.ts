import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  Max,
  IsBoolean,
  IsInt,
} from 'class-validator';
import { SensorType } from '@prisma/client';

export enum ThresholdOperator {
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUAL = 'GREATER_THAN_OR_EQUAL',
  LESS_THAN_OR_EQUAL = 'LESS_THAN_OR_EQUAL',
  EQUAL = 'EQUAL',
  NOT_EQUAL = 'NOT_EQUAL',
}

export class CreateThresholdAlertDto {
  @ApiProperty({
    description: 'Sensor ID to set the threshold for',
    example: 1,
  })
  @IsInt()
  @IsNotEmpty()
  sensorId: number;

  @ApiProperty({
    description: 'Threshold value to trigger the alert',
    example: 30.0,
  })
  @IsNumber()
  @IsNotEmpty()
  thresholdValue: number;

  @ApiProperty({
    description: 'Operator to compare sensor value with the threshold',
    enum: ThresholdOperator,
    example: ThresholdOperator.GREATER_THAN,
  })
  @IsEnum(ThresholdOperator)
  @IsNotEmpty()
  operator: ThresholdOperator;

  @ApiPropertyOptional({
    description: 'Message to include in the alert',
    example:
      'Temperature is too high, consider opening windows or turning on fans',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'Whether the alert is enabled',
    example: true,
    default: true,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Min duration in seconds the condition must persist before alerting (to avoid false alarms)',
    example: 300,
    default: 0,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(86400) // Max 24 hours
  durationSeconds?: number;
}

export class ThresholdAlertDto {
  @ApiProperty({
    description: 'Unique ID of the threshold alert',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the associated sensor',
  })
  sensorId: number;

  @ApiProperty({
    description: 'ID of the associated garden',
  })
  gardenId: number;

  @ApiProperty({
    description: 'Type of the sensor',
    enum: SensorType,
  })
  sensorType: SensorType;

  @ApiProperty({
    description: 'Comparison operator',
    enum: ThresholdOperator,
  })
  operator: ThresholdOperator;

  @ApiProperty({
    description: 'Threshold value',
  })
  thresholdValue: number;

  @ApiPropertyOptional({
    description: 'Alert message',
  })
  message?: string;

  @ApiProperty({
    description: 'Is the alert enabled?',
  })
  enabled: boolean;

  @ApiPropertyOptional({
    description: 'Min duration in seconds',
  })
  durationSeconds?: number;

  @ApiPropertyOptional({
    description: 'When the alert last triggered',
  })
  lastTriggeredAt?: Date;

  @ApiProperty({
    description: 'When the alert was created',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the alert was last updated',
  })
  updatedAt: Date;
}

export class UpdateThresholdAlertDto {
  @ApiPropertyOptional({
    description: 'Threshold value to trigger the alert',
    example: 32.0,
  })
  @IsNumber()
  @IsOptional()
  thresholdValue?: number;

  @ApiPropertyOptional({
    description: 'Operator to compare sensor value with the threshold',
    enum: ThresholdOperator,
    example: ThresholdOperator.GREATER_THAN,
  })
  @IsEnum(ThresholdOperator)
  @IsOptional()
  operator?: ThresholdOperator;

  @ApiPropertyOptional({
    description: 'Message to include in the alert',
    example:
      'Temperature is too high, consider opening windows or turning on fans',
  })
  @IsString()
  @IsOptional()
  message?: string;

  @ApiPropertyOptional({
    description: 'Whether the alert is enabled',
    example: false,
  })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({
    description:
      'Min duration in seconds the condition must persist before alerting',
    example: 600,
  })
  @IsInt()
  @IsOptional()
  @Min(0)
  @Max(86400)
  durationSeconds?: number;
}
