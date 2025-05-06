// src/modules/sensor/dto/sensor-with-latest-reading.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { SensorDto } from './sensor.dto';
import { SensorDataDto } from './sensor-data.dto';

export class SensorWithLatestReadingDto {
  @ApiProperty({ type: SensorDto })
  sensor: SensorDto;

  @ApiProperty({ type: SensorDataDto, nullable: true })
  latestReading: SensorDataDto | null;
}
