// src/controller/activity.controller.ts
import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';
import { GardenActivityDto } from './dto/dto/garden-activity.dto';
import { CreateActivityDto } from './dto/dto/create-activity.dto';
import { ActivityEvaluationDto } from './dto/dto/activity-evaluation.dto';
import { CreateEvaluationDto } from './dto/dto/create-evaluation.dto';
import { GardenActivityService } from './garden-activity.service';
import { GetUser } from '../../../common/decorators/get-user.decorator';

@ApiTags('Activity')
@Controller('activities/me')
@ApiBearerAuth()
export class GardenActivityController {
  constructor(private readonly activityService: GardenActivityService) {}

  @Get()
  @ApiOperation({ summary: 'Get all garden activities của chính user' })
  @ApiQuery({ name: 'type', required: false, enum: ActivityType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, type: GardenActivityDto, isArray: true })
  async findAll(
    @GetUser('id') userId: number,
    @Query('type') type?: ActivityType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<GardenActivityDto[]> {
    return this.activityService.findAllForUser(userId, { type, startDate, endDate });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get a garden activity by ID (chỉ của chính user)' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 200, type: GardenActivityDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<GardenActivityDto> {
    return this.activityService.findOneForUser(userId, id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a new garden activity (gắn với chính user)' })
  @ApiResponse({ status: 201, type: GardenActivityDto })
  @HttpCode(HttpStatus.CREATED)
  async create(
    @GetUser('id') userId: number,
    @Body() dto: CreateActivityDto,
  ): Promise<GardenActivityDto> {
    return this.activityService.createForUser(userId, dto);
  }

  @Post(':id/evaluate')
  @ApiOperation({ summary: 'Evaluate a garden activity (chỉ của chính user)' })
  @ApiParam({ name: 'id', description: 'Activity ID' })
  @ApiResponse({ status: 201, type: ActivityEvaluationDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Activity not found' })
  @HttpCode(HttpStatus.CREATED)
  async evaluate(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CreateEvaluationDto,
  ): Promise<ActivityEvaluationDto> {
    return this.activityService.evaluateForUser(userId, id, dto);
  }

  @Get('gardens/:gardenId')
  @ApiOperation({ summary: 'Get activities by garden ID (chỉ gardens của chính user)' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID' })
  @ApiQuery({ name: 'type', required: false, enum: ActivityType })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, type: GardenActivityDto, isArray: true })
  async findByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('type') type?: ActivityType,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<GardenActivityDto[]> {
    return this.activityService.findByGardenForUser(userId, gardenId, { type, startDate, endDate });
  }
}
