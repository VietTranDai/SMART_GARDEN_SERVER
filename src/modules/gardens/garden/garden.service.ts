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
import { GardenDto, mapToGardenDto } from './dto/garden.dto';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import {
  GardenPlantDetailsDto,
  GrowthStageDto,
} from 'src/modules/gardens/garden/dto/garden-plant-details.dto';
import { GardenStatus, GardenType } from '@prisma/client';

@Injectable()
export class GardenService {
  private readonly logger = new Logger(GardenService.name);
  constructor(private readonly prisma: PrismaService) {}

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

    if (garden.gardenerId !== gardenerId) {
      throw new ForbiddenException(
        'You do not have permission to access this garden',
      );
    }

    return true;
  }

  private readonly defaultInclude = {
    gardener: {
      include: {
        user: { include: { role: true } },
        experienceLevel: true,
      },
    },
    sensors: true,
  } as const;

  async findAll(userId: number): Promise<GardenDto[]> {
    const gardens = await this.prisma.garden.findMany({
      where: { gardenerId: userId },
      include: this.defaultInclude,
    });
    return gardens.map((garden) =>
      mapToGardenDto(garden, garden.sensors.length),
    );
  }

  async findOne(userId: number, gardenId: number): Promise<GardenDto> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: this.defaultInclude,
    });
    if (!garden) throw new NotFoundException(`Garden ${gardenId} not found`);

    if (!(await this.checkGardenOwnership(userId, gardenId))) {
      throw new ForbiddenException(`Garden ${gardenId} not found`);
    }

    return mapToGardenDto(garden, garden.sensors.length);
  }

  async create(
    userId: number,
    createGardenDto: CreateGardenDto,
  ): Promise<GardenDto> {
    try {
      // Check if garden with same gardenKey already exists
      if (createGardenDto.gardenKey) {
        const existingGarden = await this.prisma.garden.findUnique({
          where: { gardenKey: createGardenDto.gardenKey },
        });

        if (existingGarden) {
          throw new ConflictException(
            `Garden with key ${createGardenDto.gardenKey} already exists`,
          );
        }
      } else {
        // Generate a unique gardenKey if not provided
        createGardenDto.gardenKey = `garden-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
      }

      // Convert date string to Date object if provided
      const plantStartDate = createGardenDto.plantStartDate
        ? new Date(createGardenDto.plantStartDate)
        : undefined;

      // Create garden with properly typed data
      const newGarden = await this.prisma.garden.create({
        data: {
          name: createGardenDto.name,
          gardenKey: createGardenDto.gardenKey,
          description: createGardenDto.description,
          street: createGardenDto.street,
          ward: createGardenDto.ward,
          district: createGardenDto.district,
          city: createGardenDto.city,
          lat: createGardenDto.lat,
          lng: createGardenDto.lng,
          profilePicture: createGardenDto.profilePicture,
          type: createGardenDto.type || GardenType.OUTDOOR,
          status: createGardenDto.status || GardenStatus.ACTIVE,
          plantName: createGardenDto.plantName,
          plantGrowStage: createGardenDto.plantGrowStage,
          plantStartDate: plantStartDate,
          plantDuration: createGardenDto.plantDuration,
          gardenerId: userId,
        },
        include: this.defaultInclude,
      });

      return mapToGardenDto(newGarden, newGarden.sensors.length);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      this.logger.error(
        `Failed to create garden: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create garden');
    }
  }

  async update(
    userId: number,
    gardenId: number,
    updateGardenDto: UpdateGardenDto,
  ): Promise<GardenDto> {
    try {
      // If gardenKey is being updated, check for conflicts
      if (updateGardenDto.gardenKey) {
        const existingGarden = await this.prisma.garden.findFirst({
          where: {
            gardenKey: updateGardenDto.gardenKey,
            id: { not: gardenId },
          },
        });

        if (existingGarden) {
          throw new ConflictException(
            `Garden with key ${updateGardenDto.gardenKey} already exists`,
          );
        }
      }

      // Convert date string to Date object if provided
      const plantStartDate = updateGardenDto.plantStartDate
        ? new Date(updateGardenDto.plantStartDate)
        : undefined;

      // Prepare update data
      const updateData: any = { ...updateGardenDto };

      // Replace plantStartDate string with Date object if it exists
      if (plantStartDate) {
        updateData.plantStartDate = plantStartDate;
      } else {
        // Remove the field if it's undefined to prevent type errors
        delete updateData.plantStartDate;
      }

      const updatedGarden = await this.prisma.garden.update({
        where: { id: gardenId },
        data: updateData,
        include: this.defaultInclude,
      });

      return mapToGardenDto(updatedGarden, updatedGarden.sensors.length);
    } catch (error) {
      if (error instanceof ConflictException) {
        throw error;
      }
      if (error.code === 'P2025') {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }
      this.logger.error(
        `Failed to update garden: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update garden');
    }
  }

  async remove(gardenId: number): Promise<void> {
    try {
      await this.prisma.garden.delete({
        where: { id: gardenId },
      });
    } catch (error) {
      if (error.code === 'P2025') {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }
      this.logger.error(
        `Failed to delete garden: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete garden');
    }
  }

  async getPlantDetails(gardenId: number): Promise<GardenPlantDetailsDto> {
    try {
      // Get garden with plant details
      const garden = await this.prisma.garden.findUnique({
        where: { id: gardenId },
        select: {
          id: true,
          name: true,
          plantName: true,
          plantGrowStage: true,
          plantStartDate: true,
          plantDuration: true,
        },
      });

      if (!garden) {
        throw new NotFoundException(`Garden with ID ${gardenId} not found`);
      }

      // If no plant name is set, return basic details
      if (!garden.plantName) {
        return {
          id: garden.id,
          gardenName: garden.name,
          plantName: null,
          currentGrowthStage: null,
          plantStartDate: null,
          growthDuration: null,
          growthStages: [],
          completionPercentage: 0,
        };
      }

      // Find plant details based on garden's plantName
      const plant = await this.prisma.plant.findUnique({
        where: { name: garden.plantName },
        include: {
          growthStages: {
            orderBy: { order: 'asc' },
          },
        },
      });

      if (!plant) {
        // Return basic details without growth stages
        const growthDuration = garden.plantDuration ?? 0;

        return {
          id: garden.id,
          gardenName: garden.name,
          plantName: garden.plantName,
          currentGrowthStage: garden.plantGrowStage,
          plantStartDate: garden.plantStartDate,
          growthDuration: growthDuration,
          growthStages: [],
          completionPercentage:
            garden.plantStartDate && growthDuration > 0
              ? this.calculateCompletionPercentage(
                  garden.plantStartDate,
                  growthDuration,
                )
              : 0,
        };
      }

      // Get growth duration, defaulting to 0 if both are null
      const growthDuration = garden.plantDuration ?? plant.growthDuration ?? 0;

      // Return full plant details with growth stages
      return {
        id: garden.id,
        gardenName: garden.name,
        plantName: garden.plantName,
        currentGrowthStage: garden.plantGrowStage,
        plantStartDate: garden.plantStartDate,
        growthDuration: growthDuration,
        growthStages: plant.growthStages.map((stage) => ({
          id: stage.id,
          name: stage.stageName,
          order: stage.order,
          duration: stage.duration,
          description: stage.description ?? undefined,
          careInstructions: stage.careInstructions ?? undefined,
        })),
        completionPercentage:
          garden.plantStartDate && growthDuration > 0
            ? this.calculateCompletionPercentage(
                garden.plantStartDate,
                growthDuration,
              )
            : 0,
      };
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get plant details: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plant details');
    }
  }

  private calculateCompletionPercentage(
    startDate: Date,
    duration: number,
  ): number {
    if (!startDate || !duration) return 0;

    const now = new Date();
    const start = new Date(startDate);
    const elapsed = now.getTime() - start.getTime();
    const durationMs = duration * 24 * 60 * 60 * 1000; // Convert days to milliseconds

    // Calculate percentage (capped at 100%)
    return Math.min(Math.floor((elapsed / durationMs) * 100), 100);
  }

  async getGardenPhotos(gardenId: number) {
    try {
      // Find photo evaluations for this garden
      const photoEvaluations = await this.prisma.photoEvaluation.findMany({
        where: {
          gardenId,
        },
        orderBy: {
          createdAt: 'desc',
        },
        include: {
          gardener: {
            include: {
              user: {
                select: {
                  firstName: true,
                  lastName: true,
                },
              },
            },
          },
        },
      });

      // Transform data for frontend
      return {
        data: photoEvaluations.map((photo) => ({
          id: photo.id,
          taskId: photo.taskId,
          photoUrl: photo.photoUrl,
          aiFeedback: photo.aiFeedback,
          confidence: photo.confidence,
          notes: photo.notes,
          plantName: photo.plantName,
          plantGrowStage: photo.plantGrowStage,
          evaluatedAt: photo.evaluatedAt,
          createdAt: photo.createdAt,
          gardenerName: `${photo.gardener.user.firstName} ${photo.gardener.user.lastName}`,
        })),
      };
    } catch (error) {
      this.logger.error(
        `Failed to get garden photos: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get garden photos');
    }
  }

  async getSensorHistory(gardenId: number, days: number = 7) {
    try {
      // Get all sensors for this garden
      const sensors = await this.prisma.sensor.findMany({
        where: { gardenId },
      });

      if (sensors.length === 0) {
        return { data: {} };
      }

      // Calculate date range
      const endDate = new Date();
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      // Get sensor data for each sensor
      const sensorDataMap = {};

      for (const sensor of sensors) {
        const sensorData = await this.prisma.sensorData.findMany({
          where: {
            sensorId: sensor.id,
            timestamp: {
              gte: startDate,
              lte: endDate,
            },
          },
          orderBy: {
            timestamp: 'asc',
          },
        });

        // Group data by sensor
        if (sensorData.length > 0) {
          sensorDataMap[sensor.type] = {
            sensorId: sensor.id,
            sensorName: sensor.name,
            unit: sensor.unit,
            data: sensorData.map((data) => ({
              timestamp: data.timestamp,
              value: data.value,
            })),
          };
        }
      }

      return { data: sensorDataMap };
    } catch (error) {
      this.logger.error(
        `Failed to get sensor history: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get sensor history');
    }
  }
}
