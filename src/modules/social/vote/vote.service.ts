import { Injectable } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoteDto } from './dto/vote.dto';
import { VoteTargetType } from '@prisma/client';

@Injectable()
export class VoteService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Vote on a post
   * @param userId ID of the gardener voting
   * @param postId ID of the post to vote on
   * @param dto Vote data
   * @returns Updated total votes and user's vote value
   */
  async votePost(
    userId: number,
    postId: number,
    dto: CreateVoteDto,
  ): Promise<{ total_vote: number; userVote: number }> {
    const vote = await this.prisma.vote.upsert({
      where: {
        gardenerId_targetType_targetId: {
          gardenerId: userId,
          targetType: VoteTargetType.POST,
          targetId: postId,
        },
      },
      create: {
        gardenerId: userId,
        targetType: VoteTargetType.POST,
        targetId: postId,
        voteValue: dto.voteValue,
      },
      update: {
        voteValue: dto.voteValue,
      },
    });

    const aggregate = await this.prisma.vote.aggregate({
      where: { targetType: VoteTargetType.POST, targetId: postId },
      _sum: { voteValue: true },
    });

    return {
      total_vote: aggregate._sum.voteValue ?? 0,
      userVote: vote.voteValue,
    };
  }

  /**
   * Vote on a comment
   * @param userId ID of the gardener voting
   * @param commentId ID of the comment to vote on
   * @param dto Vote data
   * @returns Updated score and user's vote value
   */
  async voteComment(
    userId: number,
    commentId: number,
    dto: CreateVoteDto,
  ): Promise<{ score: number; userVote: number }> {
    const vote = await this.prisma.vote.upsert({
      where: {
        gardenerId_targetType_targetId: {
          gardenerId: userId,
          targetType: VoteTargetType.COMMENT,
          targetId: commentId,
        },
      },
      create: {
        gardenerId: userId,
        targetType: VoteTargetType.COMMENT,
        targetId: commentId,
        voteValue: dto.voteValue,
      },
      update: {
        voteValue: dto.voteValue,
      },
    });

    const aggregate = await this.prisma.vote.aggregate({
      where: { targetType: VoteTargetType.COMMENT, targetId: commentId },
      _sum: { voteValue: true },
    });

    return {
      score: aggregate._sum.voteValue ?? 0,
      userVote: vote.voteValue,
    };
  }
}
