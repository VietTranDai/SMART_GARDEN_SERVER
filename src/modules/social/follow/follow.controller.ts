import {
  Controller,
  Get,
  Post,
  Delete,
  Param,
  ParseIntPipe,
  HttpCode,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { FollowService } from './follow.service';
import { GetUser } from '../../../common/decorators/get-user.decorator';
import { FollowDto, mapToFollowDto } from './dto/follow.dto';

@ApiTags('Follow')
@Controller('follow')
@ApiBearerAuth()
export class FollowController {
  constructor(private readonly followService: FollowService) {}

  @Get('followers/:gardenerId')
  @ApiOperation({ summary: 'Get followers of a gardener' })
  @ApiParam({
    name: 'gardenerId',
    required: true,
    description: 'ID of the gardener',
    example: 1,
  })
  async getFollowers(
    @Param('gardenerId', ParseIntPipe) gardenerId: number,
  ): Promise<FollowDto[]> {
    const follows = await this.followService.getFollowers(gardenerId);
    return follows.map(mapToFollowDto);
  }

  @Get('following/:gardenerId')
  @ApiOperation({ summary: 'Get users that a gardener is following' })
  @ApiParam({
    name: 'gardenerId',
    required: true,
    description: 'ID of the gardener',
    example: 1,
  })
  async getFollowing(
    @Param('gardenerId', ParseIntPipe) gardenerId: number,
  ): Promise<FollowDto[]> {
    const follows = await this.followService.getFollowing(gardenerId);
    return follows.map(mapToFollowDto);
  }

  @Post(':gardenerId')
  @ApiOperation({ summary: 'Follow a user' })
  @ApiParam({
    name: 'gardenerId',
    required: true,
    description: 'ID of the gardener to follow',
    example: 1,
  })
  async followUser(
    @GetUser('id') userId: number,
    @Param('gardenerId', ParseIntPipe) gardenerId: number,
  ): Promise<FollowDto> {
    const follow = await this.followService.followUser(userId, gardenerId);
    return mapToFollowDto(follow);
  }

  @Delete(':gardenerId')
  @HttpCode(204)
  @ApiOperation({ summary: 'Unfollow a user' })
  @ApiParam({
    name: 'gardenerId',
    required: true,
    description: 'ID of the gardener to unfollow',
    example: 1,
  })
  async unfollowUser(
    @GetUser('id') userId: number,
    @Param('gardenerId', ParseIntPipe) gardenerId: number,
  ): Promise<void> {
    await this.followService.unfollowUser(userId, gardenerId);
  }
}
