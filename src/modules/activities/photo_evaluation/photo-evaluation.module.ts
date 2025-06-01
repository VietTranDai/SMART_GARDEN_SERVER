import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { PhotoEvaluationController } from './controller/photo-evaluation.controller';
import { PhotoEvaluationService } from './service/photo-evaluation.service';
import { PrismaModule } from '../../../prisma/prisma.module';

@Module({
  imports: [PrismaModule, ConfigModule],
  controllers: [PhotoEvaluationController],
  providers: [PhotoEvaluationService],
  exports: [PhotoEvaluationService],
})
export class PhotoEvaluationModule {} 