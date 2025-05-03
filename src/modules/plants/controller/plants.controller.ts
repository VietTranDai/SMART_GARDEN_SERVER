import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  Logger,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { PlantsService } from '../service/plants.service';

import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { ApiTags, ApiOperation, ApiResponse, ApiParam } from '@nestjs/swagger';
import { PlantTypeDto } from '../dto/plant-type.dto';
import { CreatePlantTypeDto } from '../dto/create-plant-type.dto';
import { UpdatePlantTypeDto } from '../dto/update-plant-type.dto';
import { PlantDto } from '../dto/plant.dto';
import { CreatePlantDto } from '../dto/create-plant.dto';
import { UpdatePlantDto } from '../dto/update-plant.dto';
import { GrowthStageDto } from '../dto/growth-stage.dto';
import { CreateGrowthStageDto } from '../dto/create-growth-stage.dto';
import { UpdateGrowthStageDto } from '../dto/update-growth-stage.dto';
import { JwtPayload } from '../../auth/dto/jwt-payload.interface';

@ApiTags('Plant Types')
@Controller('plant-types')
// Assuming global JwtAuthGuard and ApiBearerAuth() from main.ts
export class PlantsController {
  private readonly logger = new Logger(PlantsController.name);
  constructor(private readonly plantsService: PlantsService) {}

