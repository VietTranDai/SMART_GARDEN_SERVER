import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  Delete,
  HttpCode,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { WateringScheduleService } from '../service/watering-schedule.service';
import { GetUser } from '../../../../common/decorators/get-user.decorator';
import { CreateWateringScheduleDto } from '../dto/watering-schedule.dto';
import { WateringScheduleDto, mapToWateringScheduleDto } from '../dto/watering-schedule.dto';

@ApiTags('WateringSchedule')
@Controller('watering-schedules')
@ApiBearerAuth()
export class WateringScheduleController {
  constructor(private readonly wateringService: WateringScheduleService) {}

  @Get()
  @ApiOperation({ summary: 'Get all watering schedules of current user' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getAll(@GetUser('id') userId: number, @Query() query: any): Promise<WateringScheduleDto[]> {
    const result = await this.wateringService.getAll(userId, query);
    return result.map(mapToWateringScheduleDto);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get watering schedule detail' })
  @ApiParam({ name: 'id' })
  async getOne(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number): Promise<WateringScheduleDto> {
    const result = await this.wateringService.getById(userId, id);
    return mapToWateringScheduleDto(result);
  }

  @Post(':id/complete')
  @ApiOperation({ summary: 'Mark schedule as completed' })
  async complete(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number): Promise<WateringScheduleDto> {
    const result = await this.wateringService.complete(userId, id);
    return mapToWateringScheduleDto(result);
  }

  @Post(':id/skip')
  @ApiOperation({ summary: 'Mark schedule as skipped' })
  async skip(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number): Promise<WateringScheduleDto> {
    const result = await this.wateringService.skip(userId, id);
    return mapToWateringScheduleDto(result);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete watering schedule' })
  @HttpCode(204)
  async delete(@GetUser('id') userId: number, @Param('id', ParseIntPipe) id: number): Promise<void> {
     await this.wateringService.delete(userId, id);
  }

  @Get('gardens/:gardenId')
  @ApiOperation({ summary: 'Get watering schedules by garden' })
  @ApiParam({ name: 'gardenId' })
  @ApiQuery({ name: 'status', required: false })
  @ApiQuery({ name: 'startDate', required: false })
  @ApiQuery({ name: 'endDate', required: false })
  async getByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query() query: any,
  ): Promise<WateringScheduleDto[]> {
    const result = await this.wateringService.getByGarden(userId, gardenId, query);
    return result.map(mapToWateringScheduleDto);
  }

  @Post('gardens/:gardenId')
  @ApiOperation({ summary: 'Create watering schedule for garden' })
  async create(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: CreateWateringScheduleDto,
  ): Promise<WateringScheduleDto> {
    try {
      const result = await this.wateringService.create(userId, gardenId, dto);
      return mapToWateringScheduleDto(result);
    } catch (error) {
      console.log(error);
      throw new BadRequestException(error.message);
    }
  }

  @Post('gardens/:gardenId/auto')
  @ApiOperation({ summary: 'Auto generate watering schedule for garden' })
  async autoGenerate(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<WateringScheduleDto> {
    const result = await this.wateringService.autoGenerate(userId, gardenId);
    return mapToWateringScheduleDto(result);
  }
}