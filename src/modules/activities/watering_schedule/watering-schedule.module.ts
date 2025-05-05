// src/modules/watering-schedule/watering-schedule.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { WateringScheduleService } from './watering-schedule.service';
import { WateringScheduleController } from './watering-schedule.controller';

@Module({
  imports: [PrismaModule],
  controllers: [WateringScheduleController],
  providers: [WateringScheduleService],
})
export class WateringScheduleModule {}