  // PlantType endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new plant type' })
  @ApiResponse({
    status: 201,
    description: 'The plant type has been successfully created.',
    type: PlantTypeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  createPlantType(
    @GetUser() user: JwtPayload,
    @Body() createPlantTypeDto: CreatePlantTypeDto,
  ): Promise<PlantTypeDto> {
    this.logger.log(
      `User ${user.sub} creating plant type '${createPlantTypeDto.name}'`,
    );
    return this.plantsService.createPlantType(createPlantTypeDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plant types' })
  @ApiResponse({
    status: 200,
    description: 'List of all plant types.',
    type: [PlantTypeDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAllPlantTypes(): Promise<PlantTypeDto[]> {
    return this.plantsService.findAllPlantTypes();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific plant type by ID' })
  @ApiParam({ name: 'id', description: 'ID of the plant type', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Details of the plant type.',
    type: PlantTypeDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant type not found.' })
  findPlantType(@Param('id', ParseIntPipe) id: number): Promise<PlantTypeDto> {
    return this.plantsService.findPlantType(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plant type' })
  @ApiParam({
    name: 'id',
    description: 'ID of the plant type to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The plant type has been successfully updated.',
    type: PlantTypeDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant type not found.' })
  updatePlantType(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlantTypeDto: UpdatePlantTypeDto,
  ): Promise<PlantTypeDto> {
    this.logger.log(`User ${user.sub} updating plant type ${id}`);
    return this.plantsService.updatePlantType(id, updatePlantTypeDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plant type' })
  @ApiParam({
    name: 'id',
    description: 'ID of the plant type to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'The plant type has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant type not found.' })
  removePlantType(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    this.logger.log(`User ${user.sub} deleting plant type ${id}`);
    return this.plantsService.removePlantType(id);
  }
}

@ApiTags('Plants')
@Controller('plants')
export class PlantsDataController {
  private readonly logger = new Logger(PlantsDataController.name);
  constructor(private readonly plantsService: PlantsService) {}

  // Plant endpoints
  @Post()
  @ApiOperation({ summary: 'Create a new plant' })
  @ApiResponse({
    status: 201,
    description: 'The plant has been successfully created.',
    type: PlantDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  createPlant(
    @GetUser() user: JwtPayload,
    @Body() createPlantDto: CreatePlantDto,
  ): Promise<PlantDto> {
    this.logger.log(`User ${user.sub} creating plant '${createPlantDto.name}'`);
    return this.plantsService.createPlant(createPlantDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all plants' })
  @ApiResponse({
    status: 200,
    description: 'List of all plants.',
    type: [PlantDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  findAllPlants(): Promise<PlantDto[]> {
    return this.plantsService.findAllPlants();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific plant by ID' })
  @ApiParam({ name: 'id', description: 'ID of the plant', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Details of the plant.',
    type: PlantDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant not found.' })
  findPlant(@Param('id', ParseIntPipe) id: number): Promise<PlantDto> {
    return this.plantsService.findPlant(id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Update a plant' })
  @ApiParam({
    name: 'id',
    description: 'ID of the plant to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The plant has been successfully updated.',
    type: PlantDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant not found.' })
  updatePlant(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() updatePlantDto: UpdatePlantDto,
  ): Promise<PlantDto> {
    this.logger.log(`User ${user.sub} updating plant ${id}`);
    return this.plantsService.updatePlant(id, updatePlantDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a plant' })
  @ApiParam({
    name: 'id',
    description: 'ID of the plant to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'The plant has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant not found.' })
  removePlant(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    this.logger.log(`User ${user.sub} deleting plant ${id}`);
    return this.plantsService.removePlant(id);
  }

  // GrowthStage endpoints
  @Post(':plantId/growth-stages')
  @ApiOperation({ summary: 'Create a new growth stage for a plant' })
  @ApiParam({
    name: 'plantId',
    description: 'ID of the plant',
    type: Number,
  })
  @ApiResponse({
    status: 201,
    description: 'The growth stage has been successfully created.',
    type: GrowthStageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant not found.' })
  createGrowthStage(
    @GetUser() user: JwtPayload,
    @Param('plantId', ParseIntPipe) plantId: number,
    @Body() createGrowthStageDto: CreateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    this.logger.log(
      `User ${user.sub} creating growth stage for plant ${plantId}`,
    );
    // Override plantId in DTO with the one from URL for safety
    createGrowthStageDto.plantId = plantId;
    return this.plantsService.createGrowthStage(createGrowthStageDto);
  }

  @Get(':plantId/growth-stages')
  @ApiOperation({ summary: 'Get all growth stages for a plant' })
  @ApiParam({
    name: 'plantId',
    description: 'ID of the plant',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of growth stages for the plant.',
    type: [GrowthStageDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant not found.' })
  findAllGrowthStagesByPlant(
    @Param('plantId', ParseIntPipe) plantId: number,
  ): Promise<GrowthStageDto[]> {
    return this.plantsService.findAllGrowthStagesByPlant(plantId);
  }

  @Get('growth-stages/:id')
  @ApiOperation({ summary: 'Get a specific growth stage by ID' })
  @ApiParam({
    name: 'id',
    description: 'ID of the growth stage',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Details of the growth stage.',
    type: GrowthStageDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Growth stage not found.' })
  findGrowthStage(
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GrowthStageDto> {
    return this.plantsService.findGrowthStage(id);
  }

  @Put('growth-stages/:id')
  @ApiOperation({ summary: 'Update a growth stage' })
  @ApiParam({
    name: 'id',
    description: 'ID of the growth stage to update',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'The growth stage has been successfully updated.',
    type: GrowthStageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Growth stage not found.' })
  updateGrowthStage(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGrowthStageDto: UpdateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    this.logger.log(`User ${user.sub} updating growth stage ${id}`);
    return this.plantsService.updateGrowthStage(id, updateGrowthStageDto);
  }

  @Delete('growth-stages/:id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a growth stage' })
  @ApiParam({
    name: 'id',
    description: 'ID of the growth stage to delete',
    type: Number,
  })
  @ApiResponse({
    status: 204,
    description: 'The growth stage has been successfully deleted.',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Growth stage not found.' })
  removeGrowthStage(
    @GetUser() user: JwtPayload,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<void> {
    this.logger.log(`User ${user.sub} deleting growth stage ${id}`);
    return this.plantsService.removeGrowthStage(id);
  }
}
