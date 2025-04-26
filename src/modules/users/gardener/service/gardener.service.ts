import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExperienceLevelService } from '../../experience_level/service/experience-level.service';
import { CreateGardenerDto } from '../dto/create-gardener.dto';
import { UpdateGardenerDto } from '../dto/update-gardener.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class GardenerService {
  constructor(
    private prisma: PrismaService,
    private experienceLevelService: ExperienceLevelService,
  ) {}

  // CRUD Operations

  async create(createGardenerDto: CreateGardenerDto) {
    // Check if user exists
    const user = await this.prisma.user.findUnique({
      where: { id: createGardenerDto.userId },
    });

    if (!user) {
      throw new BadRequestException(
        `User with ID ${createGardenerDto.userId} not found`,
      );
    }

    // Check if gardener already exists for this user
    const existingGardener = await this.prisma.gardener.findUnique({
      where: { userId: createGardenerDto.userId },
    });

    if (existingGardener) {
      throw new ConflictException(
        `Gardener already exists for user with ID ${createGardenerDto.userId}`,
      );
    }

    // Check if experience level exists
    const experienceLevel = await this.prisma.experienceLevel.findUnique({
      where: { id: createGardenerDto.experienceLevelId },
    });

    if (!experienceLevel) {
      throw new BadRequestException(
        `Experience level with ID ${createGardenerDto.experienceLevelId} not found`,
      );
    }

    // Create gardener
    const gardener = await this.prisma.gardener.create({
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

    return gardener;
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
    // Check if gardener exists
    await this.findById(userId);

    // Check if experience level exists if provided
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

    // Determine if level has changed
    const oldLevel = gardener.experienceLevel;
    const newLevel =
      await this.experienceLevelService.calculateLevel(newExperiencePoints);

    // Update gardener record
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

    // Return result with level up information
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

    // Get current level
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

    // Calculate points needed for next level
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
}
