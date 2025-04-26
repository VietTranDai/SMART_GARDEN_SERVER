import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
  IsArray,
  ValidateNested,
  ArrayMinSize,
} from 'class-validator';

export class BulkSensorDataItemDto {
  @ApiProperty({
    description: 'Unique sensor key to identify the sensor',
    example: 'sensor_1a2b3c4d',
  })
  @IsString()
  @IsNotEmpty()
  sensorKey: string;

  @ApiProperty({
    description: 'Value recorded by the sensor',
    example: 78.5,
  })
  @IsNumber()
  value: number;

  @ApiPropertyOptional({
    description: 'Timestamp of when the reading was taken (ISO format)',
    example: '2023-09-25T08:30:00Z',
    default: 'Current time if not provided',
  })
  @IsDateString()
  @IsOptional()
  timestamp?: string;
}

export class BulkSensorDataDto {
  @ApiProperty({
    description: 'Array of sensor readings to record in bulk',
    type: [BulkSensorDataItemDto],
    minItems: 1,
  })
  @IsArray()
  @ValidateNested({ each: true })
  @ArrayMinSize(1)
  readings: BulkSensorDataItemDto[];

  @ApiPropertyOptional({
    description:
      'Garden Key - if provided, validates that all readings are from this garden',
    example: 'garden_1a2b3c4d',
  })
  @IsString()
  @IsOptional()
  gardenKey?: string;

  @ApiPropertyOptional({
    description: 'Device ID of the collector device',
    example: 'garden-hub-001',
  })
  @IsString()
  @IsOptional()
  deviceId?: string;
}

export class BulkSensorDataResponseDto {
  @ApiProperty({
    description: 'Number of sensor readings successfully processed',
    example: 5,
  })
  successful: number;

  @ApiProperty({
    description: 'Number of sensor readings that failed processing',
    example: 0,
  })
  failed: number;

  @ApiProperty({
    description: 'Array of error messages for readings that failed',
    type: [String],
    example: [],
  })
  errors: string[];

  @ApiProperty({
    description: 'Timestamp when the readings were processed',
    example: '2023-09-25T08:31:25.000Z',
  })
  processedAt: Date;
}
