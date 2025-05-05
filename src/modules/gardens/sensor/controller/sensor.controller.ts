// src/modules/sensor/controller/sensor.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Patch,
  Query,
  HttpCode,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiQuery,
  ApiBody, getSchemaPath, ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  SensorDataDto,
  mapToSensorDataDtoList,
} from '../dto/sensor-data.dto';

import { CreateSensorDto, mapToSensorDto, mapToSensorDtoList, SensorDto, UpdateSensorDto } from '../dto/sensor.dto';
import { SensorService } from '../service/sensor.service';

@ApiTags('Sensor')
@Controller('sensors')
@ApiBearerAuth()
export class SensorController {
  private readonly logger = new Logger(SensorController.name);

  constructor(private readonly sensorService: SensorService) {}

  @Get('gardens/:gardenId')
  @ApiOperation({ summary: 'List sensors by garden' })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor list', type: [SensorDto] })
  async listByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<SensorDto[]> {
    this.logger.log(`User ${userId} listing sensors for garden ${gardenId}`);
    const sensors = await this.sensorService.getSensorByGarden(
      userId,
      gardenId,
    );
    return mapToSensorDtoList(sensors);
  }

  @Get(':sensorId')
  @ApiOperation({ summary: 'Get sensor detail' })
  @ApiParam({ name: 'sensorId', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor detail', type: SensorDto })
  async detail(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
  ): Promise<SensorDto> {
    this.logger.log(`User ${userId} getting sensor ${sensorId}`);
    const sensor = await this.sensorService.getSensorById(userId, sensorId);
    return mapToSensorDto(sensor);
  }

  @Post('gardens/:gardenId')
  @ApiOperation({ summary: 'Create a new sensor in a garden' })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiBody({ type: CreateSensorDto })
  @ApiResponse({ status: 201, description: 'Sensor created', type: SensorDto })
  async create(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: CreateSensorDto,
  ): Promise<SensorDto> {
    this.logger.log(`User ${userId} creating sensor in garden ${gardenId}`);
    const sensor = await this.sensorService.createSensor(userId, {
      ...dto,
      gardenId,
    });
    return mapToSensorDto(sensor);
  }

  @Patch(':sensorId')
  @ApiOperation({ summary: 'Update a sensor' })
  @ApiParam({ name: 'sensorId', type: Number })
  @ApiBody({ type: UpdateSensorDto })
  @ApiResponse({ status: 200, description: 'Sensor updated', type: SensorDto })
  async update(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Body() dto: UpdateSensorDto,
  ): Promise<SensorDto> {
    this.logger.log(`User ${userId} updating sensor ${sensorId}`);
    const sensor = await this.sensorService.updateSensor(
      userId,
      sensorId,
      dto,
    );
    return mapToSensorDto(sensor);
  }

  @Delete(':sensorId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a sensor' })
  @ApiParam({ name: 'sensorId', type: Number })
  @ApiResponse({ status: 204, description: 'Sensor deleted' })
  async remove(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
  ): Promise<void> {
    this.logger.log(`User ${userId} deleting sensor ${sensorId}`);
    await this.sensorService.deleteSensor(userId, sensorId);
  }

  @Get(':sensorId/data')
  @ApiOperation({ summary: 'Get data for a sensor' })
  @ApiParam({ name: 'sensorId', type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({ status: 200, description: 'Sensor data list', type: [SensorDataDto] })
  async sensorData(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<SensorDataDto[]> {
    // validation omitted for brevity
    return this.sensorService.getSensorDataHistory(
      userId,
      sensorId,
      limit ? parseInt(limit, 10) : undefined,
      startDate ? new Date(startDate) : undefined,
      endDate ? new Date(endDate) : undefined,
    );
  }

  @Get('gardens/:gardenId/data')
  @ApiOperation({ summary: 'Get data across all sensors in a garden, grouped by sensor type' })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({ name: 'startDate', required: false, type: String })
  @ApiQuery({ name: 'endDate', required: false, type: String })
  @ApiResponse({
    status: 200,
    description: 'Garden sensor data grouped by sensor type',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: getSchemaPath(SensorDataDto) },
      },
    },
  })
  async gardenData(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ): Promise<Record<string, SensorDataDto[]>> {
    const options = {
      limit: limit ? parseInt(limit, 10) : undefined,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
    };
    const grouped = await this.sensorService.getGardenSensorData(
      userId,
      gardenId,
      options,
    );
    const result: Record<string, SensorDataDto[]> = {};
    for (const [type, dataList] of Object.entries(grouped)) {
      result[type] = mapToSensorDataDtoList(dataList);
    }
    return result;
  }
}