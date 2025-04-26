// src/health/health.controller.ts
import { Controller, Get } from '@nestjs/common';
import {
  HealthCheckService,
  HealthCheck,
  DiskHealthIndicator,
  MemoryHealthIndicator,
  HealthCheckResult, // <-- import đúng ở đây
  TypeOrmHealthIndicator,
  SequelizeHealthIndicator,
} from '@nestjs/terminus';
import { PrismaHealthIndicator } from './prisma.health';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Health')
@Controller('health')
export class HealthCheckController {
  constructor(
    private health: HealthCheckService,
    private prismaIndicator: PrismaHealthIndicator,
    private disk: DiskHealthIndicator,
    private memory: MemoryHealthIndicator,
    private typeOrm: TypeOrmHealthIndicator,
    private sequelize: SequelizeHealthIndicator,
  ) {}

  @Get('liveness')
  @HealthCheck()
  @ApiOperation({ summary: 'Liveness probe — kiểm tra app còn chạy hay không' })
  // <-- Đổi Promise<HealthIndicatorResult[]> thành Promise<HealthCheckResult>
  liveness(): Promise<HealthCheckResult> {
    return this.health.check([
      async () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      async () => this.memory.checkRSS('memory_rss', 300 * 1024 * 1024),
    ]);
  }

  @Get('readiness')
  @HealthCheck()
  @ApiOperation({
    summary: 'Readiness probe — kiểm tra app đã sẵn sàng phục vụ hay chưa',
  })
  // <-- Cũng đổi ở đây
  readiness(): Promise<HealthCheckResult> {
    return this.health.check([
      () => this.prismaIndicator.isHealthy('prisma'),
      () =>
        this.disk.checkStorage('disk', { thresholdPercent: 0.9, path: '/' }),
      () => this.memory.checkHeap('memory_heap', 150 * 1024 * 1024),
      () => this.typeOrm.pingCheck('typeorm'),
      () => this.sequelize.pingCheck('sequelize'),
    ]);
  }
}
