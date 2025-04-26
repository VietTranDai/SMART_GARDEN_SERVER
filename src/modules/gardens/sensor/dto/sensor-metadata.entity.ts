import { ApiProperty } from '@nestjs/swagger';

export class SensorMetadata {
  @ApiProperty({
    description: 'Sensor ID that this metadata belongs to',
    example: 1,
  })
  sensorId: number;

  @ApiProperty({
    description: 'Name of the sensor',
    example: 'Main Garden Humidity Sensor',
  })
  name: string;

  @ApiProperty({
    description: 'Description of the sensor',
    example: 'Measures soil humidity in the main garden area',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Location of the sensor within the garden',
    example: 'North corner, near the tomato plants',
    required: false,
  })
  location?: string;

  @ApiProperty({
    description: 'Unit of measurement for the sensor data',
    example: '°C',
    required: false,
  })
  unit?: string;

  @ApiProperty({
    description: 'When the metadata was created',
    example: '2023-09-25T08:31:25.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the metadata was last updated',
    example: '2023-09-25T08:31:25.000Z',
  })
  updatedAt: Date;
}
