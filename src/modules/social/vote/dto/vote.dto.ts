import { ApiProperty } from '@nestjs/swagger';
import { VoteTargetType, Vote, Gardener, User } from '@prisma/client';
import { CommunityUserDto, mapToCommunityUserDto } from '../../post/dto/community-user.dto';

export class CreateVoteDto {
  @ApiProperty({ description: 'Giá trị vote: 1 upvote, -1 downvote', example: 1 })
  voteValue: number;

  @ApiProperty({ description: 'Loại đối tượng được vote', enum: VoteTargetType })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của post được vote (nếu là POST)', example: 1, required: false })
  postId?: number;

  @ApiProperty({ description: 'ID của comment được vote (nếu là COMMENT)', example: 1, required: false })
  commentId?: number;
}

export class VoteDto {
  @ApiProperty({ description: 'ID của vote', example: 1 })
  id: number;

  @ApiProperty({ description: 'Thông tin người dùng vote', type: CommunityUserDto })
  userData: CommunityUserDto;

  @ApiProperty({ description: 'Loại đối tượng được vote', enum: VoteTargetType })
  targetType: VoteTargetType;

  @ApiProperty({ description: 'ID của post được vote (nếu là POST)', example: 1, required: false })
  postId?: number;

  @ApiProperty({ description: 'ID của comment được vote (nếu là COMMENT)', example: 1, required: false })
  commentId?: number;

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
    userData: mapToCommunityUserDto(vote.gardener.user),
    targetType: vote.targetType,
    postId: vote.postId ?? undefined,
    commentId: vote.commentId ?? undefined,
    voteValue: vote.voteValue,
    createdAt: vote.createdAt,
  };
}
