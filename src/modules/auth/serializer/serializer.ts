import { Injectable } from '@nestjs/common';
import { PassportSerializer } from '@nestjs/passport';
import { UserService } from 'src/modules/users/user/service/user.service';
import { User } from '.prisma/client';

@Injectable()
export class SessionSerializer extends PassportSerializer {
  constructor(private userService: UserService) {
    super(); // Gọi hàm constructor của PassportSerializer để kế thừa tính năng từ lớp cha.
  }

  serializeUser(user: User, done: Function) {
    console.log('serializeUser', user);
    done(null, user);
  }

  async deserializeUser(user: User, done: Function) {
    console.log('deserializeUser', user);

    const userRecord = await this.userService.getUserEntity(user.id);

    return userRecord ? done(null, userRecord) : done(null, null);
  }
}
