// src/modules/watering-schedule/watering-schedule.module.ts
import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { WateringScheduleService } from './service/watering-schedule.service';
import { WateringScheduleController } from './controller/watering-schedule.controller';
import { WateringDecisionModelController } from './controller/watering-decision-model.controller';
import { WateringDecisionModelService } from './service/watering-decision-model.service';

@Module({
  imports: [PrismaModule],
  controllers: [WateringScheduleController, WateringDecisionModelController],
  providers: [WateringScheduleService, WateringDecisionModelService],
  exports: [WateringScheduleService, WateringDecisionModelService],
})
export class WateringScheduleModule {}
