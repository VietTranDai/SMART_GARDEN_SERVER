// src/user/user.service.ts
import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import * as bcrypt from 'bcrypt';
import { User } from '@prisma/client';
import { CreateUserDto } from '../dto/create-user.dto';
import { UpdateUserDto } from '../dto/update-user.dto';

@Injectable()
export class UserService {
  constructor(private readonly prisma: PrismaService) {}

  // ----- GET -----

  /** Retrieve all users */
  async findAll(): Promise<User[]> {
    return this.prisma.user.findMany({
      include: { role: true },
      orderBy: { createdAt: 'desc' },
    });
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
    // 1) Verify that the role exists
    const role = await this.prisma.role.findUnique({
      where: { id: dto.roleId },
    });
    if (!role)
      throw new BadRequestException(`Role with id ${dto.roleId} not found`);

    // 2) Hash the password
    const hashedPass = await bcrypt.hash(dto.password, 10);

    // 3) Create the user record
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

  /** Update user information (including password change) */
  async update(id: number, dto: UpdateUserDto): Promise<User> {
    // Ensure the user exists
    await this.findOne(id);

    // If updating to a new role, verify existence
    if (dto.roleId) {
      const role = await this.prisma.role.findUnique({
        where: { id: dto.roleId },
      });
      if (!role)
        throw new BadRequestException(`Role with id ${dto.roleId} not found`);
    }

    // Hash new password if provided
    const data: any = { ...dto };
    if (dto.password) {
      data.password = await bcrypt.hash(dto.password, 10);
    }

    return this.prisma.user.update({
      where: { id },
      data,
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
