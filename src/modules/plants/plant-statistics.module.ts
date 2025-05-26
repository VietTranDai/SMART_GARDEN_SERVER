import { Module } from '@nestjs/common';
import { PlantStatisticsController } from './controller/plant-statistics.controller';
import { PlantStatisticsService } from './service/plant-statistics.service';
import { PrismaModule } from 'src/prisma/prisma.module';
// import { GardensModule } from 'src/modules/gardens/garden/garden.module'; // If needed for ownership guard or other garden services

@Module({
  imports: [
    PrismaModule,
    // GardensModule, // If you have a shared GardensService or ownership guard
  ],
  controllers: [PlantStatisticsController],
  providers: [PlantStatisticsService],
})
export class PlantStatisticsModule {}
