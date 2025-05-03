import {
  Injectable,
  Logger,
  InternalServerErrorException,
  NotFoundException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Garden,
  Prisma,
  WeatherMain,
  AlertType,
  AlertStatus,
  NotificationMethod,
} from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import pLimit from 'p-limit';
import {
  mapWeatherCodeToEnum,
  unixTimestampToDate,
} from './utils/weather-mapping.util';

// Define interfaces for OpenWeatherMap API responses
interface OWMCurrentWeather {
  dt: number;
  sunrise: number;
  sunset: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
}

interface OWMHourlyForecast {
  dt: number;
  temp: number;
  feels_like: number;
  pressure: number;
  humidity: number;
  dew_point: number;
  uvi: number;
  clouds: number;
  visibility: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  pop: number; // Probability of precipitation
  rain?: { '1h'?: number };
  snow?: { '1h'?: number };
}

interface OWMDailyForecast {
  dt: number;
  sunrise: number;
  sunset: number;
  moonrise: number;
  moonset: number;
  moon_phase: number;
  summary: string;
  temp: {
    day: number;
    min: number;
    max: number;
    night: number;
    eve: number;
    morn: number;
  };
  feels_like: {
    day: number;
    night: number;
    eve: number;
    morn: number;
  };
  pressure: number;
  humidity: number;
  dew_point: number;
  wind_speed: number;
  wind_deg: number;
  wind_gust?: number;
  weather: {
    id: number;
    main: string;
    description: string;
    icon: string;
  }[];
  clouds: number;
  pop: number;
  rain?: number;
  snow?: number;
  uvi: number;
}

interface OWMOneCallResponse {
  lat: number;
  lon: number;
  timezone: string;
  timezone_offset: number;
  current: OWMCurrentWeather;
  hourly: OWMHourlyForecast[];
  daily: OWMDailyForecast[];
  alerts?: any[];
}

// Cache interface
interface WeatherCache {
  observation: {
    [gardenId: number]: {
      data: any;
      timestamp: number;
    };
  };
  hourlyForecast: {
    [gardenId: number]: {
      data: any[];
      timestamp: number;
    };
  };
  dailyForecast: {
    [gardenId: number]: {
      data: any[];
      timestamp: number;
    };
  };
}

@Injectable()
export class WeatherService {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;
  private readonly apiBaseUrl =
    'https://api.openweathermap.org/data/3.0/onecall';
  private readonly fallbackApiUrl =
    'https://api.weatherapi.com/v1/forecast.json';
  private readonly fallbackApiKey: string;
  // Rate limiter for concurrent API calls
  private readonly limit = pLimit(10); // Limit to 10 concurrent API calls

  // In-memory cache
  private cache: WeatherCache = {
    observation: {},
    hourlyForecast: {},
    dailyForecast: {},
  };

