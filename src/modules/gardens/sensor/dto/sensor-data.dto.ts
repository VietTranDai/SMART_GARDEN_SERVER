import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { SensorType } from '@prisma/client';

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

export class SensorDto {
  @ApiProperty({
    description: 'Unique ID of the sensor',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Unique key for the sensor',
    example: 'sensor_1a2b3c4d',
  })
  sensorKey: string;

  @ApiProperty({
    description: 'Type of sensor',
    enum: SensorType,
    example: 'HUMIDITY',
  })
  type: SensorType;

  @ApiProperty({
    description: 'ID of the garden where the sensor is installed',
    example: 1,
  })
  gardenId: number;

  @ApiPropertyOptional({
    description: 'Name of the sensor',
    example: 'Main Garden Humidity Sensor',
  })
  name?: string;

  @ApiPropertyOptional({
    description: 'Description of the sensor',
    example: 'Measures soil humidity in the main garden area',
  })
  description?: string;

  @ApiPropertyOptional({
    description: 'Location of the sensor within the garden',
    example: 'North corner, near the tomato plants',
  })
  location?: string;

  @ApiProperty({
    description: 'Timestamp when the sensor was created',
    example: '2023-09-20T10:15:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Timestamp when the sensor was last updated',
    example: '2023-09-25T08:30:00.000Z',
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
