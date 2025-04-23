// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  Request,
  Res,
  HttpCode,
  Body,
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
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { AccessTokenDto } from './dto/tokens.dto';
import { JwtAuthGuard } from './guard';
import { JwtRefreshGuard } from './guard/jwt-refresh.guard';
import { LocalAuthGuard } from './guard/local-auth.guard';
import { Public } from './decorators/public.decorators';

@Public()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

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
  @HttpCode(200)
  async login(
    @Body() _loginDto: LoginDto,
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.login(req.user);
    res.cookie('Refresh', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return { access_token: tokens.access_token };
  }

  @ApiOperation({
    summary: 'User logout',
    description:
      'Invalidate the refresh token and clear the refresh-token cookie.',
  })
  @ApiBearerAuth()
  @ApiOkResponse({ description: 'User has been logged out.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(200)
  async logout(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<{ message: string }> {
    await this.authService.logout(req.user.userId);
    res.clearCookie('Refresh');
    return { message: 'Logged out' };
  }

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
  @HttpCode(200)
  async refresh(
    @Request() req,
    @Res({ passthrough: true }) res: Response,
  ): Promise<AccessTokenDto> {
    const tokens = await this.authService.refreshTokens(
      req.user.userId,
      req.user.refreshToken,
    );
    res.cookie('Refresh', tokens.refresh_token, {
      httpOnly: true,
      sameSite: 'lax',
      secure: process.env.NODE_ENV === 'production',
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
    });
    return { access_token: tokens.access_token };
  }
}
