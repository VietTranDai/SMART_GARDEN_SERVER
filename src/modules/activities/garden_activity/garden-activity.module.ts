import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { GardenActivityController } from './controller/garden-activity.controller';
import { GardenActivityService } from './service/garden-activity.service';
import { GardenActivityAnalyticsService } from './service/garden-activity-analytics.service';
import { ActivityStatsService } from './service/activity-stats.service';
import { GardenerCalendarController } from './controller/gardener-calendar.controller';
import { GardenerCalendarService } from './service/garden-calendar.service';
@Module({
  imports: [PrismaModule],
  controllers: [GardenActivityController, GardenerCalendarController],
  providers: [
    GardenActivityService,
    GardenActivityAnalyticsService,
    ActivityStatsService,
    GardenerCalendarService,
  ],
  exports: [GardenActivityService, GardenerCalendarService],
})
export class GardenActivityModule {}
