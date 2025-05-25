import { ApiProperty } from '@nestjs/swagger';
import { WeatherAdviceDto } from './weather-advice.dto';

/**
 * Response DTO for garden weather advice
 */
export class GardenAdviceResponseDto {
  @ApiProperty({ description: 'Garden ID' })
  gardenId: number;

  @ApiProperty({ description: 'Garden type' })
  gardenType: string;

  @ApiProperty({ description: 'Current weather main condition' })
  currentWeather: string;

  @ApiProperty({ description: 'Current temperature in Celsius' })
  currentTemp: number;

  @ApiProperty({
    description: 'List of weather-based advice sorted by priority',
    type: [WeatherAdviceDto],
  })
  advice: WeatherAdviceDto[];
}
