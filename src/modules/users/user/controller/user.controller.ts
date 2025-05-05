// src/controller/user.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { diskStorage } from 'multer';
import { extname, join } from 'path';

import { UserService } from '../service/user.service';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  CreateUserDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserDto,
  UserFilterDto,
} from '../dto';
import { ExperienceLevelDto } from '../../experience_level';
import { ExperienceProgressDto } from '../dto/experience-progress.dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of users', type: UserDto, isArray: true })
  async findAll(@Query() filter: UserFilterDto) {
    // Trả thẳng về { data, meta }
    return this.userService.findAll(filter);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({ status: 200, type: UserDto })
  async getProfile(@GetUser('id') id: number) {
    return this.userService.findOne(id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  @Get('me/experience-progress')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's experience progress" })
  @ApiResponse({ status: 200, type: ExperienceProgressDto })
  @HttpCode(HttpStatus.OK)
  async getExperienceProgress(@GetUser('id') userId: number): Promise<ExperienceProgressDto> {
    return this.userService.getExperienceProgress(userId);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Conflict (username/email)' })
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() dto: CreateUserDto) {
    return this.userService.create(dto);
  }

  @Post(':id/upload-avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Upload avatar for a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid file' })
  @UseInterceptors(
    FileInterceptor('file', {
      storage: diskStorage({
        destination: join(process.cwd(), 'pictures/avatars'),
        filename: (_req, file, cb) => {
          const id = (_req as any).params.id;
          cb(null, `user-${id}-${Date.now()}${extname(file.originalname)}`);
        },
      }),
      fileFilter: (_req, file, cb) => {
        if (!file.mimetype.match(/^image\/(jpe?g|png)$/)) {
          return cb(new Error('Only JPG/PNG allowed'), false);
        }
        cb(null, true);
      },
    }),
  )
  async uploadAvatar(
    @Param('id', ParseIntPipe) id: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    const url = `/pictures/avatars/${file.filename}`;
    // Cập nhật file trên disk, rồi lấy lại DTO đầy đủ
    await this.userService.updateProfilePictureEntity(id, url);
    return this.userService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateUserDto,
  ) {
    return this.userService.update(id, dto);
  }

  @Put('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's profile" })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  async updateProfile(
    @GetUser('id') id: number,
    @Body() dto: UpdateUserDto,
  ) {
    // Người dùng không được đổi roleId
    delete (dto as any).roleId;
    return this.userService.update(id, dto);
  }

  @Put('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's password" })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid password or current wrong' })
  async updatePassword(
    @GetUser('id') id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, dto);
  }

  @Put(':id/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Admin: update a user's password" })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async adminUpdatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, dto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.remove(id);
  }
}
