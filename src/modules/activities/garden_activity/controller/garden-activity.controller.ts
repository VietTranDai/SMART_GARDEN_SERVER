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
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { ActivityType } from '@prisma/client';

import { GardenActivityService } from '../service/garden-activity.service';
import { GardenActivityAnalyticsService } from '../service/garden-activity-analytics.service';
import { ActivityStatsService } from '../service/activity-stats.service';
import { GetUser } from '../../../../common/decorators/get-user.decorator';

import {
  GardenActivityDto,
} from '../dto/garden-activity.dto';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { GetGardenActivitiesQueryDto } from '../dto/garden-activity-query.dto';
import { PaginatedGardenActivitiesResultDto } from '../dto/pagination.dto';
import { GardenActivityAnalyticsDto } from '../dto/garden-activity-analytics.dto';
import {
  ActivityStatsQueryDto,
  ActivityStatsResponseDto,
} from '../dto/activity-stats.dto';

@ApiTags('Garden Activities')
@Controller('activities')
@ApiBearerAuth()
export class GardenActivityController {
  constructor(
    private readonly activityService: GardenActivityService,
    private readonly analyticsService: GardenActivityAnalyticsService,
    private readonly statsService: ActivityStatsService,
  ) {}

  @Get()
  @ApiOperation({
    summary:
      'Lấy danh sách các hoạt động vườn của người dùng (có phân trang và bộ lọc)',
  })
  @ApiQuery({
    name: 'gardenId',
    required: false,
    type: Number,
    description: 'Lọc theo ID khu vườn',
  })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: ActivityType,
    description: 'Lọc theo loại hoạt động',
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    type: String,
    description: 'Lọc từ ngày (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    type: String,
    description: 'Lọc đến ngày (ISO 8601)',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    description: 'Số trang',
    default: 1,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    type: Number,
    description: 'Số mục trên trang',
    default: 10,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    type: PaginatedGardenActivitiesResultDto,
    description: 'Danh sách hoạt động vườn.',
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  async getMyActivities(
    @GetUser('id') userId: number,
    @Query() queryDto: GetGardenActivitiesQueryDto,
  ): Promise<PaginatedGardenActivitiesResultDto> {
    return this.activityService.findAllForUser(userId, queryDto);
  }

  @Post()
  @ApiOperation({
    summary: 'Tạo một hoạt động vườn mới cho người dùng hiện tại',
  })
  @ApiResponse({
    status: 201,
    type: GardenActivityDto,
    description: 'Hoạt động đã được tạo thành công.',
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy khu vườn được chỉ định.',
  })
  @HttpCode(HttpStatus.CREATED)
  async createActivity(
    @GetUser('id') userId: number,
    @Body() dto: CreateActivityDto,
  ): Promise<GardenActivityDto> {
    return this.activityService.createForUser(userId, dto);
  }

  @Get('stats')
  @ApiOperation({
    summary: 'Lấy thống kê hoạt động vườn của người dùng',
  })
  @ApiQuery({
    name: 'gardenId',
    required: false,
    type: Number,
    description: 'Lọc theo ID khu vườn',
  })
  @ApiQuery({
    name: 'activityType',
    required: false,
    enum: ActivityType,
    description: 'Lọc theo loại hoạt động',
  })
  @ApiQuery({
    name: 'startDate',
    required: true,
    type: String,
    description: 'Ngày bắt đầu thống kê (ISO 8601)',
  })
  @ApiQuery({
    name: 'endDate',
    required: true,
    type: String,
    description: 'Ngày kết thúc thống kê (ISO 8601)',
  })
  @ApiResponse({
    status: 200,
    type: ActivityStatsResponseDto,
    description: 'Thống kê hoạt động vườn.',
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  async getActivityStats(
    @GetUser('id') userId: number,
    @Query() queryDto: ActivityStatsQueryDto,
  ): Promise<ActivityStatsResponseDto> {
    return this.statsService.getActivityStats(userId, queryDto);
  }

  @Get(':activityId')
  @ApiOperation({ summary: 'Lấy chi tiết một hoạt động vườn theo ID' })
  @ApiParam({
    name: 'activityId',
    description: 'ID của Hoạt động Vườn',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    type: GardenActivityDto,
    description: 'Chi tiết hoạt động vườn.',
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập hoạt động này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hoạt động.' })
  async getActivityById(
    @GetUser('id') userId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ): Promise<GardenActivityDto> {
    return this.activityService.findOneForUser(userId, activityId);
  }

  @Get(':activityId/analysis')
  @ApiOperation({ summary: 'Lấy phân tích chi tiết cho một hoạt động vườn' })
  @ApiParam({
    name: 'activityId',
    type: Number,
    description: 'ID của hoạt động cần phân tích chi tiết',
  })
  @ApiResponse({
    status: 200,
    type: GardenActivityAnalyticsDto,
    description: 'Kết quả phân tích chi tiết hoạt động.',
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập hoặc phân tích hoạt động này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy hoạt động.' })
  async getActivityDetailedAnalysis(
    @GetUser('id') userId: number,
    @Param('activityId', ParseIntPipe) activityId: number,
  ): Promise<GardenActivityAnalyticsDto> {
    return this.analyticsService.getActivityAnalytics(activityId, userId);
  }
}
