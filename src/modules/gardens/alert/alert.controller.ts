// src/modules/alerts/controller/alert.controller.ts
import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  HttpCode,
  HttpStatus, Body,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiResponse, ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { AlertStatus, AlertType } from '@prisma/client';
import { AlertDto } from './dto/alert.dto';
import { AlertService } from './alert.service';
import { UpdateAlertDto } from './dto/update-alert.dto';

@ApiTags('Alert')
@Controller('alerts')
@ApiBearerAuth()
export class AlertController {
  constructor(private readonly alertService: AlertService) {}

  @Get()
  @ApiOperation({ summary: 'Get all alerts của chính user' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiQuery({ name: 'type', required: false, enum: AlertType })
  @ApiResponse({ status: 200, type: AlertDto, isArray: true })
  async findAll(
    @GetUser('id') userId: number,
    @Query('status') status?: AlertStatus,
    @Query('type') type?: AlertType,
  ): Promise<AlertDto[]> {
    return this.alertService.findAllForUser(userId, { status, type });
  }

  @Get('garden/:gardenId')
  @ApiOperation({ summary: 'Get alerts by garden ID của chính user' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID' })
  @ApiQuery({ name: 'status', required: false, enum: AlertStatus })
  @ApiQuery({ name: 'type', required: false, enum: AlertType })
  @ApiResponse({ status: 200, type: AlertDto, isArray: true })
  async findByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('status') status?: AlertStatus,
    @Query('type') type?: AlertType,
  ): Promise<AlertDto[]> {
    return this.alertService.findByGardenForUser(userId, gardenId, { status, type });
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get alert by ID của chính user' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, type: AlertDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async findOne(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AlertDto> {
    return this.alertService.findOneForUser(userId, id);
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật alert (patch), chỉ của chính user' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, type: AlertDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  async update(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdateAlertDto,
  ): Promise<AlertDto> {
    return this.alertService.updateForUser(userId, id, dto);
  }

  @Post(':id/resolve')
  @ApiOperation({ summary: 'Đánh dấu alert là RESOLVED, chỉ của chính user' })
  @ApiParam({ name: 'id', description: 'Alert ID' })
  @ApiResponse({ status: 200, type: AlertDto })
  @ApiResponse({ status: 403, description: 'Forbidden' })
  @ApiResponse({ status: 404, description: 'Not found' })
  @HttpCode(HttpStatus.OK)
  async resolve(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<AlertDto> {
    return this.alertService.resolveForUser(userId, id);
  }
}
