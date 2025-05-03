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
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import {
  CreateUserDto,
  UpdatePasswordDto,
  UpdateUserDto,
  UserDto,
  UserFilterDto,
} from '../dto';

@ApiTags('User')
@Controller('user')
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({ status: 200, description: 'List of users', type: UserDto, isArray: true })
  async findAll(@Query() filter: UserFilterDto) {
    const { data, meta } = await this.userService.findAllEntities(filter);
    const dtos = data.map(user => this.userService.mapToUserDto(user));
    return { data: dtos, meta };
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get current user's profile" })
  @ApiResponse({ status: 200, type: UserDto })
  async getProfile(@GetUser('id') id: number) {
    const user = await this.userService.findOneEntity(id);
    return this.userService.mapToUserDto(user);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({ status: 200, type: UserDto })
  @ApiResponse({ status: 404, description: 'User not found' })
  async findOne(@Param('id', ParseIntPipe) id: number) {
    const user = await this.userService.findOneEntity(id);
    return this.userService.mapToUserDto(user);
  }

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({ status: 201, type: UserDto })
  @ApiResponse({ status: 400, description: 'Invalid input' })
  @ApiResponse({ status: 409, description: 'Conflict (username/email)' })
  async create(@Body() dto: CreateUserDto) {
    const user = await this.userService.createEntity(dto);
    return this.userService.mapToUserDto(user);
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
        filename: (req, file, cb) => {
          const id = req.params.id;
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
    const user = await this.userService.updateProfilePictureEntity(id, url);
    return this.userService.mapToUserDto(user);
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
    const user = await this.userService.updateEntity(id, dto);
    return this.userService.mapToUserDto(user);
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
    const { roleId, ...safeDto } = dto;
    const user = await this.userService.updateEntity(id, safeDto);
    return this.userService.mapToUserDto(user);
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
    const user = await this.userService.updatePasswordEntity(id, dto);
    return this.userService.mapToUserDto(user);
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
    const user = await this.userService.updatePasswordEntity(id, dto);
    return this.userService.mapToUserDto(user);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({ status: 204, description: 'Deleted successfully' })
  @ApiResponse({ status: 404, description: 'User not found' })
  async remove(@Param('id', ParseIntPipe) id: number) {
    await this.userService.removeEntity(id);
  }
}