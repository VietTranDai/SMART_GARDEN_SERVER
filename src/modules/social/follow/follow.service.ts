import { Injectable, ConflictException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Prisma, Follow, Gardener, User } from '@prisma/client';
import { mapToFollowDto, FollowDto } from './dto/follow.dto';

/**
 * Payload type for Follow including related users
 */
type FollowWithUsers = Prisma.FollowGetPayload<{
  include: {
    follower: { include: { user: true } };
    followed: { include: { user: true } };
  };
}>;

@Injectable()
export class FollowService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Get followers of a gardener
   * @param gardenerId Gardener ID
   * @returns List of FollowWithUsers records
   */
  async getFollowers(
    gardenerId: number,
  ): Promise<FollowWithUsers[]> {
    return this.prisma.follow.findMany({
      where: { followedId: gardenerId },
      include: {
        follower: { include: { user: true } },
        followed: { include: { user: true } },
      },
    });
  }

  /**
   * Get users that a gardener is following
   * @param gardenerId Gardener ID
   * @returns List of FollowWithUsers records
   */
  async getFollowing(
    gardenerId: number,
  ): Promise<FollowWithUsers[]> {
    return this.prisma.follow.findMany({
      where: { followerId: gardenerId },
      include: {
        follower: { include: { user: true } },
        followed: { include: { user: true } },
      },
    });
  }

  /**
   * Follow a user
   * @param userId Follower's gardener ID
   * @param followedId Gardener ID to follow
   * @returns The created or existing Follow record with related users
   */
  async followUser(
    userId: number,
    followedId: number,
  ): Promise<FollowWithUsers> {
    if (userId === followedId) {
      throw new ConflictException('Cannot follow yourself');
    }
    return this.prisma.follow.upsert({
      where: { followerId_followedId: { followerId: userId, followedId } },
      create: { followerId: userId, followedId },
      update: {},
      include: {
        follower: { include: { user: true } },
        followed: { include: { user: true } },
      },
    });
  }

  /**
   * Unfollow a user
   * @param userId Follower's gardener ID
   * @param followedId Gardener ID to unfollow
   */
  async unfollowUser(
    userId: number,
    followedId: number,
  ): Promise<void> {
    try {
      await this.prisma.follow.delete({
        where: { followerId_followedId: { followerId: userId, followedId } },
      });
    } catch (e) {
      throw new NotFoundException('Follow relationship not found');
    }
  }
}
