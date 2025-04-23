// src/common/decorators/get-user.decorator.ts
import { createParamDecorator, ExecutionContext } from '@nestjs/common';

/**
 * @GetUser() sẽ lấy nguyên object user từ request.user
 * @GetUser('email') sẽ lấy đúng req.user.email
 */
export const GetUser = createParamDecorator(
  (data: keyof any, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    const user = request.user;
    // nếu truyền data, trả về user[data], ngược lại trả về cả object
    return data ? user[data] : user;
  },
);
