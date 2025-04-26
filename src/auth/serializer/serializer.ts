import { Injectable } from '@nestjs/common'; // Sử dụng @Injectable để đánh dấu class có thể được inject vào nơi khác thông qua Dependency Injection.
import { PassportSerializer } from '@nestjs/passport'; // Kế thừa PassportSerializer để làm việc với session trong Passport.js
import { UserService } from 'src/users/user/service/user.service'; // Import UserService để lấy dữ liệu người dùng từ cơ sở dữ liệu.
import { User } from '.prisma/client'; // Import kiểu dữ liệu User được Prisma tạo tự động từ schema.

@Injectable()
export class SessionSerializer extends PassportSerializer {
  // Khởi tạo SessionSerializer với UserService để tương tác với dữ liệu người dùng.
  constructor(private userService: UserService) {
    super(); // Gọi hàm constructor của PassportSerializer để kế thừa tính năng từ lớp cha.
  }

  // serializeUser lưu trữ thông tin người dùng vào session.
  // Tham số 'user' là đối tượng người dùng cần lưu, 'done' là callback để tiếp tục xử lý.
  serializeUser(user: User, done: Function) {
    console.log('serializeUser', user); // Ghi log để kiểm tra thông tin người dùng được serialize.
    done(null, user); // Gọi hàm done để hoàn thành việc lưu người dùng vào session.
  }

  // deserializeUser khôi phục thông tin người dùng từ session khi có request đến.
  // Tham số 'user' là thông tin người dùng lưu trữ trong session, 'done' là callback tiếp tục xử lý.
  async deserializeUser(user: User, done: Function) {
    console.log('deserializeUser', user); // Ghi log để kiểm tra thông tin người dùng được deserialize.

    // Lấy thông tin người dùng từ cơ sở dữ liệu dựa trên ID từ session
    const userRecord = await this.userService.findById(user.id);

    // Nếu tìm thấy user, gọi done với userRecord, nếu không thì gọi done với giá trị null.
    return userRecord ? done(null, userRecord) : done(null, null);
  }
}
