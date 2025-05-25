import { Controller, Get, Param, ParseIntPipe, Logger } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';
import { GardenAdviceService } from './garden-advice.service';
import { WeatherAdviceService } from './weather-advice.service';
import { AdviceActionDto } from './dto/advice-action.dto';
import { GardenAdviceResponseDto } from './dto/garden-advice-response.dto';

@ApiTags('Advice')
@Controller('advice')
export class AdviceController {
  private readonly logger = new Logger(AdviceController.name);

  constructor(
    private readonly gardenAdviceService: GardenAdviceService,
    private readonly weatherAdviceService: WeatherAdviceService,
    // private readonly weatherService: WeatherService, // Ensure this is removed
  ) {}

  @Get('garden/:gardenId')
  @ApiOperation({
    summary: 'Get garden care advice based on sensor data and forecasts',
  })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden to get advice for',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved sensor-based garden advice',
    type: [AdviceActionDto],
  })
  @ApiResponse({
    status: 404,
    description:
      'Garden not found or essential data missing (plant name, growth stage)',
  })
  async getSensorBasedAdvice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<AdviceActionDto[]> {
    this.logger.log(`Getting sensor-based advice for garden ${gardenId}`);
    return this.gardenAdviceService.getAdvice(gardenId);
  }

  @Get('weather/garden/:gardenId')
  @ApiOperation({ summary: 'Get garden care advice based on current weather' })
  @ApiParam({
    name: 'gardenId',
    required: true,
    description: 'ID of the garden',
    type: Number,
  })
  @ApiResponse({
    status: 200,
    description: 'Successfully retrieved weather-based garden advice',
    type: GardenAdviceResponseDto,
  })
  @ApiResponse({
    status: 404,
    description: 'Garden not found or no weather data available',
  })
  async getWeatherBasedGardenAdvice(
    @Param('gardenId', ParseIntPipe) gardenId: number,
  ): Promise<GardenAdviceResponseDto> {
    this.logger.log(`Getting weather-based advice for garden ${gardenId}`);
    const adviceArray =
      await this.weatherAdviceService.getWeatherBasedAdvice(gardenId);

    const weather =
      await this.weatherAdviceService.getLatestWeatherObservation(gardenId);
    const gardenInfo = await this.weatherAdviceService.getGardenType(gardenId);

    return {
      gardenId,
      gardenType: gardenInfo.type || 'Unknown',
      currentWeather: weather.weatherMain.toString(),
      currentTemp: weather.temp,
      advice: adviceArray,
    };
  }
}
