import { WeatherObservation, HourlyForecast, DailyForecast } from '@prisma/client';

/**
 * API response for current weather endpoint (OpenWeatherMap /data/2.5/weather)
 */
export interface CurrentWeatherResponse {
  coord: { lon: number; lat: number };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  base: string;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
  };
  visibility: number;
  wind: { speed: number; deg: number; gust?: number };
  clouds: { all: number };
  rain?: { '1h': number };
  snow?: { '1h': number };
  dt: number;
  sys: { type?: number; id?: number; country: string; sunrise: number; sunset: number };
  timezone: number;
  id: number;
  name: string;
  cod: number;
}

/**
 * Single entry in hourly forecast API (/forecast/hourly)
 */
export interface HourlyForecastEntry {
  dt: number;
  main: {
    temp: number;
    feels_like: number;
    temp_min: number;
    temp_max: number;
    pressure: number;
    humidity: number;
    sea_level?: number;
    grnd_level?: number;
    temp_kf?: number;
  };
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  clouds: { all: number };
  wind: { speed: number; deg: number; gust?: number };
  visibility: number;
  pop: number;
  rain?: { '1h': number };
  snow?: { '1h': number };
  sys: { pod: 'd' | 'n' };
  dt_txt: string;
}

/**
 * API response for hourly forecast endpoint
 */
export interface HourlyForecastApiResponse {
  cod: string;
  message: number;
  cnt: number;
  list: HourlyForecastEntry[];
  city?: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * Single entry in daily forecast API (/forecast/daily)
 */
export interface DailyForecastEntry {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: { day: number; night: number; eve: number; morn: number };
  pressure: number;
  humidity: number;
  weather: Array<{ id: number; main: string; description: string; icon: string }>;
  speed: number;
  deg: number;
  gust?: number;
  clouds: number;
  pop: number;
  rain?: number;
}

/**
 * API response for daily forecast endpoint
 */
export interface DailyForecastApiResponse {
  cod: string;
  message: number;
  cnt: number;
  list: DailyForecastEntry[];
  city?: {
    id: number;
    name: string;
    coord: { lat: number; lon: number };
    country: string;
    population: number;
    timezone: number;
    sunrise: number;
    sunset: number;
  };
}

/**
 * In-memory cache entry
 */
export interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

/**
 * Structure for caching weather data in service
 */
export interface WeatherCache {
  observation: Record<number, CacheEntry<WeatherObservation>>;
  hourlyForecast: Record<number, CacheEntry<HourlyForecast[]>>;
  dailyForecast: Record<number, CacheEntry<DailyForecast[]>>;
}
