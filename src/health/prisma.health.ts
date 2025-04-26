// src/health/prisma.health.ts
import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly prisma: PrismaService,
    private readonly healthIndicatorService: HealthIndicatorService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    // Khởi tạo indicator cho key này
    const indicator = this.healthIndicatorService.check(key);

    try {
      // Kiểm tra kết nối DB đơn giản
      await this.prisma.$queryRaw`SELECT 1`;
      // Nếu OK thì trả về “up”
      return indicator.up();
    } catch (err) {
      // Nếu fail thì trả về “down” với thông tin lỗi
      return indicator.down('Prisma database check failed');
    }
  }
}
