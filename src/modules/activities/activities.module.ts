import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GardenActivityModule } from './garden_activity/garden-activity.module';
import { TaskModule } from './task/task.module';
import { WateringScheduleModule } from './watering_schedule/watering-schedule.module';

@Module({
  imports: [
    PrismaModule,
    GardenActivityModule,
    TaskModule,
    WateringScheduleModule
  ],
  controllers: [],
  providers: [],
  exports: [GardenActivityModule],
})
export class ActivitiesModule {}
