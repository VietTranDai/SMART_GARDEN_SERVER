import { ApiProperty } from '@nestjs/swagger';
import { Gardener, User } from '@prisma/client';
import { CommunityUserDto, mapToCommunityUserDto } from '../../post/dto/community-user.dto';

export class CreateFollowDto {
  @ApiProperty({ description: 'ID của gardener cần follow', example: 1 })
  followedId: number;
}

export class FollowDto {
  @ApiProperty({ description: 'ID của follower', example: 2 })
  followerId: number;

  @ApiProperty({ description: 'Thông tin user follower', type: CommunityUserDto })
  followerData: CommunityUserDto;

  @ApiProperty({ description: 'ID của gardener được follow', example: 1 })
  followedId: number;

  @ApiProperty({ description: 'Thông tin user được follow', type: CommunityUserDto })
  followedData: CommunityUserDto;

  @ApiProperty({ description: 'Thời gian bắt đầu follow' })
  createdAt: Date;
}

// Hàm mapping từ Prisma model Follow sang DTO
export function mapToFollowDto(
  follow: {
    followerId: number;
    followedId: number;
    createdAt: Date;
    follower: Gardener & { user: User & { gardener?: Gardener } };
    followed: Gardener & { user: User & { gardener?: Gardener } };
  },
): FollowDto {
  return {
    followerId: follow.followerId,
    followerData: mapToCommunityUserDto(follow.follower.user),
    followedId: follow.followedId,
    followedData: mapToCommunityUserDto(follow.followed.user),
    createdAt: follow.createdAt,
  };
}
