import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GardenController } from './garden.controller';
import { GardenService } from './garden.service';
import { GardenAdviceService } from './garden-advice.service';

@Module({
  imports: [PrismaModule],
  controllers: [GardenController],
  providers: [GardenService, GardenAdviceService],
  exports: [GardenService, GardenAdviceService],
})
export class GardenModule {}
