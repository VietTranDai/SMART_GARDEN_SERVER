import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { ScheduleModule } from '@nestjs/schedule';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { PrismaModule } from '../../prisma/prisma.module';
import { WeatherService } from './weather.service';
import { WeatherController } from './weather.controller';
import { WeatherScheduler } from './weather.scheduler';

@Module({
  imports: [
    PrismaModule,
    ScheduleModule.forRoot(),
    ConfigModule,
    HttpModule.register({
      timeout: 10000, // 10 seconds timeout
      maxRedirects: 5,
    }),
    // If you want to use axios-retry, use HttpModule.registerAsync instead:
    /*
    HttpModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        timeout: configService.get('HTTP_TIMEOUT', 10000),
        maxRedirects: 5,
      }),
      inject: [ConfigService],
    }),
    */
  ],
  controllers: [WeatherController],
  providers: [WeatherService, WeatherScheduler],
  exports: [WeatherService],
})
export class WeatherModule {}
