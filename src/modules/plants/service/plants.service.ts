import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { PlantType, GrowthStage } from '@prisma/client';
import { CreatePlantTypeDto } from '../dto/create-plant-type.dto';
import { UpdatePlantTypeDto } from '../dto/update-plant-type.dto';
import { CreateGrowthStageDto } from '../dto/create-growth-stage.dto';
import { UpdateGrowthStageDto } from '../dto/update-growth-stage.dto';
import { PlantTypeDto } from '../dto/plant-type.dto';
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
      scientificName: plantType.scientificName || undefined,
      family: plantType.family || undefined,
      description: plantType.description || undefined,
      growthDuration: plantType.growthDuration || undefined,
      createdAt: plantType.createdAt,
      updatedAt: plantType.updatedAt,
    };
  }

  private mapToGrowthStageDto(growthStage: GrowthStage): GrowthStageDto {
    return {
      id: growthStage.id,
      plantTypeId: growthStage.plantTypeId,
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
        data: createPlantTypeDto,
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
        include: { growthStages: true },
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

  // GrowthStage CRUD operations
  async createGrowthStage(
    createGrowthStageDto: CreateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    try {
      // Verify plant type exists
      await this.findPlantType(createGrowthStageDto.plantTypeId);

      // Check if the order is unique for this plant type
      const existingGrowthStage = await this.prisma.growthStage.findFirst({
        where: {
          plantTypeId: createGrowthStageDto.plantTypeId,
          order: createGrowthStageDto.order,
        },
      });

      if (existingGrowthStage) {
        throw new BadRequestException(
          `Growth stage with order ${createGrowthStageDto.order} already exists for this plant type`,
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

  async findAllGrowthStagesByPlantType(
    plantTypeId: number,
  ): Promise<GrowthStageDto[]> {
    try {
      // Verify plant type exists
      await this.findPlantType(plantTypeId);

      const growthStages = await this.prisma.growthStage.findMany({
        where: { plantTypeId },
        orderBy: { order: 'asc' },
      });

      return growthStages.map((stage) => this.mapToGrowthStageDto(stage));
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      this.logger.error(
        `Failed to get growth stages for plant type ${plantTypeId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get growth stages');
    }
  }

  async findGrowthStage(id: number): Promise<GrowthStageDto> {
    try {
      const growthStage = await this.prisma.growthStage.findUnique({
        where: { id },
        include: { plantType: true },
      });

      if (!growthStage) {
        throw new NotFoundException(`GrowthStage with ID ${id} not found`);
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
      const existingGrowthStage = await this.findGrowthStage(id);

      // If order is being updated, check for duplicate order
      if (
        updateGrowthStageDto.order &&
        updateGrowthStageDto.order !== existingGrowthStage.order
      ) {
        const duplicateOrder = await this.prisma.growthStage.findFirst({
          where: {
            plantTypeId: existingGrowthStage.plantTypeId,
            order: updateGrowthStageDto.order,
            id: { not: id },
          },
        });

        if (duplicateOrder) {
          throw new BadRequestException(
            `Growth stage with order ${updateGrowthStageDto.order} already exists for this plant type`,
          );
        }
      }

      const updatedGrowthStage = await this.prisma.growthStage.update({
        where: { id },
        data: updateGrowthStageDto,
      });

      this.logger.log(`GrowthStage ${id} updated successfully`);
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

      this.logger.log(`GrowthStage ${id} deleted successfully`);
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

  async create(
    gardenerId: number,
    createPlantDto: CreatePlantTypeDto,
  ): Promise<PlantType> {
    const { name, scientificName, family, description, growthDuration } =
      createPlantDto;

    try {
      const plant = await this.prisma.plantType.create({
        data: {
          name,
          scientificName,
          family,
          description,
          growthDuration,
        },
      });

      this.logger.log(
        `Plant '${name}' created successfully with ID: ${plant.id}`,
      );
      return plant;
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to create plant '${name}': ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to create plant');
    }
  }

  async findAllByGarden(
    gardenerId: number,
    gardenId: number,
  ): Promise<PlantTypeDto[]> {
    try {
      const plants = await this.prisma.plantType.findMany({
        orderBy: { createdAt: 'desc' },
      });

      return plants.map((plant) => this.mapToPlantTypeDto(plant));
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to get plants for garden ${gardenId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plants');
    }
  }

  async findOne(plantId: number): Promise<PlantTypeDto> {
    try {
      const plant = await this.prisma.plantType.findUnique({
        where: { id: plantId },
      });

      if (!plant) {
        throw new NotFoundException(`Plant with ID ${plantId} not found`);
      }

      return this.mapToPlantTypeDto(plant);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to get plant ${plantId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to get plant');
    }
  }

  async update(
    gardenerId: number,
    plantId: number,
    updatePlantDto: UpdatePlantTypeDto,
  ): Promise<PlantTypeDto> {
    try {
      // Verify plant exists and user has access
      const existingPlant = await this.findOne(plantId);

      const dataToUpdate: Partial<UpdatePlantTypeDto> & {
        plantingDate?: Date | null;
      } = {};
      if (updatePlantDto.name !== undefined)
        dataToUpdate.name = updatePlantDto.name;
      if (updatePlantDto.scientificName !== undefined)
        dataToUpdate.scientificName = updatePlantDto.scientificName;
      if (updatePlantDto.family !== undefined)
        dataToUpdate.family = updatePlantDto.family;
      if (updatePlantDto.description !== undefined)
        dataToUpdate.description = updatePlantDto.description;
      if (updatePlantDto.growthDuration !== undefined)
        dataToUpdate.growthDuration = updatePlantDto.growthDuration;

      if (Object.keys(dataToUpdate).length === 0) {
        return existingPlant; // Nothing to update
      }

      const updatedPlant = await this.prisma.plantType.update({
        where: { id: plantId },
        data: dataToUpdate,
      });

      this.logger.log(`Plant ${plantId} updated successfully`);
      return this.mapToPlantTypeDto(updatedPlant);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to update plant ${plantId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to update plant');
    }
  }

  async remove(gardenerId: number, plantId: number): Promise<void> {
    try {
      // Verify plant exists and user has access
      await this.findOne(plantId);

      await this.prisma.plantType.delete({ where: { id: plantId } });

      this.logger.log(`Plant ${plantId} deleted successfully`);
    } catch (error) {
      if (
        error instanceof ForbiddenException ||
        error instanceof NotFoundException
      ) {
        throw error;
      }
      this.logger.error(
        `Failed to delete plant ${plantId}: ${error.message}`,
        error.stack,
      );
      throw new InternalServerErrorException('Failed to delete plant');
    }
  }
}
