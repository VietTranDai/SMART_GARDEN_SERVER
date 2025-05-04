// src/user/user.service.ts
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, Role, User } from '@prisma/client';
import {
  CreateUserDto, mapToUserDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserFilterDto,
} from '../dto';
import { UserDto } from '../dto';
import { GardenerDto, mapToGardenerDto } from '../../gardener/dto';
import { rmSync } from 'fs';
import { join } from 'path';

type AppUserDto = UserDto | GardenerDto;

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRole = { role: true };

  /** Lấy user entity kèm role, hoặc ném 404 */
  private async getUser(id: number): Promise<User & { role: Role }> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.includeRole,
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  /**
   * Map một User (có include.role) thành UserDto hoặc GardenerDto
   */
  private async mapToDto(user: User & { role: Role }): Promise<AppUserDto> {
    const isGardener = user.role.name === 'GARDENER';

    if (isGardener) {
      const gardener = await this.prisma.gardener.findUnique(
        {
          where: { userId: user.id
          },
          include: {
            experienceLevel: true,
            user: {
              include: {
                role: true
              }
            },
          }
        }
      );

      if ( !gardener ) throw new NotFoundException( `Gardener with id ${user.id} not found` )

      return mapToGardenerDto(gardener) as AppUserDto;
    }

    return mapToUserDto(user) as AppUserDto;
  }

  /**
   * Lấy list user theo filter + pagination, trả về DTO kèm meta
   */
  async findAll(filter: UserFilterDto): Promise<{
    data: AppUserDto[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const { page = 1, limit = 10, sortBy = 'id', sortOrder = 'asc', ...f } = filter;
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    // filter text fields
    ;['username', 'firstName', 'lastName', 'email'].forEach((k) => {
      if ((f as any)[k]) {
        (where as any)[k] = { contains: (f as any)[k], mode: 'insensitive' };
      }
    });
    if (f.roleId) where.roleId = f.roleId;

    const [entities, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: this.includeRole,
      }),
      this.prisma.user.count({ where }),
    ]);

    const data = await Promise.all(entities.map((u) => this.mapToDto(u)));
    return {
      data,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Lấy một user theo id, trả về DTO */
  async findOne(id: number): Promise<AppUserDto> {
    const user = await this.getUser(id);
    return this.mapToDto(user);
  }

  /** Lấy một user theo id, trả về DTO */
  async findUser(id: number): Promise<User> {
    return await this.getUser(id);
  }

  /** Tạo mới user + nếu gardener thì cũng create gardener profile */
  async create(dto: CreateUserDto): Promise<AppUserDto> {
    // kiểm tra username/email
    const existing = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (existing) {
      if (existing.username === dto.username) {
        throw new ConflictException(`Username ${dto.username} is already taken`);
      }
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }
    // hash pw
    const hashed = await bcrypt.hash(dto.password, 10);

    // create user
    const user = await this.prisma.user.create({
      data: {
        username: dto.username,
        email: dto.email,
        firstName: dto.firstName,
        lastName: dto.lastName,
        phoneNumber: dto.phoneNumber,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
        profilePicture: dto.profilePicture,
        address: dto.address,
        bio: dto.bio,
        password: hashed,
        role: { connect: { id: dto.roleId } },
      },
      include: this.includeRole,
    });

    // nếu role = gardener, tạo bản ghi gardener default
    if (user.role.name === 'GARDENER') {
      await this.prisma.gardener.create({
        data: {
          userId: user.id,
          experiencePoints: 0,
          experienceLevelId: 1,
        },
      });
    }

    return this.mapToDto(user);
  }

  /** Cập nhật toàn bộ thông tin user */
  async update(id: number, dto: UpdateUserDto): Promise<AppUserDto> {
    await this.getUser(id);

    // kiểm tra unique username/email
    if (dto.username || dto.email) {
      const conflict = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            dto.username ? { username: dto.username } : undefined,
            dto.email ? { email: dto.email } : undefined,
          ].filter(Boolean) as any[],
        },
      });
      if (conflict) {
        if (dto.username && conflict.username === dto.username) {
          throw new ConflictException(`Username ${dto.username} is already taken`);
        }
        if (dto.email && conflict.email === dto.email) {
          throw new ConflictException(`Email ${dto.email} is already registered`);
        }
      }
    }

    // update
    const updated = await this.prisma.user.update({
      where: { id },
      data: {
        ...dto,
        dateOfBirth: dto.dateOfBirth ? new Date(dto.dateOfBirth) : undefined,
      },
      include: this.includeRole,
    });

    return this.mapToDto(updated);
  }

  /** Đổi mật khẩu */
  async updatePassword(id: number, dto: UpdatePasswordDto): Promise<AppUserDto> {
    const user = await this.prisma.user.findUnique({ where: { id } });
    if (!user) throw new NotFoundException();
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }
    const hashed = await bcrypt.hash(dto.newPassword, 10);
    const updated = await this.prisma.user.update({
      where: { id },
      data: { password: hashed },
      include: this.includeRole,
    });
    return this.mapToDto(updated);
  }

  /**
   * Cập nhật ảnh đại diện và trả về entity mới
   */
  async updateProfilePictureEntity(id: number, url: string): Promise<User> {
    const user = await this.getUser(id);
    if (user.profilePicture) {
      try {
        rmSync(join(process.cwd(), user.profilePicture), { force: true });
      } catch {}
    }
    return this.prisma.user.update({
      where: { id },
      data: { profilePicture: url },
      include: this.includeRole,
    });
  }

  /** Xóa user (soft delete nếu cần) */
  async remove(id: number): Promise<void> {
    await this.getUser(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
