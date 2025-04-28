import { Injectable } from '@nestjs/common';
import {
  HealthIndicatorService,
  HealthIndicatorResult,
} from '@nestjs/terminus';
import { PrismaService } from 'src/prisma/prisma.service';

@Injectable()
export class PrismaHealthIndicator {
  constructor(
    private readonly healthIndicatorService: HealthIndicatorService,
    private readonly prisma: PrismaService,
  ) {}

  async isHealthy(key: string): Promise<HealthIndicatorResult> {
    const indicator = this.healthIndicatorService.check(key);
    try {
      // Simple query to verify DB connectivity
      await this.prisma.$queryRaw`SELECT 1`;
      return indicator.up();
    } catch (error: any) {
      // Mark as down and include error message
      return indicator.down({ message: error?.message || 'Unknown error' });
    }
  }
}
