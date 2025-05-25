import { Module } from '@nestjs/common';
import { GardenAdviceService } from './garden-advice.service';
import { WeatherAdviceService } from './weather-advice.service';
import { AdviceController } from './advice.controller';
import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [AdviceController],
  providers: [GardenAdviceService, WeatherAdviceService],
  exports: [GardenAdviceService, WeatherAdviceService],
})
export class AdviceModule {}
