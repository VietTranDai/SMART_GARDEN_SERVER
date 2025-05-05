import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherScheduler {
  private readonly logger = new Logger(WeatherScheduler.name);

  constructor(private readonly weatherService: WeatherService) {}

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronUpdateWeather() {
    this.logger.log('Triggering scheduled weather update...');
    try {
      await this.weatherService.updateAllActiveGardens();
    } catch (error) {
      this.logger.error('Error during scheduled weather update:', error);
    }
  }

  // @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronCleanupForecasts() {
    this.logger.log('Triggering scheduled forecast cleanup...');
    try {
      await this.weatherService.cleanupExpiredForecasts();
    } catch (error) {
      this.logger.error('Error during scheduled forecast cleanup:', error);
    }
  }

  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronCleanupObservations()
  {
    this.logger.log('Triggering scheduled observation cleanup...');
    try {
      await this.weatherService.cleanupOldObservations();
    } catch (error) {
      this.logger.error('Error during scheduled observation cleanup:', error);
    }
  }
}
