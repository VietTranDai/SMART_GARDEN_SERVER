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
import { GrowthStageDto } from '../dto/growth-stage.dto';
import { CreateGrowthStageDto } from '../dto/create-growth-stage.dto';
import { UpdateGrowthStageDto } from '../dto/update-growth-stage.dto';

// Define JwtPayload interface locally or import if shared
interface JwtPayload {
  sub: number;
  email: string;
}

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

  // GrowthStage endpoints
  @Post(':plantTypeId/growth-stages')
  @ApiOperation({ summary: 'Create a new growth stage for a plant type' })
  @ApiParam({
    name: 'plantTypeId',
    description: 'ID of the plant type',
    type: Number,
  })
  @ApiResponse({
    status: 201,
    description: 'The growth stage has been successfully created.',
    type: GrowthStageDto,
  })
  @ApiResponse({ status: 400, description: 'Bad Request.' })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant type not found.' })
  createGrowthStage(
    @GetUser() user: JwtPayload,
    @Param('plantTypeId', ParseIntPipe) plantTypeId: number,
    @Body() createGrowthStageDto: CreateGrowthStageDto,
  ): Promise<GrowthStageDto> {
    this.logger.log(
      `User ${user.sub} creating growth stage for plant type ${plantTypeId}`,
    );
    // Override plantTypeId in DTO with the one from URL for safety
    createGrowthStageDto.plantTypeId = plantTypeId;
    return this.plantsService.createGrowthStage(createGrowthStageDto);
  }

  @Get(':plantTypeId/growth-stages')
  @ApiOperation({ summary: 'Get all growth stages for a plant type' })
  @ApiParam({
    name: 'plantTypeId',
    description: 'ID of the plant type',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'List of growth stages for the plant type.',
    type: [GrowthStageDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized.' })
  @ApiResponse({ status: 404, description: 'Plant type not found.' })
  findAllGrowthStagesByPlantType(
    @Param('plantTypeId', ParseIntPipe) plantTypeId: number,
  ): Promise<GrowthStageDto[]> {
    return this.plantsService.findAllGrowthStagesByPlantType(plantTypeId);
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
