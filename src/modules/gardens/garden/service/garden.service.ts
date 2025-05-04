// src/garden/garden.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateGardenDto } from '../dto/create-garden.dto';
import { UpdateGardenDto } from '../dto/update-garden.dto';
import { GardenDto, mapToGardenDto } from '../dto/garden.dto';
import { Garden, GardenStatus } from '@prisma/client';

@Injectable()
export class GardenService {
  private readonly logger = new Logger(GardenService.name);
  constructor(private readonly prisma: PrismaService) {}

  private readonly defaultInclude = {
    gardener: {
      include: {
        user: { include: { role: true } },
        experienceLevel: true,
      },
    },
  } as const;

  async create(
    userId: number,
    dto: CreateGardenDto,
  ): Promise<GardenDto> {
    try {
      const gardenKey = `garden_${randomUUID()}`;
      const garden = await this.prisma.garden.create({
        data: { ...dto, gardenKey, gardenerId: userId, status: GardenStatus.ACTIVE },
        include: this.defaultInclude,
      });
      this.logger.log(`Garden created ${garden.id}`);
      return mapToGardenDto(garden);
    } catch (error: any) {
      this.logger.error('Create failed', error.stack);
      if (error.code === 'P2002') {
        throw new ConflictException('Garden already exists');
      }
      throw new InternalServerErrorException();
    }
  }

  async findAll(userId: number): Promise<GardenDto[]> {
    const gardens = await this.prisma.garden.findMany({
      where: { gardenerId: userId },
      include: this.defaultInclude,
    });
    return gardens.map(mapToGardenDto);
  }

  async findOne(id: number): Promise<GardenDto> {
    const garden = await this.prisma.garden.findUnique({
      where: { id },
      include: this.defaultInclude,
    });
    if (!garden) throw new NotFoundException(`Garden ${id} not found`);
    return mapToGardenDto(garden);
  }

  async findOneByGardenKey(key: string): Promise<GardenDto> {
    const garden = await this.prisma.garden.findUnique({
      where: { gardenKey: key },
      include: this.defaultInclude,
    });
    if (!garden) throw new NotFoundException(`Garden key ${key} not found`);
    return mapToGardenDto(garden);
  }

  async checkGardenOwnership(
    gardenerId: number,
    gardenId: number,
  ): Promise<boolean> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { gardenerId: true },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found`);
    }

    return garden.gardenerId === gardenerId;
  }

  async update(
    userId: number,
    id: number,
    dto: UpdateGardenDto,
  ): Promise<GardenDto> {
    const existing = await this.prisma.garden.findUnique({
      where: { id },
      select: { gardenerId: true },
    });
    if (!existing) throw new NotFoundException(`Garden ${id} not found`);
    if (existing.gardenerId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.garden.update({
      where: { id },
      data: dto,
      include: this.defaultInclude,
    });
    return mapToGardenDto(updated);
  }

  async remove(userId: number, id: number): Promise<void> {
    const existing = await this.prisma.garden.findUnique({
      where: { id },
      select: { gardenerId: true },
    });
    if (!existing) throw new NotFoundException(`Garden ${id} not found`);
    if (existing.gardenerId !== userId) throw new ForbiddenException();

    await this.prisma.garden.delete({ where: { id } });
    this.logger.log(`Garden ${id} deleted`);
  }

  async updateGardenStatus(
    userId: number,
    id: number,
    status: GardenStatus,
  ): Promise<GardenDto> {
    const existing = await this.prisma.garden.findUnique({
      where: { id },
      select: { gardenerId: true },
    });
    if (!existing) throw new NotFoundException(`Garden ${id} not found`);
    if (existing.gardenerId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.garden.update({
      where: { id },
      data: { status },
      include: this.defaultInclude,
    });
    return mapToGardenDto(updated);
  }

  async updatePlantInfo(
    userId: number,
    gardenId: number,
    plantName: string,
    plantGrowStage?: string,
    plantStartDate?: Date,
    plantDuration?: number,
  ): Promise<Garden> {
    try {
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: { gardenerId: true },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      if (garden.gardenerId !== userId) {
        this.logger.warn(
          `Unauthorized access attempt: Gardener ${userId} tried to update plant info of garden ${gardenId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to update this garden',
        );
      }

      return this.prisma.garden.update({
        where: { id: gardenId },
        data: {
          plantName,
          plantGrowStage,
          plantStartDate,
          plantDuration,
        },
        include: {
          gardener: {
            select: {
              userId: true,
              experiencePoints: true,
              experienceLevel: true,
            },
          },
        },
      });
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update plant info for garden ${gardenId}`,
        error.stack,
      );
      throw new InternalServerErrorException(
        'Failed to update plant information',
      );
    }
  }

  // private generateGardenKey(): string {
  //   return `garden_${randomUUID()}`;
  // }
}