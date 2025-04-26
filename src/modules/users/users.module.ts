import { Module, forwardRef } from '@nestjs/common';
import { PrismaModule } from 'src/prisma/prisma.module';
import { AuthModule } from '../auth/auth.module';
import { ExperienceLevelModule } from './experience_level/experience-level.module';
import { GardenerModule } from './gardener/gardener.module';
import { UserModule } from './user/user.module';

@Module({
  imports: [PrismaModule, ExperienceLevelModule, GardenerModule, UserModule],
  controllers: [],
  providers: [],
  exports: [ExperienceLevelModule, GardenerModule, UserModule],
})
export class UsersModule {}
