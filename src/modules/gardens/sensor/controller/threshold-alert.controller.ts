import {
  Controller,
  Get,
  Post,
  Put,
  Delete,
  Body,
  Param,
  ParseIntPipe,
  Logger,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiResponse,
  ApiParam,
} from '@nestjs/swagger';
import { ThresholdAlertService } from '../service/threshold-alert.service';
import {
  CreateThresholdAlertDto,
  ThresholdAlertDto,
  UpdateThresholdAlertDto,
} from '../dto/threshold-alert.dto';
import { GetUser } from 'src/modules/auth/decorators/get-user.decorator';
import { JwtPayload } from '../../../auth/dto/jwt-payload.interface';

@Controller('threshold-alerts')
@ApiTags('Threshold Alert')
export class ThresholdAlertController {
  private readonly logger = new Logger(ThresholdAlertController.name);

  constructor(private readonly alertService: ThresholdAlertService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new threshold alert' })
  @ApiBody({ type: CreateThresholdAlertDto })
  @ApiResponse({
    status: 201,
    description: 'Threshold alert created successfully',
    type: ThresholdAlertDto,
  })
  @ApiResponse({ status: 400, description: 'Bad request' })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({
    status: 403,
    description:
      'Forbidden - User does not have permission to access the sensor',
  })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async createAlert(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Body() createDto: CreateThresholdAlertDto,
  ): Promise<ThresholdAlertDto> {
    this.logger.log(
      `User ${user.sub} creating threshold alert for sensor ${createDto.sensorId}`,
    );
    return this.alertService.createAlert(user.sub, createDto);
  }

  @Get(':alertId')
  @ApiOperation({ summary: 'Get a threshold alert by ID' })
  @ApiParam({ name: 'alertId', description: 'Alert ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'Threshold alert details',
    type: ThresholdAlertDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async getAlertById(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Param('alertId', ParseIntPipe) alertId: number,
  ): Promise<ThresholdAlertDto> {
    return this.alertService.getAlertById(user.sub, alertId);
  }

  @Get('sensor/:sensorId')
  @ApiOperation({ summary: 'Get all threshold alerts for a specific sensor' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of threshold alerts',
    type: [ThresholdAlertDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Sensor not found' })
  async getAlertsBySensor(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Param('sensorId', ParseIntPipe) sensorId: number,
  ): Promise<ThresholdAlertDto[]> {
    return this.alertService.getAlertsBySensor(user.sub, sensorId);
  }

  @Get('garden/:gardenId')
  @ApiOperation({ summary: 'Get all threshold alerts for a specific garden' })
  @ApiParam({ name: 'gardenId', description: 'Garden ID', type: Number })
  @ApiResponse({
    status: 200,
    description: 'List of threshold alerts',
    type: [ThresholdAlertDto],
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  async getAlertsByGarden(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<ThresholdAlertDto[]> {
    return this.alertService.getAlertsByGarden(user.sub, gardenId);
  }

  @Put(':alertId')
  @ApiOperation({ summary: 'Update a threshold alert' })
  @ApiParam({ name: 'alertId', description: 'Alert ID', type: Number })
  @ApiBody({ type: UpdateThresholdAlertDto })
  @ApiResponse({
    status: 200,
    description: 'Threshold alert updated successfully',
    type: ThresholdAlertDto,
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async updateAlert(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Param('alertId', ParseIntPipe) alertId: number,
    @Body() updateDto: UpdateThresholdAlertDto,
  ): Promise<ThresholdAlertDto> {
    this.logger.log(`User ${user.sub} updating threshold alert ${alertId}`);
    return this.alertService.updateAlert(user.sub, alertId, updateDto);
  }

  @Delete(':alertId')
  @ApiOperation({ summary: 'Delete a threshold alert' })
  @ApiParam({ name: 'alertId', description: 'Alert ID', type: Number })
  @ApiResponse({
    status: 204, // Use 204 No Content for successful deletion
    description: 'Threshold alert deleted successfully',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiResponse({ status: 404, description: 'Alert not found' })
  async deleteAlert(
    @GetUser() user: JwtPayload, // Use GetUser decorator
    @Param('alertId', ParseIntPipe) alertId: number,
  ): Promise<void> {
    // Return void for 204 response
    this.logger.log(`User ${user.sub} deleting threshold alert ${alertId}`);
    await this.alertService.deleteAlert(user.sub, alertId);
    // No need to return a message body for 204
  }
}
