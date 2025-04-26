import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import { Garden, GardenStatus, GardenType, Prisma } from '@prisma/client';
import { randomUUID } from 'crypto';
import { CreateGardenDto } from '../dto/create-garden.dto';
import { UpdateGardenDto } from '../dto/update-garden.dto';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';

@Injectable()
export class GardenService {
  private readonly logger = new Logger(GardenService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    gardenerId: number,
    createGardenDto: CreateGardenDto,
  ): Promise<Garden> {
    try {
      // Generate a unique key for the garden
      const gardenKey = this.generateGardenKey();

      // Create the garden with the generated key
      const garden = await this.prisma.garden.create({
        data: {
          ...createGardenDto,
          gardenKey,
          gardenerId,
          status: 'ACTIVE',
        },
        include: {
          gardener: {
            select: {
              userId: true,
              experiencePoints: true,
              experienceLevelId: true,
              experienceLevel: true,
            },
          },
        },
      });

      this.logger.log(`Garden created successfully with ID: ${garden.id}`);
      return garden;
    } catch (error) {
      this.logger.error(
        `Failed to create garden for gardener ${gardenerId}`,
        error.stack,
      );
      if (error instanceof PrismaClientKnownRequestError) {
        // Handle unique constraint violations
        if (error.code === 'P2002') {
          throw new ConflictException(
            'A garden with this information already exists',
          );
        }
        // Handle foreign key constraints
        if (error.code === 'P2003') {
          throw new NotFoundException(
            `Gardener with ID ${gardenerId} not found`,
          );
        }
      }
      throw new InternalServerErrorException('Failed to create garden');
    }
  }

  async findAll(gardenerId: number): Promise<Garden[]> {
    try {
      return this.prisma.garden.findMany({
        where: {
          gardenerId,
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
        orderBy: {
          createdAt: 'desc',
        },
      });
    } catch (error) {
      this.logger.error(
        `Failed to fetch garden for gardener ${gardenerId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to fetch garden');
    }
  }

  async findOne(id: number): Promise<Garden> {
    const garden = await this.prisma.garden.findUnique({
      where: { id },
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

    if (!garden) {
      this.logger.warn(`Garden with ID ${id} not found`);
      throw new NotFoundException(`Garden with ID ${id} not found`);
    }

    return garden;
  }

  async findOneByGardenKey(gardenKey: string): Promise<Garden> {
    const garden = await this.prisma.garden.findUnique({
      where: { gardenKey },
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

    if (!garden) {
      this.logger.warn(`Garden with key ${gardenKey} not found`);
      throw new NotFoundException(`Garden with key ${gardenKey} not found`);
    }

    return garden;
  }

  async update(
    gardenerId: number,
    gardenId: number,
    updateGardenDto: UpdateGardenDto,
  ): Promise<Garden> {
    try {
      // First check if garden exists and belongs to the gardener
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: { gardenerId: true },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      if (garden.gardenerId !== gardenerId) {
        this.logger.warn(
          `Unauthorized access attempt: Gardener ${gardenerId} tried to update garden ${gardenId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to update this garden',
        );
      }

      return this.prisma.garden.update({
        where: { id: gardenId },
        data: updateGardenDto,
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
      this.logger.error(`Failed to update garden ${gardenId}`, error.stack);
      throw new InternalServerErrorException('Failed to update garden');
    }
  }

  async remove(gardenerId: number, gardenId: number): Promise<void> {
    try {
      // First check if garden exists and belongs to the gardener
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: { gardenerId: true },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      if (garden.gardenerId !== gardenerId) {
        this.logger.warn(
          `Unauthorized access attempt: Gardener ${gardenerId} tried to delete garden ${gardenId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to delete this garden',
        );
      }

      await this.prisma.garden.delete({
        where: { id: gardenId },
      });

      this.logger.log(`Garden with ID ${gardenId} deleted successfully`);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      this.logger.error(`Failed to delete garden ${gardenId}`, error.stack);
      throw new InternalServerErrorException('Failed to delete garden');
    }
  }

  async updateGardenStatus(
    gardenerId: number,
    gardenId: number,
    status: GardenStatus,
  ): Promise<Garden> {
    try {
      // First check if garden exists and belongs to the gardener
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: { gardenerId: true },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      if (garden.gardenerId !== gardenerId) {
        this.logger.warn(
          `Unauthorized access attempt: Gardener ${gardenerId} tried to update status of garden ${gardenId}`,
        );
        throw new ForbiddenException(
          'You do not have permission to update this garden',
        );
      }

      return this.prisma.garden.update({
        where: { id: gardenId },
        data: { status },
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
        `Failed to update garden status ${gardenId}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update garden status');
    }
  }

  async updatePlantInfo(
    gardenerId: number,
    gardenId: number,
    plantName: string,
    plantGrowStage?: string,
    plantStartDate?: Date,
    plantDuration?: number,
  ): Promise<Garden> {
    try {
      // First check if garden exists and belongs to the gardener
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: { gardenerId: true },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      if (garden.gardenerId !== gardenerId) {
        this.logger.warn(
          `Unauthorized access attempt: Gardener ${gardenerId} tried to update plant info of garden ${gardenId}`,
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

  private generateGardenKey(): string {
    // Generate a unique identifier for the garden
    // This could be a UUID or a custom format
    return `garden_${randomUUID()}`;
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
}
