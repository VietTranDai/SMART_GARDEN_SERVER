// src/common/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { Request } from 'express';
import { User } from '@prisma/client';

// Mở rộng Express Request để req.user: User
interface RequestWithUser extends Request {
  user: User;
}

export const GetUser = createParamDecorator<
  keyof User | undefined,
  User | User[keyof User]
>(
  (property, ctx: ExecutionContext) => {
    const req = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = req.user;
    return property ? user[property] : user;
  },
);
