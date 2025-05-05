import { Module } from '@nestjs/common';
import { PrismaModule } from '../../../prisma/prisma.module';
import { GardenActivityController } from './garden-activity.controller';
import { GardenActivityService } from './garden-activity.service';

@Module({
  imports: [PrismaModule],
  controllers: [GardenActivityController],
  providers: [GardenActivityService],
  exports: [GardenActivityService],
})
export class GardenActivityModule {}