  // Cache TTL in milliseconds
  private readonly observationCacheTTL = 15 * 60 * 1000; // 15 minutes
  private readonly hourlyForecastCacheTTL = 60 * 60 * 1000; // 1 hour
  private readonly dailyForecastCacheTTL = 6 * 60 * 60 * 1000; // 6 hours

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
    private readonly httpService: HttpService,
  ) {
    this.apiKey = this.configService.getOrThrow<string>('WEATHER_API_KEY');
    this.fallbackApiKey = this.configService.getOrThrow<string>(
      'FALLBACK_WEATHER_API_KEY',
    );

    if (!this.apiKey) {
      this.logger.error('WEATHER_API_KEY is not set in environment variables.');
      throw new Error('WEATHER_API_KEY is not configured.');
    }
  }

  /**
   * Fetches weather data from OpenWeatherMap One Call API.
   * Falls back to alternate weather API if primary fails.
   */
  private async fetchWeatherDataFromApi(
    lat: number,
    lon: number,
  ): Promise<OWMOneCallResponse | null> {
    const url = `${this.apiBaseUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&exclude=minutely`;

    // Simple retry mechanism
    let retries = 3;
    while (retries > 0) {
      try {
        this.logger.debug(`Fetching weather data for lat=${lat}, lon=${lon}`);
        const response = await firstValueFrom(
          this.httpService.get<OWMOneCallResponse>(url),
        );
        this.logger.debug(
          `Successfully fetched weather data for lat=${lat}, lon=${lon}`,
        );
        return response.data;
      } catch (error) {
        retries--;
        const axiosError = error as AxiosError;
        this.logger.error(
          `Error fetching weather data for lat=${lat}, lon=${lon}. Retries left: ${retries}. Status: ${axiosError.response?.status}. Error: ${axiosError.message}`,
          axiosError.stack,
        );

        if (
          retries === 0 ||
          (axiosError.response?.status &&
            axiosError.response.status < 500 &&
            axiosError.response.status !== 429)
        ) {
          // Don't retry client errors (except rate limit) or if retries exhausted
          this.logger.error(
            `Giving up fetching weather from primary API for lat=${lat}, lon=${lon} after multiple attempts.`,
          );

          // Try fallback API if configured
          if (this.fallbackApiKey) {
            this.logger.log(
              `Attempting to use fallback weather API for lat=${lat}, lon=${lon}`,
            );
            return await this.fetchWeatherFromFallbackApi(lat, lon);
          }

          return null;
        }

        // Wait before retrying (exponential backoff: 1s, 2s, 4s)
        const delay = Math.pow(2, 3 - retries - 1) * 1000;
        this.logger.warn(`Waiting ${delay}ms before retrying...`);
        await new Promise((resolve) => setTimeout(resolve, delay));
      }
    }
    return null;
  }

  /**
   * Fetches weather data from fallback API when primary API fails.
   */
  private async fetchWeatherFromFallbackApi(
    lat: number,
    lon: number,
  ): Promise<OWMOneCallResponse | null> {
    if (!this.fallbackApiKey) return null;

    try {
      const url = `${this.fallbackApiUrl}?key=${this.fallbackApiKey}&q=${lat},${lon}&days=7&aqi=no&alerts=yes`;
      const response = await firstValueFrom(this.httpService.get(url));

      // Transform fallback API response to match OWM format
      // This would need a detailed mapping implementation
      this.logger.log(
        `Successfully fetched data from fallback API for lat=${lat}, lon=${lon}`,
      );

      // NOTE: This is a placeholder - you'd need to implement the actual mapping
      // from the fallback API format to the OWMOneCallResponse format
      return null;
    } catch (error) {
      this.logger.error(
        `Fallback API also failed for lat=${lat}, lon=${lon}`,
        error,
      );
      return null;
    }
  }

  /**
   * Processes raw API data and prepares it for database storage.
   */
  private processWeatherData(
    gardenId: number,
    apiData: OWMOneCallResponse,
  ): {
    observation: Prisma.WeatherObservationCreateInput;
    hourlyForecasts: Prisma.HourlyForecastCreateInput[];
    dailyForecasts: Prisma.DailyForecastCreateInput[];
  } {
    const now = new Date(); // Timestamp for forecasts

    // Process Current Weather
    const current = apiData.current;
    const observation: Prisma.WeatherObservationCreateInput = {
      garden: { connect: { id: gardenId } },
      observedAt: unixTimestampToDate(current.dt) || new Date(),
      temp: current.temp,
      feelsLike: current.feels_like,
      dewPoint: current.dew_point,
      pressure: current.pressure,
      humidity: current.humidity,
      clouds: current.clouds,
      visibility: current.visibility,
      uvi: current.uvi,
      windSpeed: current.wind_speed,
      windDeg: current.wind_deg,
      windGust: current.wind_gust ?? null,
      rain1h: current.rain?.['1h'] ?? null,
      snow1h: current.snow?.['1h'] ?? null,
      weatherMain: mapWeatherCodeToEnum(current.weather[0]?.id),
      weatherDesc: current.weather[0]?.description ?? 'Unknown',
      iconCode: current.weather[0]?.icon ?? '01d', // Default clear day icon
    };

    // Process Hourly Forecasts
    const hourlyForecasts: Prisma.HourlyForecastCreateInput[] =
      apiData.hourly.map((hour) => ({
        garden: { connect: { id: gardenId } },
        forecastFor: unixTimestampToDate(hour.dt) || now,
        forecastedAt: now,
        temp: hour.temp,
        feelsLike: hour.feels_like,
        dewPoint: hour.dew_point,
        pressure: hour.pressure,
        humidity: hour.humidity,
        clouds: hour.clouds,
        visibility: hour.visibility,
        uvi: hour.uvi,
        pop: hour.pop,
        windSpeed: hour.wind_speed,
        windDeg: hour.wind_deg,
        windGust: hour.wind_gust ?? null,
        rain1h: hour.rain?.['1h'] ?? null,
        snow1h: hour.snow?.['1h'] ?? null,
        weatherMain: mapWeatherCodeToEnum(hour.weather[0]?.id),
        weatherDesc: hour.weather[0]?.description ?? 'Unknown',
        iconCode: hour.weather[0]?.icon ?? '01d',
      }));

    // Process Daily Forecasts
    const dailyForecasts: Prisma.DailyForecastCreateInput[] = apiData.daily.map(
      (day) => ({
        garden: { connect: { id: gardenId } },
        forecastFor: unixTimestampToDate(day.dt) || now,
        forecastedAt: now,
        tempDay: day.temp.day,
        tempMin: day.temp.min,
        tempMax: day.temp.max,
        tempNight: day.temp.night,
        feelsLikeDay: day.feels_like.day,
        dewPoint: day.dew_point,
        pressure: day.pressure,
        humidity: day.humidity,
        clouds: day.clouds,
        uvi: day.uvi,
        pop: day.pop,
        windSpeed: day.wind_speed,
        windDeg: day.wind_deg,
        windGust: day.wind_gust ?? null,
        rain: day.rain ?? null,
        snow: day.snow ?? null,
        weatherMain: mapWeatherCodeToEnum(day.weather[0]?.id),
        weatherDesc: day.weather[0]?.description ?? day.summary ?? 'Unknown',
        iconCode: day.weather[0]?.icon ?? '01d',
      }),
    );

    return { observation, hourlyForecasts, dailyForecasts };
  }

  /**
   * Saves weather data to the database using a transaction.
   */
  private async saveWeatherData(
    gardenId: number,
    processedData: {
      observation: Prisma.WeatherObservationCreateInput;
      hourlyForecasts: Prisma.HourlyForecastCreateInput[];
      dailyForecasts: Prisma.DailyForecastCreateInput[];
    },
  ): Promise<void> {
    const { observation, hourlyForecasts, dailyForecasts } = processedData;

    try {
      await this.prisma.$transaction(async (tx) => {
        // 1. Create new WeatherObservation
        await tx.weatherObservation.create({ data: observation });

        // 2. Upsert Hourly Forecasts
        for (const forecast of hourlyForecasts) {
          const forecastFor = forecast.forecastFor as Date;
          await tx.hourlyForecast.upsert({
            where: {
              gardenId_forecastFor: {
                gardenId,
                forecastFor,
              },
            },
            update: {
              temp: forecast.temp as number,
              feelsLike: forecast.feelsLike as number,
              dewPoint: forecast.dewPoint as number,
              pressure: forecast.pressure as number,
              humidity: forecast.humidity as number,
              clouds: forecast.clouds as number,
              visibility: forecast.visibility as number,
              uvi: forecast.uvi as number,
              pop: forecast.pop as number,
              windSpeed: forecast.windSpeed as number,
              windDeg: forecast.windDeg as number,
              windGust: forecast.windGust,
              rain1h: forecast.rain1h,
              snow1h: forecast.snow1h,
              weatherMain: forecast.weatherMain as WeatherMain,
              weatherDesc: forecast.weatherDesc as string,
              iconCode: forecast.iconCode as string,
              forecastedAt: forecast.forecastedAt as Date,
            },
            create: {
              gardenId,
              forecastFor,
              temp: forecast.temp as number,
              feelsLike: forecast.feelsLike as number,
              dewPoint: forecast.dewPoint as number,
              pressure: forecast.pressure as number,
              humidity: forecast.humidity as number,
              clouds: forecast.clouds as number,
              visibility: forecast.visibility as number,
              uvi: forecast.uvi as number,
              pop: forecast.pop as number,
              windSpeed: forecast.windSpeed as number,
              windDeg: forecast.windDeg as number,
              windGust: forecast.windGust,
              rain1h: forecast.rain1h,
              snow1h: forecast.snow1h,
              weatherMain: forecast.weatherMain as WeatherMain,
              weatherDesc: forecast.weatherDesc as string,
              iconCode: forecast.iconCode as string,
              forecastedAt: forecast.forecastedAt as Date,
            },
          });
        }

        // 3. Upsert Daily Forecasts
        for (const forecast of dailyForecasts) {
          const forecastFor = forecast.forecastFor as Date;
          await tx.dailyForecast.upsert({
            where: {
              gardenId_forecastFor: {
                gardenId,
                forecastFor,
              },
            },
            update: {
              tempDay: forecast.tempDay as number,
              tempMin: forecast.tempMin as number,
              tempMax: forecast.tempMax as number,
              tempNight: forecast.tempNight as number,
              feelsLikeDay: forecast.feelsLikeDay as number,
              dewPoint: forecast.dewPoint as number,
              pressure: forecast.pressure as number,
              humidity: forecast.humidity as number,
              clouds: forecast.clouds as number,
              uvi: forecast.uvi as number,
              pop: forecast.pop as number,
              windSpeed: forecast.windSpeed as number,
              windDeg: forecast.windDeg as number,
              windGust: forecast.windGust,
              rain: forecast.rain,
              snow: forecast.snow,
              weatherMain: forecast.weatherMain as WeatherMain,
              weatherDesc: forecast.weatherDesc as string,
              iconCode: forecast.iconCode as string,
              forecastedAt: forecast.forecastedAt as Date,
            },
            create: {
              gardenId,
              forecastFor,
              tempDay: forecast.tempDay as number,
              tempMin: forecast.tempMin as number,
              tempMax: forecast.tempMax as number,
              tempNight: forecast.tempNight as number,
              feelsLikeDay: forecast.feelsLikeDay as number,
              dewPoint: forecast.dewPoint as number,
              pressure: forecast.pressure as number,
              humidity: forecast.humidity as number,
              clouds: forecast.clouds as number,
              uvi: forecast.uvi as number,
              pop: forecast.pop as number,
              windSpeed: forecast.windSpeed as number,
              windDeg: forecast.windDeg as number,
              windGust: forecast.windGust,
              rain: forecast.rain,
              snow: forecast.snow,
              weatherMain: forecast.weatherMain as WeatherMain,
              weatherDesc: forecast.weatherDesc as string,
              iconCode: forecast.iconCode as string,
              forecastedAt: forecast.forecastedAt as Date,
            },
          });
        }
      });

      this.logger.log(`Successfully saved weather data for garden ${gardenId}`);
    } catch (error) {
      this.logger.error(
        `Error saving weather data for garden ${gardenId}:`,
        error,
      );
      throw new InternalServerErrorException(
        `Failed to save weather data for garden ${gardenId}`,
      );
    }
  }

  /**
   * Updates weather data for a single garden.
   */
  public async updateWeatherForGarden(garden: Garden): Promise<boolean> {
    if (!garden.lat || !garden.lng) {
      this.logger.warn(
        `Skipping garden ${garden.id} (${garden.name}) due to missing coordinates.`,
      );
      return false;
    }

    const apiData = await this.fetchWeatherDataFromApi(garden.lat, garden.lng);

    if (!apiData) {
      this.logger.error(
        `Failed to fetch weather data for garden ${garden.id} after retries.`,
      );
      await this.handleFailedUpdate(
        garden.id,
        'Failed to fetch data from API after retries.',
      );
      return false;
    }

    try {
      const processedData = this.processWeatherData(garden.id, apiData);
      await this.saveWeatherData(garden.id, processedData);
      return true;
    } catch (error) {
      this.logger.error(
        `Failed to process or save weather data for garden ${garden.id}:`,
        error,
      );
      await this.handleFailedUpdate(
        garden.id,
        `Error processing/saving data: ${error.message}`,
      );
      return false;
    }
  }

  /**
   * Updates weather data for all active gardens concurrently.
   */
  public async updateAllActiveGardens(): Promise<void> {
    this.logger.log(
      'Starting scheduled weather update for all active gardens...',
    );
    const gardens = await this.prisma.garden.findMany({
      where: {
        status: 'ACTIVE',
        lat: { not: null },
        lng: { not: null },
      },
    });

    if (gardens.length === 0) {
      this.logger.log(
        'No active gardens with coordinates found. Skipping weather update.',
      );
      return;
    }

    this.logger.log(
      `Found ${gardens.length} active gardens with coordinates. Processing...`,
    );

    const tasks = gardens.map((garden) =>
      this.limit(() => this.updateWeatherForGarden(garden)),
    );

    const results = await Promise.allSettled(tasks);

    let successCount = 0;
    let failureCount = 0;
    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value === true) {
        successCount++;
      } else {
        failureCount++;
        const gardenId = gardens[index].id;
        const reason =
          result.status === 'rejected'
            ? result.reason
            : 'Update function returned false';
        this.logger.error(
          `Failed to update weather for garden ${gardenId}: ${reason}`,
        );
      }
    });

    this.logger.log(
      `Finished weather update cycle. Success: ${successCount}, Failures: ${failureCount}`,
    );
  }

  /**
   * Handles failed weather update for a garden.
   */
  private async handleFailedUpdate(
    gardenId: number,
    errorMessage: string,
  ): Promise<void> {
    this.logger.error(
      `Persistent failure updating weather for garden ${gardenId}: ${errorMessage}`,
    );

    try {
      // Check if a similar pending alert already exists
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          gardenId: gardenId,
          type: AlertType.WEATHER,
          status: AlertStatus.PENDING,
          message: { contains: 'Không thể lấy dữ liệu thời tiết' },
        },
      });

      if (!existingAlert) {
        await this.prisma.alert.create({
          data: {
            garden: { connect: { id: gardenId } },
            type: AlertType.WEATHER,
            message: `Không thể lấy dữ liệu thời tiết cho khu vườn ${gardenId}. Lỗi: ${errorMessage.substring(0, 200)}`,
            suggestion:
              'Kiểm tra cài đặt API thời tiết, tọa độ khu vườn, và kết nối mạng. Liên hệ quản trị viên nếu sự cố kéo dài.',
            timestamp: new Date(),
            status: AlertStatus.PENDING,
            notificationMethod: NotificationMethod.EMAIL,
          },
        });
        this.logger.log(`Created WEATHER alert for garden ${gardenId}.`);
      } else {
        this.logger.log(
          `Pending WEATHER alert already exists for garden ${gardenId}. Skipping creation.`,
        );
      }
    } catch (alertError) {
      this.logger.error(
        `Failed to create WEATHER alert for garden ${gardenId}:`,
        alertError,
      );
    }
  }

  /**
   * Cleans up expired forecast data.
   */
  async cleanupExpiredForecasts(): Promise<{
    hourlyDeleted: number;
    dailyDeleted: number;
  }> {
    const now = new Date();
    this.logger.log(
      `Running cleanup for forecasts older than ${now.toISOString()}`,
    );

    try {
      const hourlyResult = await this.prisma.hourlyForecast.deleteMany({
        where: { forecastFor: { lt: now } },
      });

      const dailyResult = await this.prisma.dailyForecast.deleteMany({
        where: { forecastFor: { lt: new Date(now.setHours(0, 0, 0, 0)) } },
      });

      this.logger.log(
        `Deleted ${hourlyResult.count} expired hourly forecasts.`,
      );
      this.logger.log(`Deleted ${dailyResult.count} expired daily forecasts.`);
      return {
        hourlyDeleted: hourlyResult.count,
        dailyDeleted: dailyResult.count,
      };
    } catch (error) {
      this.logger.error('Error during forecast cleanup:', error);
      return { hourlyDeleted: 0, dailyDeleted: 0 };
    }
  }

  /**
   * Cleans up old weather observation data.
   */
  async cleanupOldObservations(monthsToKeep: number = 6): Promise<number> {
    const cutoffDate = new Date();
    cutoffDate.setMonth(cutoffDate.getMonth() - monthsToKeep);
    this.logger.log(
      `Running cleanup for observations older than ${cutoffDate.toISOString()} (${monthsToKeep} months)`,
    );

    try {
      const result = await this.prisma.weatherObservation.deleteMany({
        where: { observedAt: { lt: cutoffDate } },
      });
      this.logger.log(`Deleted ${result.count} old weather observations.`);
      return result.count;
    } catch (error) {
      this.logger.error('Error during observation cleanup:', error);
      return 0;
    }
  }

  /**
   * Force refresh weather data for a specific garden.
   */
  async refreshWeatherForGardenById(
    gardenId: number,
  ): Promise<{ success: boolean; message?: string; lastUpdated?: Date }> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    if (garden.status !== 'ACTIVE') {
      throw new ConflictException(`Garden ${gardenId} is not ACTIVE.`);
    }

    if (!garden.lat || !garden.lng) {
      throw new ConflictException(
        `Garden ${gardenId} does not have valid coordinates.`,
      );
    }

    // Clear cache for this garden
    this.clearCache(gardenId);

    const success = await this.updateWeatherForGarden(garden);

    if (success) {
      return { success: true, lastUpdated: new Date() };
    } else {
      throw new InternalServerErrorException(
        `Failed to refresh weather data for garden ${gardenId}. Check logs for details.`,
      );
    }
  }

  /**
   * Gets the latest weather observation for a garden.
   * Uses cache if available and not expired.
   */
  async getLatestWeatherObservation(gardenId: number) {
    // Check cache first
    const cachedData = this.cache.observation[gardenId];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < this.observationCacheTTL) {
      this.logger.debug(
        `Using cached weather observation for garden ${gardenId}`,
      );
      return cachedData.data;
    }

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    const observation = await this.prisma.weatherObservation.findFirst({
      where: { gardenId },
      orderBy: { observedAt: 'desc' },
    });

    if (!observation) {
      throw new NotFoundException(
        `No weather observations found for garden ${gardenId}.`,
      );
    }

    // Update cache
    this.cache.observation[gardenId] = {
      data: observation,
      timestamp: now,
    };

    return observation;
  }

  /**
   * Gets hourly forecasts for a garden.
   * Uses cache if available and not expired.
   */
  async getHourlyForecasts(gardenId: number) {
    // Check cache first
    const cachedData = this.cache.hourlyForecast[gardenId];
    const now = Date.now();

    if (
      cachedData &&
      now - cachedData.timestamp < this.hourlyForecastCacheTTL
    ) {
      this.logger.debug(`Using cached hourly forecasts for garden ${gardenId}`);
      return cachedData.data;
    }

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    const currentTime = new Date();
    const forecasts = await this.prisma.hourlyForecast.findMany({
      where: {
        gardenId,
        forecastFor: { gte: currentTime },
      },
      orderBy: { forecastFor: 'asc' },
    });

    // Update cache
    this.cache.hourlyForecast[gardenId] = {
      data: forecasts,
      timestamp: now,
    };

    return forecasts;
  }

  /**
   * Gets daily forecasts for a garden.
   * Uses cache if available and not expired.
   */
  async getDailyForecasts(gardenId: number) {
    // Check cache first
    const cachedData = this.cache.dailyForecast[gardenId];
    const now = Date.now();

    if (cachedData && now - cachedData.timestamp < this.dailyForecastCacheTTL) {
      this.logger.debug(`Using cached daily forecasts for garden ${gardenId}`);
      return cachedData.data;
    }

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const forecasts = await this.prisma.dailyForecast.findMany({
      where: {
        gardenId,
        forecastFor: { gte: today },
      },
      orderBy: { forecastFor: 'asc' },
    });

    // Update cache
    this.cache.dailyForecast[gardenId] = {
      data: forecasts,
      timestamp: now,
    };

    return forecasts;
  }

  /**
   * Clear cache for a specific garden or all gardens
   */
  clearCache(gardenId?: number) {
    if (gardenId) {
      // Clear cache for specific garden
      delete this.cache.observation[gardenId];
      delete this.cache.hourlyForecast[gardenId];
      delete this.cache.dailyForecast[gardenId];
      this.logger.debug(`Cleared weather cache for garden ${gardenId}`);
    } else {
      // Clear all cache
      this.cache = {
        observation: {},
        hourlyForecast: {},
        dailyForecast: {},
      };
      this.logger.debug('Cleared all weather cache');
    }
  }

  /**
   * Get historical weather data by day for a garden
   */
  async getWeatherHistory(gardenId: number, startDate: Date, endDate: Date) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    // Get weather observations within date range
    const observations = await this.prisma.weatherObservation.findMany({
      where: {
        gardenId,
        observedAt: {
          gte: startDate,
          lte: endDate,
        },
      },
      orderBy: { observedAt: 'asc' },
    });

    // Group by day
    const dailyWeatherMap = new Map();

    observations.forEach((obs) => {
      // Get date part only, without time
      const dateKey = obs.observedAt.toISOString().split('T')[0];

      if (!dailyWeatherMap.has(dateKey)) {
        dailyWeatherMap.set(dateKey, {
          date: dateKey,
          observations: [],
          summary: {
            minTemp: Infinity,
            maxTemp: -Infinity,
            avgTemp: 0,
            minHumidity: Infinity,
            maxHumidity: -Infinity,
            avgHumidity: 0,
            dominantWeather: null,
            weatherCounts: {},
          },
        });
      }

      const dayData = dailyWeatherMap.get(dateKey);
      dayData.observations.push(obs);

      // Update summary stats
      const summary = dayData.summary;
      summary.minTemp = Math.min(summary.minTemp, obs.temp);
      summary.maxTemp = Math.max(summary.maxTemp, obs.temp);
      summary.minHumidity = Math.min(summary.minHumidity, obs.humidity);
      summary.maxHumidity = Math.max(summary.maxHumidity, obs.humidity);

      // Track weather types
      const weatherType = obs.weatherMain.toString();
      summary.weatherCounts[weatherType] =
        (summary.weatherCounts[weatherType] || 0) + 1;
    });

    // Calculate averages and dominant weather
    const result: any[] = [];
    dailyWeatherMap.forEach((dayData) => {
      const obs = dayData.observations;
      const summary = dayData.summary;

      if (obs.length > 0) {
        // Calculate averages
        summary.avgTemp = obs.reduce((sum, o) => sum + o.temp, 0) / obs.length;
        summary.avgHumidity =
          obs.reduce((sum, o) => sum + o.humidity, 0) / obs.length;

        // Find dominant weather
        let maxCount = 0;
        let dominantWeather: string | null = null;

        Object.entries(summary.weatherCounts).forEach(
          ([weather, count]: [string, number]) => {
            if (count > maxCount) {
              maxCount = count;
              dominantWeather = weather;
            }
          },
        );

        summary.dominantWeather = dominantWeather;
      }

      // Don't include all observations in the result
      delete dayData.observations;
      result.push(dayData as any);
    });

    return result;
  }
}
