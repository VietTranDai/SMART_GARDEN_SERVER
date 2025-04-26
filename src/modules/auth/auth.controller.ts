// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  HttpCode,
  Body,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { Response } from 'express';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCookieAuth,
  ApiBearerAuth,
  ApiResponse,
  ApiConflictResponse,
  ApiCreatedResponse,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { AccessTokenDto, Tokens } from './dto/tokens.dto';
import { JwtAuthGuard } from '../../common/guards';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { Public } from './decorators/public.decorators';
import { ConfigService } from '@nestjs/config';

@Public()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
    private readonly configService: ConfigService,
  ) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (as Gardener)' })
  @ApiCreatedResponse({
    description: 'User successfully registered.',
  })
  @ApiResponse({
    status: HttpStatus.BAD_REQUEST,
    description: 'Bad Request (validation failed)',
  })
  @ApiConflictResponse({
    description: 'Conflict (email or username already exists)',
  })
  async register(@Body() registerUserDto: RegisterUserDto) {
    return this.authService.register(registerUserDto);
  }

  @Public()
  @ApiOperation({
    summary: 'User login',
    description:
      'Validate user credentials and issue a new access token. A secure, http-only refresh token cookie is set in the response.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Returns a new JWT access token.',
    type: AccessTokenDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid username or password.' })
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  async login(
    @Body() _loginDto: LoginDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.login(req.user);
    res.cookie('Refresh', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProduction(),
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { access_token: tokens.access_token };
  }

  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary: 'User logout',
    description:
      'Invalidate the refresh token and clear the refresh-token cookie.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User has been logged out.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    const userId = req.user?.userId ?? req.user?.sub;
    if (!userId) {
      throw new UnauthorizedException('User ID not found in token payload');
    }
    await this.authService.logout(userId);
    res.clearCookie('Refresh', { path: '/api/v1/auth/refresh' });
    return { message: 'Logged out successfully' };
  }

  @Public()
  @ApiOperation({
    summary: 'Refresh access token',
    description:
      'Read http-only refresh token cookie, validate it, rotate tokens, and return a new access token.',
  })
  @ApiCookieAuth('Refresh')
  @ApiOkResponse({
    description: 'Returns a new JWT access token.',
    type: AccessTokenDto,
  })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid refresh token.' })
  @UseGuards(JwtRefreshGuard)
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const userId = req.user?.userId ?? req.user?.sub;
    const refreshToken = req.user?.refreshToken;
    if (!userId || !refreshToken) {
      throw new UnauthorizedException(
        'User ID or refresh token not found in request',
      );
    }
    const tokens = await this.authService.refreshTokens(userId, refreshToken);
    res.cookie('Refresh', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: this.isProduction(),
      path: '/api/v1/auth/refresh',
      maxAge: 7 * 24 * 60 * 60 * 1000,
    });
    return { access_token: tokens.access_token };
  }

  private isProduction(): boolean {
    return this.configService.get<string>('NODE_ENV') === 'production';
  }
}
