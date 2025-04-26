import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { UserService } from '../service/user.service';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import {
  CreateUserDto,
  UpdateUserDto,
  UserDto,
  UpdatePasswordDto,
  UpdateAvatarDto,
  UserFilterDto,
} from '../dto';

@ApiTags('users')
@Controller('users')
export class UserController {
  constructor(private readonly userService: UserService) {}

  // ---- GET endpoints ----

  @Get()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get all users with filtering and pagination' })
  @ApiResponse({
    status: 200,
    description: 'Returns a paginated list of users',
  })
  findAll(@Query() filter: UserFilterDto) {
    return this.userService.findAll(filter);
  }

  @Get('me')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Get the current user's profile" })
  @ApiResponse({
    status: 200,
    description: "Returns the current user's profile",
    type: UserDto,
  })
  getProfile(@GetUser() user: any) {
    return this.userService.findOne(user.id);
  }

  @Get(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get a user by ID' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'Returns the user with the specified ID',
    type: UserDto,
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number) {
    return this.userService.findOne(id);
  }

  // ---- POST endpoints ----

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new user' })
  @ApiResponse({
    status: 201,
    description: 'The user has been successfully created',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 409,
    description: 'Username or email already exists',
  })
  create(@Body() createUserDto: CreateUserDto) {
    return this.userService.create(createUserDto);
  }

  // ---- PUT endpoints ----

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The user has been successfully updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    return this.userService.update(id, updateUserDto);
  }

  @Put('me/profile')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's profile" })
  @ApiResponse({
    status: 200,
    description: 'The profile has been successfully updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid input data',
  })
  updateProfile(
    @GetUser('id') id: number,
    @Body() updateUserDto: UpdateUserDto,
  ) {
    // Remove sensitive fields that users shouldn't be able to update themselves
    const { roleId, ...safeUpdateData } = updateUserDto;
    return this.userService.update(id, safeUpdateData);
  }

  @Put('me/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's password" })
  @ApiResponse({
    status: 200,
    description: 'The password has been successfully updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password data or current password incorrect',
  })
  updatePassword(
    @GetUser('id') id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, updatePasswordDto);
  }

  @Put('me/avatar')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update current user's avatar" })
  @ApiResponse({
    status: 200,
    description: 'The avatar has been successfully updated',
    type: UserDto,
  })
  updateAvatar(
    @GetUser('id') id: number,
    @Body() updateAvatarDto: UpdateAvatarDto,
  ) {
    return this.userService.updateAvatar(id, updateAvatarDto);
  }

  @Put(':id/password')
  @ApiBearerAuth()
  @ApiOperation({ summary: "Update a user's password (admin only)" })
  @ApiParam({ name: 'id', description: 'User ID' })
  @ApiResponse({
    status: 200,
    description: 'The password has been successfully updated',
    type: UserDto,
  })
  @ApiResponse({
    status: 400,
    description: 'Invalid password data',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  adminUpdatePassword(
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePasswordDto: UpdatePasswordDto,
  ) {
    return this.userService.updatePassword(id, updatePasswordDto);
  }

  // ---- DELETE endpoints ----

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete a user' })
  @ApiParam({ name: 'id', description: 'User ID' })
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiResponse({
    status: 204,
    description: 'The user has been successfully deleted',
  })
  @ApiResponse({
    status: 404,
    description: 'User not found',
  })
  remove(@Param('id', ParseIntPipe) id: number) {
    return this.userService.remove(id);
  }
}
