import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { HealthSchedulerService } from './service/health-scheduler.service';
import { HealthSchedulerController } from './controller/health-scheduler.controller';
import { HealthMonitorService } from './service/health-monitor.service';

@Module({
  imports: [
    ScheduleModule.forRoot() // Kích hoạt scheduling
  ],
  controllers: [
    HealthSchedulerController
  ],
  exports: [
    HealthSchedulerService,
    HealthMonitorService
  ]
})
export class GardenHealthModule {}