import { Module } from '@nestjs/common';
import { UserService } from './service/user.service';
import { UserController } from './controller/user.controller';
import { PrismaModule } from 'src/prisma/prisma.module';
import { MulterModule } from '@nestjs/platform-express';

@Module({
  imports: [
    PrismaModule,
    MulterModule.register({
    dest: './pictures',           // lưu tạm vào ./pictures
    limits: { fileSize: 5_000_000 },
  }),],
  providers: [UserService],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
