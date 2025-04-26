import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsDateString,
} from 'class-validator';

export class CreateSensorDataDto {
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
