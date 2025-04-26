// src/health/health.module.ts
import { Module } from '@nestjs/common';
import {
  DiskHealthIndicator,
  HealthCheckService,
  MemoryHealthIndicator,
  TerminusModule,
} from '@nestjs/terminus';
import {
  TypeOrmHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';

import { PrismaHealthIndicator } from './prisma.health';
import { HealthCheckController } from './health.controller';

@Module({
  imports: [TerminusModule],
  controllers: [HealthCheckController],
  providers: [
    HealthCheckService,
    DiskHealthIndicator,
    MemoryHealthIndicator,
    PrismaHealthIndicator,
    TypeOrmHealthIndicator,
    SequelizeHealthIndicator,
  ],
})
export class HealthModule {}
