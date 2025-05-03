import { ApiProperty } from '@nestjs/swagger';
import { WeatherMain } from '@prisma/client';

export class WeatherObservationDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 123 })
  gardenId: number;

  @ApiProperty({ example: '2023-10-31T15:30:00Z' })
  observedAt: Date;

  @ApiProperty({ example: 22.5 })
  temp: number;

  @ApiProperty({ example: 23.1 })
  feelsLike: number;

  @ApiProperty({ example: 15.2 })
  dewPoint: number;

  @ApiProperty({ example: 1013 })
  pressure: number;

  @ApiProperty({ example: 76 })
  humidity: number;

  @ApiProperty({ example: 40 })
  clouds: number;

  @ApiProperty({ example: 10000 })
  visibility: number;

  @ApiProperty({ example: 4.2 })
  uvi: number;

  @ApiProperty({ example: 3.5 })
  windSpeed: number;

  @ApiProperty({ example: 180 })
  windDeg: number;

  @ApiProperty({ example: 5.1, required: false })
  windGust: number | null;

  @ApiProperty({ example: 0.5, required: false })
  rain1h: number | null;

  @ApiProperty({ example: 0, required: false })
  snow1h: number | null;

  @ApiProperty({ example: 'CLOUDS', enum: WeatherMain })
  weatherMain: WeatherMain;

  @ApiProperty({ example: 'scattered clouds' })
  weatherDesc: string;

  @ApiProperty({ example: '03d' })
  iconCode: string;
}

export class HourlyForecastDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 123 })
  gardenId: number;

  @ApiProperty({ example: '2023-10-31T16:00:00Z' })
  forecastFor: Date;

  @ApiProperty({ example: '2023-10-31T15:30:00Z' })
  forecastedAt: Date;

  @ApiProperty({ example: 21.5 })
  temp: number;

  @ApiProperty({ example: 22.1 })
  feelsLike: number;

  @ApiProperty({ example: 14.8 })
  dewPoint: number;

  @ApiProperty({ example: 1012 })
  pressure: number;

  @ApiProperty({ example: 78 })
  humidity: number;

  @ApiProperty({ example: 60 })
  clouds: number;

  @ApiProperty({ example: 9000 })
  visibility: number;

  @ApiProperty({ example: 3.8 })
  uvi: number;

  @ApiProperty({ example: 0.3 })
  pop: number;

  @ApiProperty({ example: 4.2 })
  windSpeed: number;

  @ApiProperty({ example: 190 })
  windDeg: number;

  @ApiProperty({ example: 6.0, required: false })
  windGust: number | null;

  @ApiProperty({ example: 0.7, required: false })
  rain1h: number | null;

  @ApiProperty({ example: 0, required: false })
  snow1h: number | null;

  @ApiProperty({ example: 'RAIN', enum: WeatherMain })
  weatherMain: WeatherMain;

  @ApiProperty({ example: 'light rain' })
  weatherDesc: string;

  @ApiProperty({ example: '10d' })
  iconCode: string;
}

export class DailyForecastDto {
  @ApiProperty({ example: 1 })
  id: number;

  @ApiProperty({ example: 123 })
  gardenId: number;

  @ApiProperty({ example: '2023-11-01T00:00:00Z' })
  forecastFor: Date;

  @ApiProperty({ example: '2023-10-31T15:30:00Z' })
  forecastedAt: Date;

  @ApiProperty({ example: 24.0 })
  tempDay: number;

  @ApiProperty({ example: 18.5 })
  tempMin: number;

  @ApiProperty({ example: 27.3 })
  tempMax: number;

  @ApiProperty({ example: 19.2 })
  tempNight: number;

  @ApiProperty({ example: 25.1 })
  feelsLikeDay: number;

  @ApiProperty({ example: 16.2 })
  dewPoint: number;

  @ApiProperty({ example: 1010 })
  pressure: number;

  @ApiProperty({ example: 70 })
  humidity: number;

  @ApiProperty({ example: 30 })
  clouds: number;

  @ApiProperty({ example: 7.5 })
  uvi: number;

  @ApiProperty({ example: 0.2 })
  pop: number;

  @ApiProperty({ example: 3.0 })
  windSpeed: number;

  @ApiProperty({ example: 170 })
  windDeg: number;

  @ApiProperty({ example: 4.5, required: false })
  windGust: number | null;

  @ApiProperty({ example: 2.1, required: false })
  rain: number | null;

  @ApiProperty({ example: 0, required: false })
  snow: number | null;

  @ApiProperty({ example: 'CLEAR', enum: WeatherMain })
  weatherMain: WeatherMain;

  @ApiProperty({ example: 'clear sky' })
  weatherDesc: string;

  @ApiProperty({ example: '01d' })
  iconCode: string;
}
