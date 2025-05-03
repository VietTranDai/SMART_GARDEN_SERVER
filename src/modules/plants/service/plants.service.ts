import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Plant, PlantType, GrowthStage } from '@prisma/client';
import { CreatePlantTypeDto } from '../dto/create-plant-type.dto';
import { UpdatePlantTypeDto } from '../dto/update-plant-type.dto';
import { CreatePlantDto } from '../dto/create-plant.dto';
import { UpdatePlantDto } from '../dto/update-plant.dto';
import { CreateGrowthStageDto } from '../dto/create-growth-stage.dto';
import { UpdateGrowthStageDto } from '../dto/update-growth-stage.dto';
import { PlantTypeDto } from '../dto/plant-type.dto';
import { PlantDto } from '../dto/plant.dto';
import { GrowthStageDto } from '../dto/growth-stage.dto';

@Injectable()
export class PlantsService {
  private readonly logger = new Logger(PlantsService.name);

  constructor(private readonly prisma: PrismaService) {}

  // Mapper functions to convert Prisma models to DTOs
  private mapToPlantTypeDto(plantType: PlantType): PlantTypeDto {
    return {
      id: plantType.id,
      name: plantType.name,
      description: plantType.description || undefined,
      createdAt: plantType.createdAt,
      updatedAt: plantType.updatedAt,
    };
  }

  private mapToPlantDto(plant: Plant): PlantDto {
    return {
      id: plant.id,
      plantTypeId: plant.plantTypeId || undefined,
      name: plant.name,
      scientificName: plant.scientificName || undefined,
      family: plant.family || undefined,
      description: plant.description || undefined,
      growthDuration: plant.growthDuration || undefined,
      createdAt: plant.createdAt,
      updatedAt: plant.updatedAt,
    };
  }

  private mapToGrowthStageDto(growthStage: GrowthStage): GrowthStageDto {
    return {
      id: growthStage.id,
      plantId: growthStage.plantId,
      stageName: growthStage.stageName,
      order: growthStage.order,
      duration: growthStage.duration,
      description: growthStage.description || undefined,
      optimalTemperatureMin: growthStage.optimalTemperatureMin,
      optimalTemperatureMax: growthStage.optimalTemperatureMax,
      optimalHumidityMin: growthStage.optimalHumidityMin,
      optimalHumidityMax: growthStage.optimalHumidityMax,
      optimalPHMin: growthStage.optimalPHMin || undefined,
      optimalPHMax: growthStage.optimalPHMax || undefined,
      optimalLightMin: growthStage.optimalLightMin || undefined,
      optimalLightMax: growthStage.optimalLightMax || undefined,
      lightRequirement: growthStage.lightRequirement || undefined,
      waterRequirement: growthStage.waterRequirement || undefined,
      nutrientRequirement: growthStage.nutrientRequirement || undefined,
      careInstructions: growthStage.careInstructions || undefined,
      pestSusceptibility: growthStage.pestSusceptibility || undefined,
      createdAt: growthStage.createdAt,
      updatedAt: growthStage.updatedAt,
    };
  }

