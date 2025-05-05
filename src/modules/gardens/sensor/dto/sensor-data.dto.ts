import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorData, SensorType } from '@prisma/client';
import { SensorDto } from './sensor.dto';

export class SensorDataDto {
  @ApiProperty({
    description: 'Unique ID of the sensor data record',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'ID of the sensor that recorded this data',
    example: 1,
  })
  sensorId: number;

  @ApiProperty({
    description: 'Timestamp when the data was recorded',
    example: '2023-09-25T08:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  timestamp: Date;

  @ApiProperty({
    description: 'Measured value from the sensor',
    example: 78.5,
  })
  value: number;

  @ApiProperty({
    description: 'Timestamp when the record was created in the database',
    example: '2023-09-25T08:31:25.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the record was last updated',
    example: '2023-09-25T08:31:25.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}


export class LatestSensorDataDto {
  @ApiProperty({
    description: 'Sensor information',
    type: SensorDto,
  })
  sensor: SensorDto;

  @ApiProperty({
    description: 'Latest recorded data from this sensor',
    type: SensorDataDto,
  })
  latestData: SensorDataDto;
}

/**
 * Map a Prisma SensorData model to SensorDataDto
 */
export function mapToSensorDataDto(data: SensorData): SensorDataDto {
  return {
    id: data.id,
    sensorId: data.sensorId,
    timestamp: data.timestamp,
    value: data.value,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

/**
 * Map an array of Prisma SensorData models to SensorDataDto[]
 */
export function mapToSensorDataDtoList(dataList: SensorData[]): SensorDataDto[] {
  return dataList.map(mapToSensorDataDto);
}
