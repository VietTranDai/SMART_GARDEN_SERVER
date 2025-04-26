import { Module } from '@nestjs/common';
import { GardenerService } from './service/gardener.service';
import { GardenerController } from './controller/gardener.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ExperienceLevelModule } from '../experience_level/experience-level.module';

@Module({
  imports: [PrismaModule, ExperienceLevelModule],
  controllers: [GardenerController],
  providers: [GardenerService],
  exports: [GardenerService],
})
export class GardenerModule {}
