import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExperienceLevelService } from '../../experience_level';
import { CreateGardenerDto, GardenerDto } from '../dto';
import { UpdateGardenerDto } from '../dto';
import { GardenStatus, GardenType, TaskStatus } from '@prisma/client';
import {
  GardenerProfileDto,
  mapToGardenerProfileDto,
} from '../dto/gardener-stats.dto';

@Injectable()
export class GardenerService {
  constructor(
    private prisma: PrismaService,
    private experienceLevelService: ExperienceLevelService,
  ) {}

  async create(createGardenerDto: CreateGardenerDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: createGardenerDto.userId },
    });

    if (!user) {
      throw new BadRequestException(
        `User with ID ${createGardenerDto.userId} not found`,
      );
    }

    const existingGardener = await this.prisma.gardener.findUnique({
      where: { userId: createGardenerDto.userId },
    });

    if (existingGardener) {
      throw new ConflictException(
        `Gardener already exists for user with ID ${createGardenerDto.userId}`,
      );
    }

    const experienceLevel = await this.prisma.experienceLevel.findUnique({
      where: { id: createGardenerDto.experienceLevelId },
    });

    if (!experienceLevel) {
      throw new BadRequestException(
        `Experience level with ID ${createGardenerDto.experienceLevelId} not found`,
      );
    }

    return this.prisma.gardener.create({
      data: {
        userId: createGardenerDto.userId,
        experiencePoints: createGardenerDto.experiencePoints || 0,
        experienceLevelId: createGardenerDto.experienceLevelId,
      },
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy = 'experiencePoints',
    sortOrder: 'asc' | 'desc' = 'desc',
  ) {
    const skip = (page - 1) * limit;

    const [gardeners, total] = await Promise.all([
      this.prisma.gardener.findMany({
        skip,
        take: limit,
        orderBy: { [sortBy]: sortOrder },
        include: {
          experienceLevel: true,
          user: {
            select: {
              firstName: true,
              lastName: true,
              username: true,
              email: true,
              profilePicture: true,
            },
          },
        },
      }),
      this.prisma.gardener.count(),
    ]);

    return {
      data: gardeners,
      meta: {
        total,
        page,
        limit,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  async findById(userId: number) {
    const gardener = await this.prisma.gardener.findUnique({
      where: { userId },
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });

    if (!gardener) {
      throw new NotFoundException(`Gardener with user ID ${userId} not found`);
    }

    return gardener;
  }

  async update(userId: number, updateGardenerDto: UpdateGardenerDto) {
    await this.findById(userId);

    if (updateGardenerDto.experienceLevelId) {
      const experienceLevel = await this.prisma.experienceLevel.findUnique({
        where: { id: updateGardenerDto.experienceLevelId },
      });

      if (!experienceLevel) {
        throw new BadRequestException(
          `Experience level with ID ${updateGardenerDto.experienceLevelId} not found`,
        );
      }
    }

    // Update gardener
    return this.prisma.gardener.update({
      where: { userId },
      data: updateGardenerDto,
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async remove(userId: number) {
    // Check if gardener exists
    await this.findById(userId);

    // Delete gardener
    await this.prisma.gardener.delete({
      where: { userId },
    });
  }

  // Experience Points Management

  async addExperiencePoints(userId: number, points: number) {
    // Get current gardener
    const gardener = await this.findById(userId);

    // Calculate new experience points
    const newExperiencePoints = gardener.experiencePoints + points;

    const oldLevel = gardener.experienceLevel;
    const newLevel =
      await this.experienceLevelService.calculateLevel(newExperiencePoints);

    const updatedGardener = await this.prisma.gardener.update({
      where: { userId },
      data: {
        experiencePoints: newExperiencePoints,
        experienceLevelId: newLevel.id,
      },
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            email: true,
          },
        },
      },
    });

    return {
      gardener: updatedGardener,
      levelUp: oldLevel.id !== newLevel.id,
      oldLevel: oldLevel,
      newLevel: updatedGardener.experienceLevel,
      pointsAdded: points,
      totalPoints: newExperiencePoints,
    };
  }

  async getLeaderboard(limit = 10) {
    return this.prisma.gardener.findMany({
      take: limit,
      orderBy: {
        experiencePoints: 'desc',
      },
      include: {
        experienceLevel: true,
        user: {
          select: {
            firstName: true,
            lastName: true,
            username: true,
            profilePicture: true,
          },
        },
      },
    });
  }

  async getLevelUpProgress(userId: number) {
    const gardener = await this.findById(userId);

    const currentLevel = gardener.experienceLevel;

    // Get next level
    const nextLevel = await this.experienceLevelService.findNextLevel(
      gardener.experiencePoints,
    );

    // If there's no next level, they're at the max level
    if (!nextLevel) {
      return {
        currentLevel,
        nextLevel: null,
        currentXP: gardener.experiencePoints,
        xpToNextLevel: 0,
        progress: 100,
        isMaxLevel: true,
      };
    }

    const totalPointsNeeded = nextLevel.minXP - currentLevel.minXP;
    const pointsEarned = gardener.experiencePoints - currentLevel.minXP;
    const progress = Math.floor((pointsEarned / totalPointsNeeded) * 100);

    return {
      currentLevel,
      nextLevel,
      currentXP: gardener.experiencePoints,
      xpToNextLevel: nextLevel.minXP - gardener.experiencePoints,
      progress,
      isMaxLevel: false,
    };
  }

  async getGardenerProfile(
    currentUserId: number,
    gardenerId: number,
  ): Promise<GardenerProfileDto> {
    const userEntity = await this.prisma.user.findUnique({
      where: { id: gardenerId },
      include: { role: true, gardener: { include: { experienceLevel: true } } },
    });
    if (!userEntity || !userEntity.gardener) {
      throw new NotFoundException(`Gardener ${gardenerId} not found`);
    }

    const stats = await this.computeStats(
      currentUserId,
      gardenerId,
      userEntity.gardener.experiencePoints,
      userEntity.createdAt,
    );

    return mapToGardenerProfileDto(
      {
        id: userEntity.id,
        firstName: userEntity.firstName,
        lastName: userEntity.lastName,
        email: userEntity.email,
        username: userEntity.username,
        phoneNumber: userEntity.phoneNumber || undefined,
        dateOfBirth: userEntity.dateOfBirth || undefined,
        lastLogin: userEntity.lastLogin || undefined,
        profilePicture: userEntity.profilePicture || undefined,
        address: userEntity.address || undefined,
        bio: userEntity.bio || undefined,
        createdAt: userEntity.createdAt,
        updatedAt: userEntity.updatedAt,
        role: {
          id: userEntity.role.id,
          name: userEntity.role.name,
          description: userEntity.role.description || undefined,
        },
      },
      {
        experiencePoints: userEntity.gardener.experiencePoints,
        experienceLevel: userEntity.gardener.experienceLevel,
      },
      stats,
    );
  }

  private async computeStats(
    currentUserId: number,
    gardenerId: number,
    xp: number,
    joinedDate: Date,
  ): Promise<Omit<GardenerProfileDto, keyof GardenerDto>> {
    // Count gardens and breakdown
    const gardens = await this.prisma.garden.count({ where: { gardenerId } });
    const activeGardens = await this.prisma.garden.count({ where: { gardenerId, status: GardenStatus.ACTIVE } });
    const inactiveGardens = gardens - activeGardens;
    const indoorGardens = await this.prisma.garden.count({ where: { gardenerId, type: 'INDOOR' } });
    const outdoorGardens = await this.prisma.garden.count({ where: { gardenerId, type: 'OUTDOOR' } });

    // Count posts
    const posts = await this.prisma.post.count({ where: { gardenerId } });

    // Followers / Following
    const followers = await this.prisma.follow.count({ where: { followedId: gardenerId } });
    const following = await this.prisma.follow.count({ where: { followerId: gardenerId } });

    // Activities grouping
    const activityGroups = await this.prisma.gardenActivity.groupBy({
      by: ['activityType'],
      where: { gardenerId },
      _count: { activityType: true },
    });
    const activitiesByType = activityGroups.reduce((acc, cur) => {
      acc[cur.activityType] = cur._count.activityType;
      return acc;
    }, {} as Record<string, number>);
    const totalActivities = activityGroups.reduce((sum, cur) => sum + cur._count.activityType, 0);

    // Tasks grouping
    const taskGroups = await this.prisma.task.groupBy({
      by: ['status'],
      where: { gardenerId },
      _count: { status: true },
    });
    const completedTasks = taskGroups.find(t => t.status === 'COMPLETED')?._count.status || 0;
    const pendingTasks = taskGroups.find(t => t.status === 'PENDING')?._count.status || 0;
    const skippedTasks = taskGroups.find(t => t.status === 'SKIPPED')?._count.status || 0;
    const totalTasks = completedTasks + pendingTasks + skippedTasks;
    const taskCompletionRate = totalTasks ? Math.round((completedTasks / totalTasks) * 100) : 0;

    // Community stats
    const votesAgg = await this.prisma.post.aggregate({
      where: { gardenerId },
      _sum: { total_vote: true },
    });
    const totalVotesReceived = votesAgg._sum.total_vote || 0;
    const totalCommentsReceived = await this.prisma.comment.count({ where: { post: { gardenerId } } });
    const averagePostRating = posts ? totalVotesReceived / posts : 0;
    const totalPhotoEvaluations = await this.prisma.photoEvaluation.count({ where: { gardenerId } });

    // Plant stats
    const plantGroups = await this.prisma.gardenActivity.groupBy({
      by: ['plantName'],
      where: { gardenerId, plantName: { not: null } },
      _count: { plantName: true },
    });
    const plantTypesCount = plantGroups.length;
    const maxCount = Math.max(...plantGroups.map(g => g._count.plantName), 0);
    const mostGrownPlantTypes = plantGroups.filter(g => g._count.plantName === maxCount).map(g => g.plantName!);

    // Experience progress
    const gardener = await this.prisma.gardener.findUnique({ where: { userId: gardenerId } });
    if (!gardener) throw new NotFoundException(`Gardener with ID ${gardenerId} not found`);
    const level = await this.prisma.experienceLevel.findUnique({ where: { id: gardener.experienceLevelId } });
    if (!level) throw new NotFoundException( `Level with ID ${gardener.experienceLevelId} not found` );
    const experiencePointsToNextLevel = level.maxXP - xp;
    const experienceLevelProgress = level.maxXP > level.minXP
      ? Math.round(((xp - level.minXP) / (level.maxXP - level.minXP)) * 100)
      : 100;

    // Follow status
    const isFollowing = !!await this.prisma.follow.findUnique({ where: { followerId_followedId: { followerId: currentUserId, followedId: gardenerId } } });

    return {
      gardens,
      posts,
      followers,
      following,
      activeGardens,
      inactiveGardens,
      indoorGardens,
      outdoorGardens,
      totalActivities,
      activitiesByType,
      completedTasks,
      pendingTasks,
      skippedTasks,
      taskCompletionRate,
      totalVotesReceived,
      totalCommentsReceived,
      averagePostRating,
      totalPhotoEvaluations,
      plantTypesCount,
      mostGrownPlantTypes,
      experiencePointsToNextLevel,
      experienceLevelProgress,
      joinedSince: joinedDate.toISOString(),
      isFollowing,
    };
  }
}

