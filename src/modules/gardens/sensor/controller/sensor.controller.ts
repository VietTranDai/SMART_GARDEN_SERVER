import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiOperation,
  ApiResponse,
  ApiTags,
  ApiBody,
  ApiParam,
  ApiQuery,
} from '@nestjs/swagger';
import { SensorService } from '../service/sensor.service';
import { RegisterSensorDto } from '../dto/register-sensor.dto';
import { UpdateSensorDto } from '../dto/update-sensor.dto';
import { CreateSensorDataDto } from '../dto/create-sensor-data.dto';
import {
  SensorDataDto,
  SensorDto,
  LatestSensorDataDto,
} from '../dto/sensor-data.dto';
import {
  BulkSensorDataDto,
  BulkSensorDataResponseDto,
} from '../dto/bulk-sensor-data.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { Public } from 'src/modules/auth/decorators/public.decorators';

interface JwtPayload {
  sub: number;
  email: string;
  iat?: number;
  exp?: number;
}

@Controller('sensor')
@ApiTags('Sensor')
export class SensorController {
  private readonly logger = new Logger(SensorController.name);

  constructor(private readonly sensorService: SensorService) {}

  @Post('register')
  @ApiOperation({ summary: 'Register a new sensor for a garden' })
  @ApiResponse({
    status: 201,
    description: 'Sensor registered successfully',
    type: SensorDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden',
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  async registerSensor(
    @GetUser() user: JwtPayload,
    @Body() registerSensorDto: RegisterSensorDto,
  ) {
    this.logger.log(
      `User ${user.sub} registering a new sensor for garden ${registerSensorDto.gardenId}`,
    );
    return this.sensorService.registerSensor(user.sub, registerSensorDto);
  }

  @Put(':sensorId')
  @ApiOperation({ summary: 'Update a sensor' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiBody({ type: UpdateSensorDto })
  @ApiResponse({
    status: 200,
    description: 'Sensor updated successfully',
    type: SensorDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden with this sensor',
  })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async updateSensor(
    @GetUser() user: JwtPayload,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Body() updateSensorDto: UpdateSensorDto,
  ) {
    this.logger.log(`User ${user.sub} updating sensor ${sensorId}`);
    return this.sensorService.updateSensor(user.sub, sensorId, updateSensorDto);
  }

  @Post('data')
  @Public()
  @ApiOperation({ summary: 'Submit sensor data (from IoT devices)' })
  @ApiBody({ type: CreateSensorDataDto })
  @ApiResponse({
    status: 201,
    description: 'Sensor data recorded successfully',
    type: SensorDataDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async createSensorData(@Body() createSensorDataDto: CreateSensorDataDto) {
    this.logger.debug(
      `Receiving data from sensor: ${createSensorDataDto.sensorKey}`,
    );
    return this.sensorService.createSensorData(createSensorDataDto);
  }

  @Post('data/bulk')
  @Public()
  @ApiOperation({
    summary: 'Submit multiple sensor readings in bulk (from IoT devices)',
  })
  @ApiBody({ type: BulkSensorDataDto })
  @ApiResponse({
    status: 201,
    description: 'Sensor data recorded successfully',
    type: BulkSensorDataResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 404, description: 'Garden or sensor not found' })
  async createBulkSensorData(
    @Body() bulkSensorDataDto: BulkSensorDataDto,
  ): Promise<BulkSensorDataResponseDto> {
    this.logger.debug(
      `Receiving bulk data for ${bulkSensorDataDto.readings.length} sensor readings, garden key: ${
        bulkSensorDataDto.gardenKey || 'not provided'
      }`,
    );

    const results = await this.sensorService.createBulkSensorData(
      bulkSensorDataDto.readings,
      bulkSensorDataDto.gardenKey,
    );

    return {
      ...results,
      processedAt: new Date(),
    };
  }

  @Get('garden/:gardenId')
  @ApiOperation({ summary: 'Get all sensor for a garden' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of sensor',
    type: [SensorDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden',
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  async getSensorByGarden(
    @GetUser() user: JwtPayload,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ) {
    return this.sensorService.getSensorByGarden(user.sub, gardenId);
  }

  @Get(':sensorId')
  @ApiOperation({ summary: 'Get sensor by ID' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiResponse({ status: 200, description: 'Sensor details', type: SensorDto })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden with this sensor',
  })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async getSensorById(
    @GetUser() user: JwtPayload,
    @Param('sensorId', ParseIntPipe) sensorId: number,
  ) {
    return this.sensorService.getSensorById(user.sub, sensorId);
  }

  @Get(':sensorId/data')
  @ApiOperation({ summary: 'Get sensor data history' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiQuery({
    name: 'limit',
    required: false,
    description: 'Max number of records to return',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description: 'Start date for filtering (ISO format)',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description: 'End date for filtering (ISO format)',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Sensor data history',
    type: [SensorDataDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden with this sensor',
  })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async getSensorDataHistory(
    @GetUser() user: JwtPayload,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('limit') limit?: string,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    let parsedLimit: number | undefined;
    let startDateObj: Date | undefined;
    let endDateObj: Date | undefined;

    if (limit) {
      parsedLimit = parseInt(limit, 10);
      if (isNaN(parsedLimit) || parsedLimit <= 0) {
        throw new BadRequestException('Limit must be a positive number');
      }
    }

    if (startDate) {
      startDateObj = new Date(startDate);
      if (isNaN(startDateObj.getTime())) {
        throw new BadRequestException('Invalid start date format');
      }
    }

    if (endDate) {
      endDateObj = new Date(endDate);
      if (isNaN(endDateObj.getTime())) {
        throw new BadRequestException('Invalid end date format');
      }
    }

    return this.sensorService.getSensorDataHistory(
      user.sub,
      sensorId,
      parsedLimit,
      startDateObj,
      endDateObj,
    );
  }

  @Get('garden/:gardenId/latest')
  @ApiOperation({
    summary: 'Get the latest data point for each sensor in a garden',
  })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Latest data for each sensor',
    type: [LatestSensorDataDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden',
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  async getLatestSensorData(
    @GetUser() user: JwtPayload,
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ) {
    return this.sensorService.getLatestSensorData(user.sub, gardenId);
  }

  @Delete(':sensorId')
  @ApiOperation({ summary: 'Delete a sensor' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiResponse({ status: 204, description: 'Sensor deleted successfully' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description: 'Forbidden - User does not own the garden with this sensor',
  })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async deleteSensor(
    @GetUser() user: JwtPayload,
    @Param('sensorId', ParseIntPipe) sensorId: number,
  ) {
    this.logger.log(`User ${user.sub} deleting sensor ${sensorId}`);
    await this.sensorService.deleteSensor(user.sub, sensorId);
  }
}
