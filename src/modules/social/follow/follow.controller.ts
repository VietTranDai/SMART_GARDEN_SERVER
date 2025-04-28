import {
  Controller,
  Post,
  Delete,
  Get,
  Param,
  Body,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FollowService } from './follow.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiQuery,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { FollowDto, FollowerListDto, FollowingListDto } from './dto/follow.dto';
import { Public } from 'src/common/decorators/public.decorator';

interface JwtPayload {
  sub: number;
  email: string;
}

@ApiTags('Follows')
@Controller('follows')
@ApiBearerAuth()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Post()
  @ApiOperation({ summary: 'Theo dõi một người làm vườn' })
  @ApiResponse({
    status: 201,
    description: 'Theo dõi thành công.',
    type: FollowDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ.' })
  @ApiResponse({ status: 404, description: 'Không tìm thấy người làm vườn.' })
  @ApiResponse({ status: 409, description: 'Đã theo dõi người này rồi.' })
  follow(
    @GetUser() user: JwtPayload,
    @Body() createFollowDto: CreateFollowDto,
  ): Promise<FollowDto> {
    return this.followService.follow(user.sub, createFollowDto);
  }

  @Delete(':followedId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Hủy theo dõi một người làm vườn' })
  @ApiResponse({
    status: 204,
    description: 'Hủy theo dõi thành công.',
  })
  @ApiResponse({ status: 404, description: 'Chưa theo dõi người này.' })
  unfollow(
    @GetUser() user: JwtPayload,
    @Param('followedId', ParseIntPipe) followedId: number,
  ): Promise<void> {
    return this.followService.unfollow(user.sub, followedId);
  }

  // @Get('followers/:gardenerId')
  // @Public()
  // @ApiOperation({
  //   summary: 'Lấy danh sách người theo dõi của một người làm vườn',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Danh sách người theo dõi.',
  //   type: FollowerListDto,
  // })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Trang',
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   required: false,
  //   type: Number,
  //   description: 'Số lượng người theo dõi trên một trang',
  // })
  // getFollowers(
  //   @Param('gardenerId', ParseIntPipe) gardenerId: number,
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ): Promise<FollowerListDto> {
  //   return this.followService.getFollowers(gardenerId, page, limit);
  // }

  // @Get('following/:gardenerId')
  // @Public()
  // @ApiOperation({
  //   summary: 'Lấy danh sách người mà một người làm vườn đang theo dõi',
  // })
  // @ApiResponse({
  //   status: 200,
  //   description: 'Danh sách người đang theo dõi.',
  //   type: FollowingListDto,
  // })
  // @ApiQuery({
  //   name: 'page',
  //   required: false,
  //   type: Number,
  //   description: 'Trang',
  // })
  // @ApiQuery({
  //   name: 'limit',
  //   required: false,
  //   type: Number,
  //   description: 'Số lượng người đang theo dõi trên một trang',
  // })
  // getFollowing(
  //   @Param('gardenerId', ParseIntPipe) gardenerId: number,
  //   @Query('page', new DefaultValuePipe(1), ParseIntPipe) page: number,
  //   @Query('limit', new DefaultValuePipe(10), ParseIntPipe) limit: number,
  // ): Promise<FollowingListDto> {
  //   return this.followService.getFollowing(gardenerId, page, limit);
  // }

  @Get('status/:followedId')
  @ApiOperation({ summary: 'Kiểm tra trạng thái theo dõi' })
  @ApiResponse({
    status: 200,
    description: 'Trạng thái theo dõi.',
    schema: {
      type: 'boolean',
      example: true,
    },
  })
  checkFollowStatus(
    @GetUser() user: JwtPayload,
    @Param('followedId', ParseIntPipe) followedId: number,
  ): Promise<boolean> {
    return this.followService.checkFollowStatus(user.sub, followedId);
  }
}
