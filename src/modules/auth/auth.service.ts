import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  InternalServerErrorException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from 'src/prisma/prisma.service';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import { Tokens } from './dto/tokens.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { JwtPayload } from './dto/jwt-payload.interface';

@Injectable()
export class AuthService {
  private readonly logger = new Logger(AuthService.name);

  constructor(
    private prisma: PrismaService,
    private config: ConfigService,
    private jwtService: JwtService,
  ) {}

  // NEW: 0) User Registration
  async register(
    registerUserDto: RegisterUserDto,
  ): Promise<Omit<User, 'password' | 'refreshToken'>> {
    const { email, username, password, firstName, lastName } = registerUserDto;

    // Hash password
    const saltRounds = 10;
    const salt = await bcrypt.genSalt(saltRounds);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Get default Gardener role
    const gardenerRole = await this.prisma.role.findUnique({
      where: { name: 'GARDENER' },
    });

    if (!gardenerRole) {
      this.logger.error('Default role GARDENER not found during registration.');
      throw new InternalServerErrorException(
        'System configuration error: Default role not found.',
      );
    }

    // Get the default Experience Level (assuming level 1 is the starting level)
    const defaultExperienceLevel = await this.prisma.experienceLevel.findFirst({
      where: { level: 1 },
      orderBy: { level: 'asc' },
    });

    if (!defaultExperienceLevel) {
      this.logger.error(
        'Default experience level not found during registration.',
      );
      throw new InternalServerErrorException(
        'System configuration error: Default experience level not found.',
      );
    }

    try {
      // Use transaction to ensure User and Gardener are created together
      const user = await this.prisma.$transaction(async (tx) => {
        const newUser = await tx.user.create({
          data: {
            email,
            username,
            password: hashedPassword,
            firstName,
            lastName,
            roleId: gardenerRole.id,
            // refreshToken will be set on the first login
          },
          include: {
            role: true, // Include a role if needed in the response
          },
        });

        // Create the associated Gardener profile
        await tx.gardener.create({
          data: {
            userId: newUser.id, // Link to the newly created user
            experienceLevelId: defaultExperienceLevel.id,
            experiencePoints: 0,
          },
        });

        return newUser;
      });

      // Don't return sensitive info
      const { password: _, refreshToken: __, ...result } = user;
      this.logger.log(`User registered successfully: ${result.username}`);
      return result;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        // Unique constraint violation (e.g., email or username already exists)
        if (error.code === 'P2002') {
          // Figure out which field caused the error
          const target = error.meta?.target as string[];
          const field =
            target?.length > 0 ? target.join(', ') : 'email or username';
          this.logger.warn(`Registration failed: ${field} already exists.`);
          throw new ConflictException(
            `${field.charAt(0).toUpperCase() + field.slice(1)} already exists`,
          );
        }
      }
      this.logger.error(`Could not register user ${username}`, error.stack);
      throw new InternalServerErrorException('Could not complete registration');
    }
  }

  async validateUser(
    username: string,
    pass: string,
  ): Promise<User> {
    const user = await this.prisma.user.findUnique({ where: { username } });
    if (!user) {
      this.logger.debug(
        `Validation failed: User not found for username ${username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }
    const isMatch = await bcrypt.compare(pass, user.password);
    if (!isMatch) {
      this.logger.debug(
        `Validation failed: Incorrect password for username ${username}`,
      );
      throw new UnauthorizedException('Invalid credentials');
    }

    return user;
  }

  // 2) Tạo Access + Refresh token
  async getTokens(userId: number, username: string): Promise<Tokens> {
    const payload: JwtPayload = { sub: userId, username: username};

    const [accessToken, refreshToken] = await Promise.all([
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_ACCESS_TOKEN_SECRET'),
        expiresIn: this.config.get<string>('JWT_ACCESS_TOKEN_EXPIRES_IN'),
      }),
      this.jwtService.signAsync(payload, {
        secret: this.config.get<string>('JWT_REFRESH_TOKEN_SECRET'),
        expiresIn: this.config.get<string>('JWT_REFRESH_TOKEN_EXPIRES_IN'),
      }),
    ]);

    return {
      access_token: accessToken,
      refresh_token: refreshToken,
    };
  }

  // 3) Lưu hashed Refresh Token vào DB
  async updateRefreshToken(userId: number, refreshToken: string) {
    const hash = await bcrypt.hash(refreshToken, 10);
    try {
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken: hash },
      });
    } catch (error) {
      this.logger.error(
        `Failed to update refresh token for user ${userId}`,
        error.stack,
      );
      // Decide if this should throw. Probably not critical path for login/refresh response.
    }
  }

  // 4) Xử lý Login
  async login(user: Omit<User, 'password' | 'refreshToken'>) {
    // Update last login time
    try {
      await this.prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() },
      });
    } catch (error) {
      this.logger.warn(
        `Failed to update last login time for user ${user.id}`,
        error.stack,
      );
    }

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refresh_token);
    this.logger.log(`User logged in successfully: ${user.username}`);
    return tokens;
  }

  // 5) Xử lý Logout
  async logout(userId: number) {
    try {
      await this.prisma.user.updateMany({
        where: { id: userId, refreshToken: { not: null } },
        data: { refreshToken: null },
      });
      this.logger.log(`User logged out successfully: ${userId}`);
    } catch (error) {
      this.logger.error(`Failed to logout user ${userId}`, error.stack);
      // Don't throw, just log
    }
  }

  // 6) Xử lý Refresh token
  async refreshTokens(userId: number, refreshToken: string) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || !user.refreshToken) {
      this.logger.warn(
        `Refresh token validation failed: User ${userId} not found or no token stored.`,
      );
      throw new UnauthorizedException('Access Denied');
    }

    const isMatch = await bcrypt.compare(refreshToken, user.refreshToken);
    if (!isMatch) {
      this.logger.warn(
        `Refresh token validation failed: Token mismatch for user ${userId}.`,
      );
      // Security consideration: Invalidate token here if mismatched?
      // await this.logout(userId);
      throw new UnauthorizedException('Access Denied');
    }

    const tokens = await this.getTokens(user.id, user.username);
    await this.updateRefreshToken(user.id, tokens.refresh_token); // Rotate refresh token
    this.logger.log(`Tokens refreshed successfully for user: ${user.username}`);
    return tokens;
  }
}
