import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  CreateExperienceLevelDto,
  UpdateExperienceLevelDto,
  ExperienceLevelDto,
} from '../dto';

@Injectable()
export class ExperienceLevelService {
  constructor(private prisma: PrismaService) {}

  async create(
    createExperienceLevelDto: CreateExperienceLevelDto,
  ): Promise<ExperienceLevelDto> {
    return this.prisma.experienceLevel.create({
      data: createExperienceLevelDto,
    });
  }

  async findAll(): Promise<ExperienceLevelDto[]> {
    return this.prisma.experienceLevel.findMany({
      orderBy: {
        level: 'asc',
      },
    });
  }

  async findOne(id: number): Promise<ExperienceLevelDto> {
    const experienceLevel = await this.prisma.experienceLevel.findUnique({
      where: { id },
    });

    if (!experienceLevel) {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }

    return experienceLevel;
  }

  async findByLevel(level: number): Promise<ExperienceLevelDto> {
    const experienceLevel = await this.prisma.experienceLevel.findUnique({
      where: { level },
    });

    if (!experienceLevel) {
      throw new NotFoundException(
        `Experience level with level ${level} not found`,
      );
    }

    return experienceLevel;
  }

  async update(
    id: number,
    updateExperienceLevelDto: UpdateExperienceLevelDto,
  ): Promise<ExperienceLevelDto> {
    try {
      return await this.prisma.experienceLevel.update({
        where: { id },
        data: updateExperienceLevelDto,
      });
    } catch (error) {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.experienceLevel.delete({
        where: { id },
      });
    } catch (error) {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }
  }

  async findNextLevel(currentXP: number): Promise<ExperienceLevelDto | null> {
    // Find the experience level that matches the user's current XP
    const currentLevel = await this.prisma.experienceLevel.findFirst({
      where: {
        minXP: { lte: currentXP },
        maxXP: { gte: currentXP },
      },
    });

    if (!currentLevel) {
      return null;
    }

    // Find the next level
    const nextLevel = await this.prisma.experienceLevel.findFirst({
      where: {
        level: { gt: currentLevel.level },
      },
      orderBy: {
        level: 'asc',
      },
    });

    return nextLevel;
  }

  async calculateLevel(xp: number): Promise<ExperienceLevelDto> {
    const level = await this.prisma.experienceLevel.findFirst({
      where: {
        minXP: { lte: xp },
        maxXP: { gte: xp },
      },
    });

    if (!level) {
      // If no level is found, return the highest level
      const highestLevel = await this.prisma.experienceLevel.findFirst({
        orderBy: {
          level: 'desc',
        },
      });

      if (!highestLevel) {
        throw new NotFoundException('No experience levels found');
      }

      return highestLevel;
    }

    return level;
  }
}
