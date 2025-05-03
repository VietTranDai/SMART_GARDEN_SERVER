import {
  Controller,
  Get,
  Post,
  Body,
  Param,
  Delete,
  Put,
  ParseIntPipe,
  UseGuards,
} from '@nestjs/common';
import { ExperienceLevelService } from '../service/experience-level.service';

import {
  ApiBearerAuth,
  ApiOperation,
  ApiResponse,
  ApiTags,
} from '@nestjs/swagger';
import { ExperienceLevelDto } from '../dto/experience-level.dto';
import { CreateExperienceLevelDto } from '../dto/create-experience-level.dto';
import { UpdateExperienceLevelDto } from '../dto/update-experience-level.dto';

@ApiTags('experience-levels')
@Controller('experience-levels')
export class ExperienceLevelController {
  constructor(
    private readonly experienceLevelService: ExperienceLevelService,
  ) {}

  @Post()
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Create a new experience level' })
  @ApiResponse({
    status: 201,
    description: 'The experience level has been successfully created.',
    type: ExperienceLevelDto,
  })
  create(
    @Body() createExperienceLevelDto: CreateExperienceLevelDto,
  ): Promise<ExperienceLevelDto> {
    return this.experienceLevelService.create(createExperienceLevelDto);
  }

  @Get()
  @ApiOperation({ summary: 'Get all experience levels' })
  @ApiResponse({
    status: 200,
    description: 'Return all experience levels',
    type: [ExperienceLevelDto],
  })
  findAll(): Promise<ExperienceLevelDto[]> {
    return this.experienceLevelService.findAll();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get experience level by id' })
  @ApiResponse({
    status: 200,
    description: 'Return the experience level with the given id',
    type: ExperienceLevelDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Experience level not found',
  })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ExperienceLevelDto> {
    return this.experienceLevelService.findOne(id);
  }

  @Put(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Update an experience level' })
  @ApiResponse({
    status: 200,
    description: 'The experience level has been successfully updated.',
    type: ExperienceLevelDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Experience level not found',
  })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateExperienceLevelDto: UpdateExperienceLevelDto,
  ): Promise<ExperienceLevelDto> {
    return this.experienceLevelService.update(id, updateExperienceLevelDto);
  }

  @Delete(':id')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Delete an experience level' })
  @ApiResponse({
    status: 200,
    description: 'The experience level has been successfully deleted.',
  })
  @ApiResponse({
    status: 404,
    description: 'Experience level not found',
  })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.experienceLevelService.remove(id);
  }

  @Get('calculate/:xp')
  @ApiOperation({ summary: 'Calculate experience level from XP' })
  @ApiResponse({
    status: 200,
    description: 'Return the experience level for the given XP',
    type: ExperienceLevelDto,
  })
  calculateLevel(
    @Param('xp', ParseIntPipe) xp: number,
  ): Promise<ExperienceLevelDto> {
    return this.experienceLevelService.calculateLevel(xp);
  }

  @Get('next/:currentXP')
  @ApiOperation({ summary: 'Get next experience level from current XP' })
  @ApiResponse({
    status: 200,
    description: 'Return the next experience level',
    type: ExperienceLevelDto,
  })
  getNextLevel(
    @Param('currentXP', ParseIntPipe) currentXP: number,
  ): Promise<ExperienceLevelDto | null> {
    return this.experienceLevelService.findNextLevel(currentXP);
  }
}
