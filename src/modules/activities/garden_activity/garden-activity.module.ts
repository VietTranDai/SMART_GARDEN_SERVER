import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { GardenActivityController } from './garden-activity.controller';
import { GardenActivityService } from './garden-activity.service';
import { GardenActivityAnalyticsService } from './garden-activity-analytics.service';
import { ActivityStatsService } from './activity-stats.service';
@Module({
  imports: [PrismaModule],
  controllers: [GardenActivityController],
  providers: [
    GardenActivityService,
    GardenActivityAnalyticsService,
    ActivityStatsService,
  ],
  exports: [GardenActivityService],
})
export class GardenActivityModule {}
