import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType, Vote, Gardener, User } from '@prisma/client';
import { CommunityUserDto, mapToCommunityUserDto } from '../../post/dto/community-user.dto';

export class CreateVoteDto {
  @ApiProperty({ description: 'Loại đối tượng được vote', enum: VoteTargetType })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của đối tượng được vote', example: 1 })
  targetId: number;

  @ApiProperty({ description: 'Giá trị vote: 1 upvote, -1 downvote', example: 1 })
  voteValue: number;
}

export class VoteDto {
  @ApiProperty({ description: 'ID của vote', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của gardener (người vote)', example: 1 })
  gardenerId: number;

  @ApiProperty({ description: 'Thông tin người dùng vote', type: CommunityUserDto })
  userData: CommunityUserDto;

  @ApiProperty({ description: 'Loại đối tượng được vote', enum: VoteTargetType })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của đối tượng được vote', example: 1 })
  targetId: number;

  @ApiProperty({ description: 'Giá trị vote: 1 lên, -1 xuống', example: 1 })
  voteValue: number;

  @ApiProperty({ description: 'Thời gian tạo vote' })
  createdAt: Date;
}

export function mapToVoteDto(
  vote: Vote & {
    gardener: Gardener & {
      user: User & {
        gardener?: Gardener;
      };
    };
  },
): VoteDto {
  return {
    id: vote.id,
    gardenerId: vote.gardenerId,
    userData: mapToCommunityUserDto(vote.gardener.user),
    targetType: vote.targetType,
    targetId: vote.targetId,
    voteValue: vote.voteValue,
    createdAt: vote.createdAt,
  };
}
