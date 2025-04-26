import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { SensorModule } from './sensor/sensor.module';
import { GardenModule } from './garden/garden.module';

@Module({
  imports: [PrismaModule, GardenModule, SensorModule],
  controllers: [],
  providers: [],
})
export class GardensModule {}
