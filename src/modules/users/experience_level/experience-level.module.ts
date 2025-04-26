import { Module } from '@nestjs/common';
import { ExperienceLevelService } from './service/experience-level.service';
import { ExperienceLevelController } from './controller/experience-level.controller';
import { PrismaModule } from 'src/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [ExperienceLevelController],
  providers: [ExperienceLevelService],
  exports: [ExperienceLevelService],
})
export class ExperienceLevelModule {}
