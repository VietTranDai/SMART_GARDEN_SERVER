import { Module } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { ConfigModule } from '@nestjs/config';
import { APP_GUARD } from '@nestjs/core';
import { JwtAuthGuard } from 'src/common/guards';
import { UsersModule } from 'src/modules/users/users.module';
import { AuthModule } from 'src/modules/auth/auth.module';
import { HealthModule } from 'src/health/health.module';
import { GardensModule } from './modules/gardens/gardens.module';
import { PlantsModule } from 'src/modules/plants/plants.module';
import { SocialModule } from './modules/social/social.module';
import { LocationModule } from './modules/location/location.module';
import { WeatherModule } from './modules/weathers/weather.module';
import { ScheduleModule } from '@nestjs/schedule';
import { ActivitiesModule } from './modules/activities/activities.module';
import { AdviceModule } from './modules/advice/advice.module';
@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ScheduleModule.forRoot(),
    PrismaModule,
    UsersModule,
    AuthModule,
    HealthModule,
    GardensModule,
    PlantsModule,
    SocialModule,
    LocationModule,
    WeatherModule,
    ActivitiesModule,
    AdviceModule,
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
