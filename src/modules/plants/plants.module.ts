import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { PlantsController } from './controller/plants.controller';
import { PlantsService } from './service/plants.service';

@Module({
  imports: [PrismaModule],
  controllers: [PlantsController],
  providers: [PlantsService],
  exports: [PlantsService],
})
export class PlantsModule {}
