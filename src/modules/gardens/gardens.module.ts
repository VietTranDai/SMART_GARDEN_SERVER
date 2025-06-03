import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SensorModule } from './sensor/sensor.module';
import { GardenModule } from './garden/garden.module';
import { AlertModule } from './alert/alert.module';
import { GardenHealthModule } from './health-monitor/health-monitor.module';

@Module({
  imports: [PrismaModule, GardenModule, SensorModule, AlertModule, GardenHealthModule],
  controllers: [],
  providers: [],
})
export class GardensModule {}
