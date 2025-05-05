// src/auth/auth.controller.ts
import {
  Controller,
  Post,
  UseGuards,
  HttpCode,
  Body,
  HttpStatus,
  Req,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiUnauthorizedResponse,
  ApiCreatedResponse,
  ApiConflictResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { AuthService } from './auth.service';
import { LoginDto } from './dto/login.dto';
import { RegisterUserDto } from './dto/register-user.dto';
import { TokensResponseDto } from './dto/tokens-response.dto';
import { LocalAuthGuard } from '../../common/guards/local-auth.guard';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '@prisma/client';
import { JwtAuthGuard } from '../../common/guards';
import { JwtRefreshGuard } from '../../common/guards/jwt-refresh.guard';
import { Public } from 'src/common/decorators/public.decorator'

@Public()
@ApiTags('Authentication')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Public()
  @Post('register')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Register a new user (as Gardener)' })
  @ApiCreatedResponse({ description: 'User successfully registered.' })
  @ApiConflictResponse({ description: 'Email or username already exists.' })
  async register(@Body() dto: RegisterUserDto) {
    return this.authService.register(dto);
  }

  @Public()
  @UseGuards(LocalAuthGuard)
  @Post('login')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User login',
    description:
      'Validate user credentials and return access + refresh tokens in response body.',
  })
  @ApiBody({ type: LoginDto })
  @ApiOkResponse({
    description: 'Returns access_token and refresh_token.',
    type: TokensResponseDto,
  })
  @ApiUnauthorizedResponse({ description: 'Invalid credentials.' })
  async login(@GetUser() user: User): Promise<TokensResponseDto> {
    const tokens = await this.authService.login(user);
    return {
      access_token: tokens.access_token,
      refresh_token: tokens.refresh_token,
    };
  }

  @Public()
  @UseGuards(JwtRefreshGuard)
  @ApiBearerAuth()
  @Post('refresh')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'Refresh tokens',
    description:
      'Lấy refresh token từ Authorization header, validate & rotate rồi trả cặp mới.',
  })
  @ApiOkResponse({ type: TokensResponseDto })
  @ApiUnauthorizedResponse({ description: 'Invalid or missing refresh token' })
  async refresh(
    @Req() req: Request,
    @GetUser() user: User,
  ): Promise<TokensResponseDto> {
    const raw = (req as any).rawRefreshToken;
    console.log("raw" + raw);
    return this.authService.refreshTokens(user.id, raw);
  }

  @UseGuards(JwtAuthGuard)
  @Post('logout')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({
    summary: 'User logout',
    description:
      'Invalidate the refresh token on server side; client should delete stored tokens.',
  })
  @ApiOkResponse({ description: 'Logged out successfully.' })
  @ApiUnauthorizedResponse({ description: 'Missing or invalid access token.' })
  async logout(@GetUser() user: User): Promise<{ message: string }> {
    await this.authService.logout(user.id);
    return { message: 'Logged out successfully' };
  }
}
