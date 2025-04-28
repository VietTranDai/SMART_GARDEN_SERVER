import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { GardenController } from './controller/garden.controller';
import { GardenService } from './service/garden.service';

@Module({
  imports: [PrismaModule],
  controllers: [GardenController],
  providers: [GardenService],
  exports: [GardenService],
})
export class GardenModule {}
