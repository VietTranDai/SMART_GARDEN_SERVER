import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  HttpCode,
  HttpStatus,
  Query,
  ParseIntPipe,
  ForbiddenException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiCreatedResponse,
  ApiOkResponse,
  ApiNoContentResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiConflictResponse,
  ApiInternalServerErrorResponse,
} from '@nestjs/swagger';
import { GardenService } from '../service/garden.service';
import { CreateGardenDto } from '../dto/create-garden.dto';
import { UpdateGardenDto } from '../dto/update-garden.dto';
import { GardenDto } from '../dto/garden.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { GardenStatus, GardenType } from '@prisma/client';

@ApiTags('Garden')
@Controller('garden')
export class GardenController {
  constructor(private readonly gardenService: GardenService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new garden' })
  @ApiCreatedResponse({
    description: 'The garden has been successfully created.',
    type: GardenDto,
  })
  @ApiConflictResponse({
    description: 'A garden with this information already exists',
  })
  @ApiInternalServerErrorResponse({ description: 'Could not create garden' })
  async create(
    @GetUser('sub') userId: number,
    @Body() createGardenDto: CreateGardenDto,
  ) {
    return this.gardenService.create(userId, createGardenDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all garden belonging to the current user' })
  @ApiOkResponse({
    description: 'List of garden returned successfully',
    type: [GardenDto],
  })
  async findAll(@GetUser('sub') userId: number) {
    return this.gardenService.findAll(userId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a specific garden by ID' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Garden details returned successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to access this garden',
  })
  async findOne(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    const garden = await this.gardenService.findOne(id);

    // Verify ownership
    if (garden.gardenerId !== userId) {
      throw new ForbiddenException(
        'You do not have permission to access this garden',
      );
    }

    return garden;
  }

  @Get('key/:gardenKey')
  @ApiOperation({ summary: 'Get a specific garden by garden key' })
  @ApiParam({
    name: 'gardenKey',
    description: 'Garden unique key',
    type: String,
  })
  @ApiOkResponse({
    description: 'Garden details returned successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  async findByGardenKey(@Param('gardenKey') gardenKey: string) {
    return this.gardenService.findOneByGardenKey(gardenKey);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update a garden' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiOkResponse({
    description: 'Garden updated successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this garden',
  })
  async update(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateGardenDto: UpdateGardenDto,
  ) {
    return this.gardenService.update(userId, id, updateGardenDto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a garden' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiNoContentResponse({ description: 'Garden deleted successfully' })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to delete this garden',
  })
  async remove(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ) {
    await this.gardenService.remove(userId, id);
  }

  @Patch(':id/status')
  @ApiOperation({ summary: 'Update garden status (active/inactive)' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiQuery({
    name: 'status',
    enum: GardenStatus,
    description: 'New garden status',
  })
  @ApiOkResponse({
    description: 'Garden status updated successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this garden',
  })
  async updateStatus(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('status') status: GardenStatus,
  ) {
    return this.gardenService.updateGardenStatus(userId, id, status);
  }

  @Patch(':id/plant')
  @ApiOperation({ summary: 'Update plant information for a garden' })
  @ApiParam({ name: 'id', description: 'Garden ID', type: Number })
  @ApiQuery({
    name: 'plantName',
    description: 'Name of the plant',
    required: true,
  })
  @ApiQuery({
    name: 'plantGrowStage',
    description: 'Current growth stage of the plant',
    required: false,
  })
  @ApiOkResponse({
    description: 'Plant information updated successfully',
    type: GardenDto,
  })
  @ApiNotFoundResponse({ description: 'Garden not found' })
  @ApiForbiddenResponse({
    description: 'You do not have permission to update this garden',
  })
  async updatePlantInfo(
    @GetUser('sub') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Query('plantName') plantName: string,
    @Query('plantGrowStage') plantGrowStage?: string,
  ) {
    return this.gardenService.updatePlantInfo(
      userId,
      id,
      plantName,
      plantGrowStage,
    );
  }
}
