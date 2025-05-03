import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { WeatherService } from './weather.service';

@Injectable()
export class WeatherScheduler {
  private readonly logger = new Logger(WeatherScheduler.name);

  constructor(private readonly weatherService: WeatherService) {}

  // Run every 10 minutes
  @Cron(CronExpression.EVERY_10_MINUTES)
  async handleCronUpdateWeather() {
    this.logger.log('Triggering scheduled weather update...');
    try {
      await this.weatherService.updateAllActiveGardens();
    } catch (error) {
      this.logger.error('Error during scheduled weather update:', error);
    }
  }

  // Run daily at midnight UTC
  @Cron(CronExpression.EVERY_DAY_AT_MIDNIGHT, { timeZone: 'UTC' })
  async handleCronCleanupForecasts() {
    this.logger.log('Triggering scheduled forecast cleanup...');
    try {
      await this.weatherService.cleanupExpiredForecasts();
    } catch (error) {
      this.logger.error('Error during scheduled forecast cleanup:', error);
    }
  }

  // Run on the 1st day of every month at 1 AM UTC
  @Cron('0 1 1 * *', { timeZone: 'UTC' })
  async handleCronCleanupObservations() {
    this.logger.log('Triggering scheduled observation cleanup...');
    try {
      // Default is 6 months, can be configured if needed
      await this.weatherService.cleanupOldObservations();
    } catch (error) {
      this.logger.error('Error during scheduled observation cleanup:', error);
    }
  }
}
