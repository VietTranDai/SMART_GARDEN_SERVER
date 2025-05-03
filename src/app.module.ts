import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { HealthModule } from 'src/health/health.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { GardenModule } from 'src/modules/gardens/garden/garden.module';
import { SensorModule } from 'src/modules/gardens/sensor/sensor.module';
import { PlantsModule } from 'src/modules/plants/plants.module';
import { SocialModule } from './modules/social/social.module';
import { LocationModule } from './modules/location/location.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    PrismaModule,
    UsersModule,
    AuthModule,
    HealthModule,
    GardensModule,
    GardenModule,
    SensorModule,
    PlantsModule,
    SocialModule,
    LocationModule,
  ],
  controllers: [],
  providers: [
    {
      provide: APP_GUARD,
      useClass: JwtAuthGuard,
    },
  ],
})
export class AppModule {}
