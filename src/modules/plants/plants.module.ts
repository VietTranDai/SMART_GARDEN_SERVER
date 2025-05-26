import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import {
  PlantsController,
  PlantsDataController,
} from './controller/plants.controller';
import { PlantsService } from './service/plants.service';
import { PlantAdviceController } from './controller/plant-advice.controller';
import { PlantAdviceService } from './service/plant-advice.service';
import { PlantStatisticsController } from './controller/plant-statistics.controller';
import { PlantStatisticsService } from './service/plant-statistics.service';

@Module({
  imports: [PrismaModule],
  controllers: [
    PlantsController,
    PlantsDataController,
    PlantAdviceController,
    PlantStatisticsController,
  ],
  providers: [PlantsService, PlantAdviceService, PlantStatisticsService],
  exports: [PlantsService],
})
export class PlantsModule {}
