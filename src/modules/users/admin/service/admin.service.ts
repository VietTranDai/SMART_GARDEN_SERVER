import {
  Injectable,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { CreateAdminDto } from '../dto/create-admin.dto';
import { UpdateAdminDto } from '../dto/update-admin.dto';
import { AdminFilterDto } from '../dto/admin-filter.dto';
import { PrismaService } from 'src/prisma/prisma.service';
import { Admin } from '@prisma/client';
import { UserService } from '../../user/service/user.service';

@Injectable()
export class AdminService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly userService: UserService,
  ) {}

  // Tạo admin mới
  async create(createAdminDto: CreateAdminDto): Promise<Admin> {
    // 1) Kiểm tra user có tồn tại không
    await this.userService.findOne(createAdminDto.userId);

    // 2) Kiểm tra đã là admin chưa
    const existing = await this.prisma.admin.findUnique({
      where: { userId: createAdminDto.userId },
    });
    if (existing) {
      throw new ConflictException('User is already an admin');
    }

    // 3) Tạo admin, connect tới user
    return this.prisma.admin.create({
      data: {
        user: { connect: { id: createAdminDto.userId } },
      },
    });
  }

  // Lấy danh sách admin theo trang, kèm tổng số
  async findAll(filter: AdminFilterDto): Promise<[Admin[], number]> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc' } = filter;
    const skip = (page - 1) * limit;
    const take = limit;

    const [data, total] = await this.prisma.$transaction([
      this.prisma.admin.findMany({
        skip,
        take,
        orderBy: { [sortBy]: sortOrder },
        include: { user: true },
      }),
      this.prisma.admin.count(),
    ]);

    return [data, total];
  }

  // Lấy 1 admin theo ID
  async findOne(id: number): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({
      where: { userId: id },
      include: { user: true },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with ID ${id} not found`);
    }
    return admin;
  }

  // Lấy 1 admin theo userId
  async findByUserId(userId: number): Promise<Admin> {
    const admin = await this.prisma.admin.findUnique({
      where: { userId },
      include: { user: true },
    });
    if (!admin) {
      throw new NotFoundException(`Admin with user ID ${userId} not found`);
    }
    return admin;
  }

  // Cập nhật (hiện tại chỉ có thể đổi userId nếu DTO có trường này)
  async update(id: number, updateAdminDto: UpdateAdminDto): Promise<Admin> {
    await this.findOne(id);

    const data: any = {};
    if (updateAdminDto.userId) {
      // Kiểm tra user mới có tồn tại không
      await this.userService.findOne(updateAdminDto.userId);
      data.user = { connect: { id: updateAdminDto.userId } };
    }

    return this.prisma.admin.update({
      where: { userId: id },
      data,
      include: { user: true },
    });
  }

  // Xóa admin
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.admin.delete({ where: { userId: id } });
  }
}
