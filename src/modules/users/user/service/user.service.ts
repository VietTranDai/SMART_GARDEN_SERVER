// src/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { Prisma, User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';
import { UserFilterDto } from '../dto/user-filter.dto';
import { UpdatePasswordDto } from '../dto/update-password.dto';
import { UpdateAvatarDto } from '../dto/update-avatar.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ----- GET -----

  /** Retrieve all users with filtering and pagination */
  async findAll(filter: UserFilterDto) {
    const {
      page = 1,
      limit = 10,
      sortBy = 'id',
      sortOrder = 'ASC',
      ...filters
    } = filter;
    const skip = (page - 1) * limit;

    // Build where clause from filters
    const where: Prisma.UserWhereInput = {};

    if (filters.username) {
      where.username = { contains: filters.username, mode: 'insensitive' };
    }

    if (filters.firstName) {
      where.firstName = { contains: filters.firstName, mode: 'insensitive' };
    }

    if (filters.lastName) {
      where.lastName = { contains: filters.lastName, mode: 'insensitive' };
    }

    if (filters.email) {
      where.email = { contains: filters.email, mode: 'insensitive' };
    }

    if (filters.roleId) {
      where.roleId = filters.roleId;
    }

    // Execute query with pagination
    const [users, total] = await Promise.all([
      this.prisma.user.findMany({
        where,
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder.toLowerCase() },
        include: { role: true },
      }),
      this.prisma.user.count({ where }),
    ]);

    // Return paginated result
    return {
      data: users,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /** Retrieve a user by ID */
  async findOne(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  /** Retrieve a user by username */
  async findByUsername(username: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { username },
      include: { role: true },
    });
    if (!user)
      throw new NotFoundException(`User with username ${username} not found`);
    return user;
  }

  /** Retrieve a user by email */
  async findByEmail(email: string): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });
    if (!user)
      throw new NotFoundException(`User with email ${email} not found`);
    return user;
  }

  /** Retrieve a user by user id */
  async findById(id: number): Promise<User> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { role: true },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return user;
  }

  // ----- POST -----

  /** Create a new user */
  async create(dto: CreateUserDto): Promise<User> {
    // 1) Check if username or email already exists
    const existingUser = await this.prisma.user.findFirst({
      where: {
        OR: [{ username: dto.username }, { email: dto.email }],
      },
    });

    if (existingUser) {
      if (existingUser.username === dto.username) {
        throw new ConflictException(
          `Username ${dto.username} is already taken`,
        );
      }
      if (existingUser.email === dto.email) {
        throw new ConflictException(`Email ${dto.email} is already registered`);
      }
    }

    // 2) Verify that the role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role)
      throw new BadRequestException(`Role with id ${dto.roleId} not found`);

    // 3) Hash the password
    const hashedPass = await bcrypt.hash(dto.password, 10);

    // 4) Create the user record
    return this.prisma.user.create({
      data: {
        username: dto.username,
        firstName: dto.firstName,
        lastName: dto.lastName,
        email: dto.email,
        password: hashedPass,
        phoneNumber: dto.phoneNumber,
        dateOfBirth: dto.dateOfBirth,
        role: { connect: { id: dto.roleId } },
        address: dto.address,
        bio: dto.bio,
        profilePicture: dto.profilePicture,
      },
      include: { role: true },
    });
  }

  // ----- PUT -----

  /** Update user information (excluding password) */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    // Ensure the user exists
    await this.findOne(id);

    // Check if updating to an existing username or email
    if (dto.username || dto.email) {
      const existingUser = await this.prisma.user.findFirst({
        where: {
          id: { not: id },
          OR: [
            dto.username ? { username: dto.username } : {},
            dto.email ? { email: dto.email } : {},
          ],
        },
      });

      if (existingUser) {
        if (dto.username && existingUser.username === dto.username) {
          throw new ConflictException(
            `Username ${dto.username} is already taken`,
          );
        }
        if (dto.email && existingUser.email === dto.email) {
          throw new ConflictException(
            `Email ${dto.email} is already registered`,
          );
        }
      }
    }

    // If updating to a new role, verify existence
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role)
        throw new BadRequestException(`Role with id ${dto.roleId} not found`);
    }

    // Remove password from update data if present (handled separately)
    const { password, ...updateData } = dto;

    return this.prisma.user.update({
      where: { id },
      data: updateData,
      include: { role: true },
    });
  }

  /** Update user password */
  async updatePassword(id: number, dto: UpdatePasswordDto): Promise<User> {
    // Get user and verify current password
    const user = await this.findOne(id);

    const isCurrentPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isCurrentPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    // Verify new password and confirm password match
    if (dto.newPassword !== dto.confirmPassword) {
      throw new BadRequestException(
        'New password and confirm password do not match',
      );
    }

    // Hash and update the password
    const hashedNewPassword = await bcrypt.hash(dto.newPassword, 10);

    return this.prisma.user.update({
      where: { id },
      data: { password: hashedNewPassword },
      include: { role: true },
    });
  }

  /** Update user profile picture/avatar */
  async updateAvatar(id: number, dto: UpdateAvatarDto): Promise<User> {
    // Ensure the user exists
    await this.findOne(id);

    return this.prisma.user.update({
      where: { id },
      data: { profilePicture: dto.imageUrl },
      include: { role: true },
    });
  }

  /** Update lastLogin timestamp after user login */
  async updateLastLogin(id: number): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { lastLogin: new Date() },
    });
  }

  /** Set a new refresh token for the user */
  async setRefreshToken(id: number, token: string): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: token },
    });
  }

  /** Remove the refresh token (logout) */
  async removeRefreshToken(id: number): Promise<User> {
    await this.findOne(id);
    return this.prisma.user.update({
      where: { id },
      data: { refreshToken: null },
    });
  }

  // ----- DELETE -----

  /** Delete user (hard delete) */
  async remove(id: number): Promise<void> {
    await this.findOne(id);
    await this.prisma.user.delete({ where: { id } });
  }

  // ----- Helpers -----

  /** Compare plaintext password with hashed password */
  async checkPassword(user: User, password: string): Promise<boolean> {
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) throw new BadRequestException('Password is incorrect');
    return true;
  }
}
