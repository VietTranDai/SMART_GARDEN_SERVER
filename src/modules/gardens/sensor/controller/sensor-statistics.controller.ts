import {
  Controller,
  Get,
  Param,
  Query,
  ParseIntPipe,
  UseGuards,
  Logger,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiQuery,
  ApiParam,
  ApiOperation,
  ApiTags,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { SensorStatisticsService } from '../service/sensor-statistics.service';
import { SensorStatisticsDto } from '../dto/sensor-statistics.dto';
import { SensorAnalyticsDto } from '../dto/sensor-analytics.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { JwtPayload } from '../../../auth/dto/jwt-payload.interface';

@Controller('sensor-statistics')
@ApiTags('Sensor Statistics')
@ApiBearerAuth()
export class SensorStatisticsController {
  private readonly logger = new Logger(SensorStatisticsController.name);

  constructor(private readonly statisticsService: SensorStatisticsService) {}

  @Get(':sensorId/statistics')
  @ApiOperation({ summary: 'Get statistics for a sensor within a date range' })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for statistics (ISO format)',
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for statistics (ISO format)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Sensor statistics returned successfully',
    type: SensorStatisticsDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid date format',
  })
  @ApiNotFoundResponse({ description: 'Sensor not found or no data in range' })
  async getStatistics(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('startDate') startDateStr: string,
    @Query('endDate') endDateStr: string,
  ): Promise<SensorStatisticsDto> {
    const startDate = new Date(startDateStr);
    const endDate = new Date(endDateStr);

    if (isNaN(startDate.getTime()) || isNaN(endDate.getTime())) {
      throw new BadRequestException('Invalid date format');
    }

    this.logger.log(
      `User ${userId} requesting statistics for sensor ${sensorId} from ${startDateStr} to ${endDateStr}`,
    );

    return this.statisticsService.calculateStatistics(
      userId,
      sensorId,
      startDate,
      endDate,
    );
  }

  @Get(':sensorId/analytics')
  @ApiOperation({
    summary: 'Get daily analytics for a sensor within a date range',
  })
  @ApiParam({ name: 'sensorId', description: 'Sensor ID', type: Number })
  @ApiQuery({
    name: 'startDate',
    description: 'Start date for analytics (YYYY-MM-DD)',
    required: true,
  })
  @ApiQuery({
    name: 'endDate',
    description: 'End date for analytics (YYYY-MM-DD)',
    required: true,
  })
  @ApiOkResponse({
    description: 'Sensor analytics returned successfully',
    type: SensorAnalyticsDto,
  })
  @ApiBadRequestResponse({
    description: 'Bad request - Invalid date format',
  })
  @ApiResponse({ status: 401, description: 'Unauthorized' })
  @ApiNotFoundResponse({
    description: 'Sensor not found or no data in range',
  })
  async getAnalytics(
    @GetUser('id') userId: number,
    @Param('sensorId', ParseIntPipe) sensorId: number,
    @Query('startDate') startDate: string,
    @Query('endDate') endDate: string,
  ): Promise<SensorAnalyticsDto> {
    // Date format validation will be handled in the service
    this.logger.log(
      `User ${userId} requesting analytics for sensor ${sensorId} from ${startDate} to ${endDate}`,
    );

    return this.statisticsService.generateAnalytics(
      userId,
      sensorId,
      startDate,
      endDate,
    );
  }
}
