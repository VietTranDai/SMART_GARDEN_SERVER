import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { ExperienceLevel } from '@prisma/client';
import {
  CreateExperienceLevelDto,
  ExperienceLevelDto,
  UpdateExperienceLevelDto,
} from '../dto';
import { plainToInstance } from 'class-transformer';

@Injectable()
export class ExperienceLevelService {
  constructor(private prisma: PrismaService) {}

  /**
   * Generic mapper: chuyển entity (hoặc mảng entity) sang DTO
   * @param entity - đối tượng entity hoặc mảng entity
   * @param dtoClass - lớp DTO cần chuyển đến
   * @returns instance của DTO hoặc mảng instance DTO
   */
  public mapToDto<D>(
    entity: object | object[],
    dtoClass: new () => D,
  ): D | D[] {
    return plainToInstance(dtoClass, entity, {
      excludeExtraneousValues: true,
    });
  }

  // ─── CRUD TRẢ VỀ PRISMA ENTITY ─────────────────────────────────────────

  async create(
    createExperienceLevelDto: CreateExperienceLevelDto,
  ): Promise<ExperienceLevel> {
    return this.prisma.experienceLevel.create({
      data: createExperienceLevelDto,
    });
  }

  async findAll(): Promise<ExperienceLevel[]> {
    return this.prisma.experienceLevel.findMany({
      orderBy: { level: 'asc' },
    });
  }

  async findOne(id: number): Promise<ExperienceLevel> {
    const entity = await this.prisma.experienceLevel.findUnique({
      where: { id },
    });
    if (!entity) {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }
    return entity;
  }

  async update(
    id: number,
    updateExperienceLevelDto: UpdateExperienceLevelDto,
  ): Promise<ExperienceLevel> {
    try {
      return await this.prisma.experienceLevel.update({
        where: { id },
        data: updateExperienceLevelDto,
      });
    } catch {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }
  }

  async remove(id: number): Promise<void> {
    try {
      await this.prisma.experienceLevel.delete({ where: { id } });
    } catch {
      throw new NotFoundException(`Experience level with ID ${id} not found`);
    }
  }

  // ─── CÁC HÀM LOGIC KHÁC ────────────────────────────────────────────────

  async findNextLevel(
    currentXP: number,
  ): Promise<ExperienceLevel | null> {
    const currentLevel = await this.prisma.experienceLevel.findFirst({
      where: {
        minXP: { lte: currentXP },
        maxXP: { gte: currentXP },
      },
    });
    if (!currentLevel) {
      throw new NotFoundException('No experience levels found');
    }
    return this.prisma.experienceLevel.findFirst({
      where: { level: { gt: currentLevel.level } },
      orderBy: { level: 'asc' },
    });
  }

  async calculateLevel(xp: number): Promise<ExperienceLevel> {
    const level = await this.prisma.experienceLevel.findFirst({
      where: { minXP: { lte: xp }, maxXP: { gte: xp } },
    });
    if (level) {
      return level;
    }
    const highest = await this.prisma.experienceLevel.findFirst({
      orderBy: { level: 'desc' },
    });
    if (!highest) {
      throw new NotFoundException('No experience levels found');
    }
    return highest;
  }

  /**
   * Ví dụ: lấy entity rồi map sang DTO
   */
  async findOneDto(id: number): Promise<ExperienceLevelDto> {
    const entity = await this.findOne(id);
    return this.mapToDto(entity, ExperienceLevelDto) as ExperienceLevelDto;
  }

  /**
   * Ví dụ: lấy tất cả rồi map sang mảng DTO
   */
  async findAllDto(): Promise<ExperienceLevelDto[]> {
    const entities = await this.findAll();
    return this.mapToDto(entities, ExperienceLevelDto) as ExperienceLevelDto[];
  }
}
