import { Module } from '@nestjs/common';
import { HttpModule } from '@nestjs/axios';
import { LocationService } from './location.service';
import { LocationController } from './location.controller';
// Assuming you have a PrismaModule that provides PrismaService
// import { PrismaModule } from '../../prisma/prisma.module';

@Module({
  imports: [
    HttpModule,
    // PrismaModule // Uncomment or adjust if you have a PrismaModule
  ],
  controllers: [LocationController],
  providers: [LocationService],
  exports: [LocationService], // Export service if needed elsewhere
})
export class LocationModule {}
