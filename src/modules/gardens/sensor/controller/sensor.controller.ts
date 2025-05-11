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
  Put,
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
  ApiBody,
  getSchemaPath,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import {
  SensorDataDto,
  mapToSensorDataDto,
  mapToSensorDataDtoList,
} from '../dto/sensor-data.dto';

import {
  CreateSensorDto,
  mapToSensorDto,
  mapToSensorDtoList,
  SensorDto,
  UpdateSensorDto,
} from '../dto/sensor.dto';
import { SensorService } from '../service/sensor.service';
import {
  SensorDataQueryParamsDto,
  GardenSensorDataQueryParamsDto,
} from '../dto/sensor-data-query.dto';
import { SensorDataExtendedDto } from '../dto/sensor-data-extended.dto';
import { SensorDisplayUtil } from '../util/sensor-display.util';
import { PrismaService } from '../../../../prisma/prisma.service';

@ApiTags('Sensor')
@Controller('sensors')
@ApiBearerAuth()
export class SensorController {
  private readonly logger = new Logger(SensorController.name);

  constructor(
    private readonly sensorService: SensorService,
    private readonly prisma: PrismaService,
  ) {}

  @Get('gardens/:gardenId')
  @ApiOperation({ summary: 'List sensors by garden' })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor list', type: [SensorDto] })
  async listByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<SensorDto[]> {
    this.logger.log(`User ${userId} listing sensors for garden ${gardenId}`);
    // Get sensors and their latest readings in one call
    const sensorsWithReadings =
      await this.sensorService.getLatestReadingsByGarden(userId, gardenId);

    // Convert to map for easier lookup by sensor id
    const readingsMap = new Map();
    sensorsWithReadings.forEach((item) => {
      if (item.latestReading) {
        readingsMap.set(item.sensor.id, item.latestReading);
      }
    });

    return mapToSensorDtoList(
      sensorsWithReadings.map((item) => item.sensor),
      readingsMap,
    );
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

    // Get latest reading for this sensor
    const latestReading = await this.prisma.sensorData.findFirst({
      where: { sensorId: sensor.id },
      orderBy: { timestamp: 'desc' },
    });

    return mapToSensorDto(sensor, latestReading);
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

    // For a newly created sensor, there's no reading yet
    return mapToSensorDto(sensor, null);
  }

  @Put(':sensorId')
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
    const sensor = await this.sensorService.updateSensor(userId, sensorId, dto);

    // Get latest reading for this sensor
    const latestReading = await this.prisma.sensorData.findFirst({
      where: { sensorId: sensor.id },
      orderBy: { timestamp: 'desc' },
    });

    return mapToSensorDto(sensor, latestReading);
  }

  @Patch(':sensorId')
  @ApiOperation({ summary: 'Update a sensor (deprecated, use PUT instead)' })
  @ApiParam({ name: 'sensorId', type: Number })
  @ApiBody({ type: UpdateSensorDto })
  @ApiResponse({ status: 200, description: 'Sensor updated', type: SensorDto })
  async updatePatch(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Body() dto: UpdateSensorDto,
  ): Promise<SensorDto> {
    this.logger.log(`User ${userId} updating sensor ${sensorId} via PATCH`);
    const sensor = await this.sensorService.updateSensor(userId, sensorId, dto);

    // Get latest reading for this sensor
    const latestReading = await this.prisma.sensorData.findFirst({
      where: { sensorId: sensor.id },
      orderBy: { timestamp: 'desc' },
    });

    return mapToSensorDto(sensor, latestReading);
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
  @ApiResponse({
    status: 200,
    description: 'Sensor data list',
    type: [SensorDataDto],
  })
  async sensorData(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query() queryParams: SensorDataQueryParamsDto,
  ): Promise<SensorDataDto[]> {
    this.logger.log(`User ${userId} getting data for sensor ${sensorId}`);
    const data = await this.sensorService.getSensorDataHistory(
      userId,
      sensorId,
      queryParams.limit,
      queryParams.startDate ? new Date(queryParams.startDate) : undefined,
      queryParams.endDate ? new Date(queryParams.endDate) : undefined,
    );
    return mapToSensorDataDtoList(data);
  }

  @Get('gardens/:gardenId/data')
  @ApiOperation({
    summary: 'Get data across all sensors in a garden, grouped by sensor type',
  })
  @ApiParam({ name: 'gardenId', type: Number })
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
    @Query() queryParams: GardenSensorDataQueryParamsDto,
  ): Promise<Record<string, SensorDataDto[]>> {
    this.logger.log(`User ${userId} getting data for garden ${gardenId}`);
    const options = {
      limit: queryParams.limit,
      startDate: queryParams.startDate
        ? new Date(queryParams.startDate)
        : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      sensorType: queryParams.sensorType,
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

  @Get('gardens/:gardenId/data/display')
  @ApiOperation({
    summary: 'Get formatted data for all sensors in a garden for display',
  })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Garden sensor data formatted for display',
    schema: {
      type: 'object',
      additionalProperties: {
        type: 'array',
        items: { $ref: getSchemaPath(SensorDataExtendedDto) },
      },
    },
  })
  async gardenDisplayData(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query() queryParams: GardenSensorDataQueryParamsDto,
  ): Promise<Record<string, SensorDataExtendedDto[]>> {
    this.logger.log(
      `User ${userId} getting display data for garden ${gardenId}`,
    );
    const options = {
      limit: queryParams.limit,
      startDate: queryParams.startDate
        ? new Date(queryParams.startDate)
        : undefined,
      endDate: queryParams.endDate ? new Date(queryParams.endDate) : undefined,
      sensorType: queryParams.sensorType,
    };

    // Get the base data
    const grouped = await this.sensorService.getGardenSensorData(
      userId,
      gardenId,
      options,
    );

    // Format for display using utility
    const formattedData = SensorDisplayUtil.formatSensorDataForDisplay(grouped);

    return formattedData;
  }

  @Get('gardens/:gardenId/latest')
  @ApiOperation({ summary: 'Get latest reading for all sensors in a garden' })
  @ApiParam({ name: 'gardenId', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of sensors with latest readings',
    type: [SensorDto],
  })
  async latestReadingsByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<SensorDto[]> {
    const data = await this.sensorService.getLatestReadingsByGarden(
      userId,
      gardenId,
    );

    // Chuyển về DTO
    return data.map((item) => mapToSensorDto(item.sensor, item.latestReading));
  }
}
