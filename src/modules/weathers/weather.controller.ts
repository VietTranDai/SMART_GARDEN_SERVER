import {
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Logger,
  Post,
  HttpCode,
  HttpStatus,
  Query,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiParam,
  ApiBearerAuth,
  ApiQuery,
} from '@nestjs/swagger';
import { WeatherService } from './weather.service';
import { RefreshWeatherResponseDto } from './dto/refresh-weather-response.dto';
import {
  WeatherObservationDto,
  HourlyForecastDto,
  DailyForecastDto,
} from './dto/weather-response.dto';

@ApiTags('Weather')
@ApiBearerAuth() // Indicate JWT Bearer auth is expected (applied globally)
@Controller('api/weather')
export class WeatherController {
  private readonly logger = new Logger(WeatherController.name);

  constructor(
    private readonly weatherService: WeatherService,
    // Inject RedisService or similar if implementing rate limiting here
  ) {}

  @Get('garden/:gardenId/current')
  @ApiOperation({ summary: 'Get the latest weather observation for a garden' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved the current weather observation',
    type: WeatherObservationDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Garden not found or no weather data available',
  })
  async getCurrentWeather(@Param('gardenId', ParseIntPipe) gardenId: number) {
    this.logger.log(
      `Getting latest weather observation for garden ${gardenId}`,
    );
    return this.weatherService.getLatestWeatherObservation(gardenId);
  }

  @Get('garden/:gardenId/hourly')
  @ApiOperation({ summary: 'Get hourly weather forecasts for a garden' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved hourly weather forecasts',
    type: [HourlyForecastDto],
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  async getHourlyForecasts(@Param('gardenId', ParseIntPipe) gardenId: number) {
    this.logger.log(`Getting hourly forecasts for garden ${gardenId}`);
    return this.weatherService.getHourlyForecasts(gardenId);
  }

  @Get('garden/:gardenId/daily')
  @ApiOperation({ summary: 'Get daily weather forecasts for a garden' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved daily weather forecasts',
    type: [DailyForecastDto],
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  async getDailyForecasts(@Param('gardenId', ParseIntPipe) gardenId: number) {
    this.logger.log(`Getting daily forecasts for garden ${gardenId}`);
    return this.weatherService.getDailyForecasts(gardenId);
  }

  @Get('garden/:gardenId/history')
  @ApiOperation({
    summary: 'Get historical weather data for a garden with daily summaries',
  })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden',
    type: Number,
  })
  @ApiQuery({
    name: 'startDate',
    required: false,
    description:
      'Start date for historical data (YYYY-MM-DD). Defaults to 7 days ago.',
    type: String,
  })
  @ApiQuery({
    name: 'endDate',
    required: false,
    description:
      'End date for historical data (YYYY-MM-DD). Defaults to today.',
    type: String,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved historical weather data',
  })
  @ApiResponse({ status: 404, description: 'Garden not found' })
  @ApiResponse({ status: 400, description: 'Invalid date format' })
  async getWeatherHistory(
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('startDate') startDateStr?: string,
    @Query('endDate') endDateStr?: string,
  ) {
    // Default to last 7 days if no dates provided
    let startDate: Date;
    let endDate: Date;

    try {
      if (startDateStr) {
        startDate = new Date(startDateStr);
        // Check if date is valid
        if (isNaN(startDate.getTime())) {
          throw new BadRequestException(
            'Invalid startDate format. Use YYYY-MM-DD',
          );
        }
      } else {
        // Default to 7 days ago
        startDate = new Date();
        startDate.setDate(startDate.getDate() - 7);
      }

      if (endDateStr) {
        endDate = new Date(endDateStr);
        // Check if date is valid
        if (isNaN(endDate.getTime())) {
          throw new BadRequestException(
            'Invalid endDate format. Use YYYY-MM-DD',
          );
        }
      } else {
        // Default to today
        endDate = new Date();
      }

      // Set time to start/end of day
      startDate.setHours(0, 0, 0, 0);
      endDate.setHours(23, 59, 59, 999);

      // Validate date range
      if (startDate > endDate) {
        throw new BadRequestException('startDate must be before endDate');
      }

      // Limit to maximum 30 days range to prevent performance issues
      const dayDiff = Math.ceil(
        (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
      );
      if (dayDiff > 30) {
        throw new BadRequestException('Date range cannot exceed 30 days');
      }

      this.logger.log(
        `Getting weather history for garden ${gardenId} from ${startDate.toISOString()} to ${endDate.toISOString()}`,
      );
      return this.weatherService.getWeatherHistory(
        gardenId,
        startDate,
        endDate,
      );
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException(
        `Invalid date parameters: ${error.message}`,
      );
    }
  }

  @Post('refresh/:gardenId') // Changed to POST as it triggers an action/update
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Force refresh weather data for a specific garden' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden to refresh',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Weather data refresh initiated successfully.',
    type: RefreshWeatherResponseDto,
  }) // Use DTO for response type
  @ApiResponse({ status: 404, description: 'Garden not found.' })
  @ApiResponse({
    status: 409,
    description: 'Garden is inactive or missing coordinates.',
  })
  @ApiResponse({ status: 429, description: 'Rate limit exceeded.' }) // Need guard for this
  @ApiResponse({
    status: 500,
    description: 'Internal server error during refresh.',
  })
  // Example Rate Limiting Decorator (implementation needed)
  // @UseGuards(RateLimiterGuard)
  // @RateLimit({ keyPrefix: 'weather:refresh', limit: 1, ttl: 300 }) // 1 request per 5 minutes (300s)
  async refreshWeatherForGarden(
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<RefreshWeatherResponseDto> {
    // Return type is the DTO
    this.logger.log(
      `Received request to refresh weather for garden ${gardenId}`,
    );

    // --- Rate Limiting Logic Placeholder ---
    // If using Redis:
    // const key = `weather:refresh:${gardenId}`;
    // const count = await this.redisService.incr(key);
    // if (count === 1) {
    //   await this.redisService.expire(key, 300); // Set TTL only on first request in window
    // }
    // if (count > 1) { // Or check against a configured limit
    //   this.logger.warn(`Rate limit exceeded for garden ${gardenId}`);
    //   throw new HttpException('Rate limit exceeded. Please try again later.', HttpStatus.TOO_MANY_REQUESTS);
    // }
    // --- End Placeholder ---

    // Service will throw specific exceptions (NotFound, Conflict, InternalServer)
    // The return type matches RefreshWeatherResponseDto now
    const result =
      await this.weatherService.refreshWeatherForGardenById(gardenId);
    return result;
  }

  @Get('clear-cache/:gardenId')
  @ApiOperation({ summary: 'Clear the weather cache for a specific garden' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden to clear cache for',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Cache cleared successfully.',
  })
  @HttpCode(HttpStatus.OK)
  async clearGardenCache(@Param('gardenId', ParseIntPipe) gardenId: number) {
    this.logger.log(`Clearing weather cache for garden ${gardenId}`);
    this.weatherService.clearCache(gardenId);
    return { success: true, message: `Cache cleared for garden ${gardenId}` };
  }

  @Get('clear-all-cache')
  @ApiOperation({ summary: 'Clear the weather cache for all gardens' })
  @ApiResponse({
    status: 200,
    description: 'All cache cleared successfully.',
  })
  @HttpCode(HttpStatus.OK)
  async clearAllCache() {
    this.logger.log('Clearing all weather cache');
    this.weatherService.clearCache();
    return { success: true, message: 'All weather cache cleared' };
  }
}
