import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SensorModule } from './sensor/sensor.module';
import { GardenModule } from './garden/garden.module';
import { AlertModule } from './alert/alert.module';

@Module({
  imports: [PrismaModule, GardenModule, SensorModule, AlertModule],
  controllers: [],
  providers: [],
})
export class GardensModule {}
