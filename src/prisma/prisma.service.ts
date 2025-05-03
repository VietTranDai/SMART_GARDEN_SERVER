import {
  Injectable,
  OnModuleInit,
  OnApplicationShutdown,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaClient, Prisma } from '@prisma/client';

/**
 * PrismaService integrates PrismaClient with NestJS lifecycle hooks
 * and ensures graceful shutdown without relying on unsupported events.
 */
@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnApplicationShutdown
{
  constructor(private readonly config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL'),
        },
      },
      log: [
        { level: 'query', emit: 'stdout' },
        { level: 'info', emit: 'stdout' },
        { level: 'warn', emit: 'stdout' },
        { level: 'error', emit: 'stdout' },
      ],
      // You can enable other PrismaClientOptions here if needed
    });
  }

  /**
   * Connect to the database when the NestJS module is initialized
   */
  async onModuleInit(): Promise<void> {
    await this.$connect();
  }

  /**
   * Disconnect from the database when the application is shutting down
   * @param signal optional shutdown signal
   */
  async onApplicationShutdown(signal?: string): Promise<void> {
    await this.$disconnect();
  }
}