  // PlantType CRUD operations
  async createPlantType(
    createPlantTypeDto: CreatePlantTypeDto,
  ): Promise<PlantTypeDto> {
    try {
      const plantType = await this.prisma.plantType.create({
        data: {
          id: 0, // This will be auto-assigned or overridden by the DB
          name: createPlantTypeDto.name,
          description: createPlantTypeDto.description,
        },
      });

      this.logger.log(
        `PlantType '${plantType.name}' created successfully with ID: ${plantType.id}`,
      );
      return this.mapToPlantTypeDto(plantType);
    } catch (error) {
      this.logger.error(
        `Failed to create plant type: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create plant type');
    }
  }

  async findAllPlantTypes(): Promise<PlantTypeDto[]> {
    try {
      const plantTypes = await this.prisma.plantType.findMany({
        orderBy: { name: 'asc' },
      });
      return plantTypes.map((plantType) => this.mapToPlantTypeDto(plantType));
    } catch (error) {
      this.logger.error(
        `Failed to get plant types: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plant types');
    }
  }

  async findPlantType(id: number): Promise<PlantTypeDto> {
    try {
      const plantType = await this.prisma.plantType.findUnique({
        where: { id },
        include: { plants: true },
      });

      if (!plantType) {
        throw new NotFoundException(`PlantType with ID ${id} not found`);
      }

      return this.mapToPlantTypeDto(plantType);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get plant type ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plant type');
    }
  }

  async updatePlantType(
    id: number,
    updatePlantTypeDto: UpdatePlantTypeDto,
  ): Promise<PlantTypeDto> {
    try {
      // Verify plant type exists
      await this.findPlantType(id);

      const updatedPlantType = await this.prisma.plantType.update({
        where: { id },
        data: updatePlantTypeDto,
      });

      this.logger.log(`PlantType ${id} updated successfully`);
      return this.mapToPlantTypeDto(updatedPlantType);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update plant type ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update plant type');
    }
  }

  async removePlantType(id: number): Promise<void> {
    try {
      // Verify plant type exists
      await this.findPlantType(id);

      await this.prisma.plantType.delete({ where: { id } });

      this.logger.log(`PlantType ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete plant type ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete plant type');
    }
  }

  // Plant CRUD operations
  async createPlant(createPlantDto: CreatePlantDto): Promise<PlantDto> {
    try {
      // If plantTypeId is provided, verify it exists
      if (createPlantDto.plantTypeId) {
        await this.findPlantType(createPlantDto.plantTypeId);
      }

      const plant = await this.prisma.plant.create({
        data: createPlantDto,
      });

      this.logger.log(
        `Plant '${plant.name}' created successfully with ID: ${plant.id}`,
      );
      return this.mapToPlantDto(plant);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to create plant: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create plant');
    }
  }

  async findAllPlants(): Promise<PlantDto[]> {
    try {
      const plants = await this.prisma.plant.findMany({
        orderBy: { name: 'asc' },
        include: { PlantType: true },
      });
      return plants.map((plant) => this.mapToPlantDto(plant));
    } catch (error) {
      this.logger.error(`Failed to get plants: ${error.message}`, error.stack);
      throw new InternalServerErrorException('Failed to get plants');
    }
  }

  async findPlant(id: number): Promise<PlantDto> {
    try {
      const plant = await this.prisma.plant.findUnique({
        where: { id },
        include: { PlantType: true, growthStages: true },
      });

      if (!plant) {
        throw new NotFoundException(`Plant with ID ${id} not found`);
      }

      return this.mapToPlantDto(plant);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get plant ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plant');
    }
  }

  async updatePlant(
    id: number,
    updatePlantDto: UpdatePlantDto,
  ): Promise<PlantDto> {
    try {
      // Verify plant exists
      await this.findPlant(id);

      // If plantTypeId is provided, verify it exists
      if (updatePlantDto.plantTypeId) {
        await this.findPlantType(updatePlantDto.plantTypeId);
      }

      const updatedPlant = await this.prisma.plant.update({
        where: { id },
        data: updatePlantDto,
        include: { PlantType: true },
      });

      this.logger.log(`Plant ${id} updated successfully`);
      return this.mapToPlantDto(updatedPlant);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to update plant ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update plant');
    }
  }

  async removePlant(id: number): Promise<void> {
    try {
      // Verify plant exists
      await this.findPlant(id);

      await this.prisma.plant.delete({ where: { id } });

      this.logger.log(`Plant ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete plant ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete plant');
    }
  }

  // GrowthStage CRUD operations
  async createGrowthStage(
    createGrowthStageDto: CreateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    try {
      // Verify plant exists
      await this.findPlant(createGrowthStageDto.plantId);

      // Check if the order is unique for this plant
      const existingGrowthStage = await this.prisma.growthStage.findFirst({
        where: {
          plantId: createGrowthStageDto.plantId,
          order: createGrowthStageDto.order,
        },
      });

      if (existingGrowthStage) {
        throw new BadRequestException(
          `Growth stage with order ${createGrowthStageDto.order} already exists for this plant`,
        );
      }

      const growthStage = await this.prisma.growthStage.create({
        data: createGrowthStageDto,
      });

      this.logger.log(
        `GrowthStage '${growthStage.stageName}' created successfully with ID: ${growthStage.id}`,
      );
      return this.mapToGrowthStageDto(growthStage);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to create growth stage: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create growth stage');
    }
  }

  async findAllGrowthStagesByPlant(plantId: number): Promise<GrowthStageDto[]> {
    try {
      // Verify plant exists
      await this.findPlant(plantId);

      const growthStages = await this.prisma.growthStage.findMany({
        where: { plantId },
        orderBy: { order: 'asc' },
      });

      return growthStages.map((stage) => this.mapToGrowthStageDto(stage));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get growth stages for plant ${plantId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get growth stages');
    }
  }

  async findGrowthStage(id: number): Promise<GrowthStageDto> {
    try {
      const growthStage = await this.prisma.growthStage.findUnique({
        where: { id },
      });

      if (!growthStage) {
        throw new NotFoundException(`Growth stage with ID ${id} not found`);
      }

      return this.mapToGrowthStageDto(growthStage);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get growth stage ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get growth stage');
    }
  }

  async updateGrowthStage(
    id: number,
    updateGrowthStageDto: UpdateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    try {
      // Verify growth stage exists
      const existingStage = await this.findGrowthStage(id);

      // Check for potential conflicts if updating the plant or order
      if (updateGrowthStageDto.hasOwnProperty('plantId')) {
        // Verify new plant exists if changing plants
        const plantId = updateGrowthStageDto['plantId'] as number;
        if (plantId !== existingStage.plantId) {
          await this.findPlant(plantId);
        }
      }

      if (updateGrowthStageDto.hasOwnProperty('order')) {
        // Check if the order would conflict
        const order = updateGrowthStageDto['order'] as number;
        const plantId = updateGrowthStageDto.hasOwnProperty('plantId')
          ? (updateGrowthStageDto['plantId'] as number)
          : existingStage.plantId;

        const conflictingStage = await this.prisma.growthStage.findFirst({
          where: {
            plantId,
            order,
            id: { not: id }, // Exclude current stage
          },
        });

        if (conflictingStage) {
          throw new BadRequestException(
            `Growth stage with order ${order} already exists for this plant`,
          );
        }
      }

      const updatedGrowthStage = await this.prisma.growthStage.update({
        where: { id },
        data: updateGrowthStageDto,
      });

      this.logger.log(`Growth stage ${id} updated successfully`);
      return this.mapToGrowthStageDto(updatedGrowthStage);
    } catch (error) {
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update growth stage ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update growth stage');
    }
  }

  async removeGrowthStage(id: number): Promise<void> {
    try {
      // Verify growth stage exists
      await this.findGrowthStage(id);

      await this.prisma.growthStage.delete({ where: { id } });

      this.logger.log(`Growth stage ${id} deleted successfully`);
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to delete growth stage ${id}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete growth stage');
    }
  }
}
