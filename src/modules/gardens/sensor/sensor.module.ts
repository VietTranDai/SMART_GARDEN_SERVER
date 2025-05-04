import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SensorStatisticsController } from './controller/sensor-statistics.controller';
import { SensorMetadataService } from './service/sensor-metadata.service';
import { SensorStatisticsService } from './service/sensor-statistics.service';
import { ThresholdAlertService } from './service/threshold-alert.service';
import { ThresholdAlertController } from './controller/threshold-alert.controller';
import { GardenModule } from '../garden/garden.module';
import { SensorService } from './service/sensor.service';
import { SensorController } from './controller/sensor.controller';
import { SensorDataGeneratorService } from './service/sensor-data-generator.service';

@Module({
  imports: [PrismaModule, GardenModule],
  controllers: [
    SensorController,
    SensorStatisticsController,
    ThresholdAlertController,
  ],
  providers: [
    SensorService,
    SensorMetadataService,
    SensorStatisticsService,
    ThresholdAlertService,
    SensorDataGeneratorService,
  ],
  exports: [SensorService],
})
export class SensorModule {}