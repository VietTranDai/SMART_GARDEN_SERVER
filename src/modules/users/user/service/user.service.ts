import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { ExperienceLevel, Gardener, Prisma, Role, User } from '@prisma/client';
import { join } from 'path';
import { rmSync } from 'fs';
import {
  CreateUserDto,
  UpdatePasswordDto,
  UpdateUserDto, UserDto,
  UserFilterDto,
} from '../dto';
import { RoleDto } from '../../role/dto/role.dto';
import { ExperienceLevelDto } from '../../experience_level';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly includeRole = { role: true };

  /**
   * Lấy entity User nguyên bản (chưa map sang DTO)
   */
  async getUserEntity(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: this.includeRole,
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  /**
   * Chuyển một User entity sang UserDto đầy đủ thông tin
   */
  async mapToUserDto(user: User): Promise<UserDto> {
    // Lấy thông tin role
    const role: Role | null = await this.prisma.role.findUnique({
      where: { id: user.roleId },
    });
    if (!role) {
      throw new BadRequestException(`Role with id ${user.roleId} not found`);
    }

    // Khởi tạo DTO và gán thông tin cơ bản
    const dto = new UserDto();
    dto.id = user.id;
    dto.username = user.username;
    dto.firstName = user.firstName;
    dto.lastName = user.lastName;
    dto.email = user.email;
    dto.phoneNumber = user.phoneNumber ?? undefined;
    dto.dateOfBirth = user.dateOfBirth ? user.dateOfBirth.toDateString() : undefined;

    // Gán role
    dto.roleId = role.id;
    dto.role = new RoleDto();
    dto.role.id = role.id;
    dto.role.name = role.name;
    dto.role.description = role.description ?? undefined;

    // Cờ Admin & Gardener
    dto.isAdmin = role.name === 'ADMIN';
    dto.isGardener = role.name === 'GARDENER';

    // Nếu là gardener, lấy thêm thông tin
    if (dto.isGardener) {
      const gardener: Gardener | null = await this.prisma.gardener.findUnique({
        where: { userId: user.id },
      });
      if (!gardener) {
        throw new BadRequestException(`Gardener with userId ${user.id} not found`);
      }

      dto.experiencePoints = gardener.experiencePoints ?? 0;

      const level: ExperienceLevel | null = await this.prisma.experienceLevel.findUnique({
        where: { id: gardener.experienceLevelId },
      });
      if (!level) {
        throw new BadRequestException(`Experience level with id ${gardener.experienceLevelId} not found`);
      }

      dto.experienceLevel = new ExperienceLevelDto();
      dto.experienceLevel.id = level.id;
      dto.experienceLevel.level = level.level;
      dto.experienceLevel.title = level.title;
      dto.experienceLevel.description = level.description;
      dto.experienceLevel.icon = level.icon ?? undefined;
    }

    // Gán các trường phụ
    dto.createdAt = user.createdAt;
    dto.updatedAt = user.updatedAt;
    dto.lastLogin = user.lastLogin ?? undefined;
    dto.profilePicture = user.profilePicture ?? undefined;
    dto.address = user.address ?? undefined;
    dto.bio = user.bio ?? undefined;

    return dto;
  }

  /**
   * Trả về danh sách entity theo filter & pagination
   */
  async findAllEntities(filter: UserFilterDto): Promise<{
    data: User[];
    meta: { total: number; page: number; limit: number; totalPages: number };
  }> {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'asc',
      ...filters
    } = filter;
    const skip = (page - 1) * limit;
    const where: Prisma.UserWhereInput = {};

    ['username', 'firstName', 'lastName', 'email'].forEach((field: string) => {
      if (filters[field]) {
        where[field] = { contains: filters[field], mode: 'insensitive' } as any;
      }
    });
    if (filters.roleId) {
      where.roleId = filters.roleId;
    }

    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: this.includeRole,
      }),
      this.prisma.user.count({ where }),
    ]);

    return {
      data: users,
      meta: { total, page, limit, totalPages: Math.ceil(total / limit) },
    };
  }

  /**
   * Trả về entity duy nhất
   */
  async findOneEntity(id: number): Promise<User> {
    return this.getUserEntity(id);
  }

  /**
   * Trả về entity qua username
   */
  async findByUsernameEntity(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: this.includeRole,
    });
    if (!user)
      throw new NotFoundException(`User with username ${username} not found`);
    return user;
  }

  /**
   * Tạo mới và trả về entity
   */
  async createEntity(dto: CreateUserDto): Promise<User> {
    const conflictUser = await this.prisma.user.findFirst({
      where: { OR: [{ username: dto.username }, { email: dto.email }] },
    });
    if (conflictUser) {
      if (conflictUser.username === dto.username) {
        throw new ConflictException(
          `Username ${dto.username} is already taken`,
        );
      }
      throw new ConflictException(`Email ${dto.email} is already registered`);
    }

    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role)
      throw new BadRequestException(`Role with id ${dto.roleId} not found`);

    const password = await bcrypt.hash(dto.password, 10);

    const { roleId, ...userData } = dto;
    return this.prisma.user.create({
      data: {
        ...userData,
        password,
        role: { connect: { id: roleId } },
      },
      include: this.includeRole,
    });
  }

  /**
   * Cập nhật entity và trả về entity mới
   */
  async updateEntity(id: number, dto: UpdateUserDto): Promise<User> {
    await this.getUserEntity(id);

    if (dto.username || dto.email) {
      const existing = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            dto.username ? { username: dto.username } : undefined,
            dto.email ? { email: dto.email } : undefined,
          ].filter(Boolean) as any[],
        },
      });
      if (existing) {
        if (dto.username && existing.username === dto.username) {
          throw new ConflictException(
            `Username ${dto.username} is already taken`,
          );
        }
        if (dto.email && existing.email === dto.email) {
          throw new ConflictException(
            `Email ${dto.email} is already registered`,
          );
        }
      }
    }
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role)
        throw new BadRequestException(`Role with id ${dto.roleId} not found`);
    }

    const { password, ...data } = dto as any;
    return this.prisma.user.update({
      where: { id },
      data,
      include: this.includeRole,
    });
  }

  /**
   * Cập nhật mật khẩu và trả về entity mới
   */
  async updatePasswordEntity(
    id: number,
    dto: UpdatePasswordDto,
  ): Promise<User> {
    const user = await this.getUserEntity(id);
    if (!(await bcrypt.compare(dto.currentPassword, user.password))) {
      throw new BadRequestException('Current password is incorrect');
    }
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException('New passwords do not match');
    }
    const password = await bcrypt.hash(dto.newPassword, 10);
    return this.prisma.user.update({
      where: { id },
      data: { password },
      include: this.includeRole,
    });
  }

  /**
   * Cập nhật ảnh đại diện và trả về entity mới
   */
  async updateProfilePictureEntity(id: number, url: string): Promise<User> {
    const user = await this.getUserEntity(id);
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

  /**
   * Xóa user (không trả về value)
   */
  async removeEntity(id: number): Promise<void> {
    await this.getUserEntity(id);
    await this.prisma.user.delete({ where: { id } });
  }
}
