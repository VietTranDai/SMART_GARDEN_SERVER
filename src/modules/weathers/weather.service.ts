import {
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  OnModuleInit,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { HttpService } from '@nestjs/axios';
import { PrismaService } from '../../prisma/prisma.service';
import {
  Garden,
  Prisma,
  AlertType,
  AlertStatus,
  WeatherMain,
  WeatherObservation,
  HourlyForecast,
  DailyForecast,
} from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { mapWeatherCodeToEnum } from './utils/weather-mapping.util';
import {
  CurrentWeatherResponse,
  HourlyForecastApiResponse,
  DailyForecastApiResponse,
  CacheEntry as GenericCacheEntry,
} from './dto/interface';

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

interface WeatherServiceCache {
  observation: Record<number, CacheEntry<WeatherObservation>>;
  hourlyForecast: Record<number, GenericCacheEntry<HourlyForecast[]>>;
  dailyForecast: Record<number, GenericCacheEntry<DailyForecast[]>>;
}

// Define types for batch operations (without Prisma connect objects)
interface HourlyForecastBatch {
  gardenId: number;
  forecastFor: Date;
  forecastedAt: Date;
  temp: number;
  feelsLike: number;
  pressure: number;
  humidity: number;
  clouds: number;
  visibility: number;
  pop: number;
  windSpeed: number;
  windDeg: number;
  windGust: number | null;
  rain1h: number | null;
  snow1h: number | null;
  weatherMain: WeatherMain;
  weatherDesc: string;
  iconCode: string;
}

interface DailyForecastBatch {
  gardenId: number;
  forecastFor: Date;
  forecastedAt: Date;
  tempDay: number;
  tempMin: number;
  tempMax: number;
  tempNight: number;
  feelsLikeDay: number;
  pressure: number;
  humidity: number;
  clouds: number;
  pop: number;
  windSpeed: number;
  windDeg: number;
  windGust: number | null;
  rain: number | null;
  weatherMain: WeatherMain;
  weatherDesc: string;
  iconCode: string;
}

@Injectable()
export class WeatherService implements OnModuleInit {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;

  private readonly currentUrl =
    'https://api.openweathermap.org/data/2.5/weather';
  private readonly hourlyUrl =
    'https://pro.openweathermap.org/data/2.5/forecast/hourly';
  private readonly dailyUrl =
    'https://api.openweathermap.org/data/2.5/forecast/daily';

  private cache: WeatherServiceCache = {
    observation: {},
    hourlyForecast: {},
    dailyForecast: {},
  };
  private readonly ttl = {
    observation: 15 * 60_000,
    hourly: 60 * 60_000,
    daily: 6 * 60 * 60_000,
  };

  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService,
    private readonly http: HttpService,
  ) {
    this.apiKey = this.config.getOrThrow<string>('WEATHER_API_KEY');
  }

  /** Run initial update */
  async onModuleInit() {
    this.updateAllActiveGardens().catch((e) =>
      this.logger.error('Initial update failed', e),
    );
  }

  /** Generic fetch with retries */
  private async fetchWithRetries<T>(url: string): Promise<T> {
    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const resp = await firstValueFrom(this.http.get<T>(url));
        return resp.data;
      } catch (e) {
        const err = e as AxiosError;
        if (
          attempt === 3 ||
          (err.response?.status != null &&
            err.response.status < 500 &&
            err.response.status !== 429)
        ) {
          throw err;
        }
        const delay = 1000 * 2 ** (attempt - 1);
        this.logger.warn(
          `Fetch ${url} attempt ${attempt} failed, retrying in ${delay}ms`,
        );
        await new Promise((res) => setTimeout(res, delay));
      }
    }
    throw new Error('Unreachable fetch logic');
  }

  /** Fetch current weather */
  private async fetchCurrent(
    lat: number,
    lon: number,
  ): Promise<CurrentWeatherResponse> {
    const url = `${this.currentUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&units=metric&lang=vi`;
    return this.fetchWithRetries<CurrentWeatherResponse>(url);
  }

  /** Fetch hourly forecast */
  private async fetchHourly(
    lat: number,
    lon: number,
    cnt = 48,
  ): Promise<HourlyForecastApiResponse> {
    const url = `${this.hourlyUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&cnt=${cnt}&units=metric&lang=vi`;
    return this.fetchWithRetries<HourlyForecastApiResponse>(url);
  }

  /** Fetch daily forecast */
  private async fetchDaily(
    lat: number,
    lon: number,
    cnt = 7,
  ): Promise<DailyForecastApiResponse> {
    const url = `${this.dailyUrl}?lat=${lat}&lon=${lon}&appid=${this.apiKey}&cnt=${cnt}&units=metric&lang=vi`;
    return this.fetchWithRetries<DailyForecastApiResponse>(url);
  }

  /** Transform API data into Prisma inputs */
  private processCurrent(
    garden: Garden,
    resp: CurrentWeatherResponse,
  ): Prisma.WeatherObservationCreateInput {
    return {
      garden: { connect: { id: garden.id } },
      observedAt: new Date(),
      temp: resp.main.temp,
      feelsLike: resp.main.feels_like,
      pressure: resp.main.pressure,
      humidity: resp.main.humidity,
      clouds: resp.clouds.all,
      visibility: resp.visibility,
      windSpeed: resp.wind.speed,
      windDeg: resp.wind.deg,
      windGust: resp.wind.gust ?? null,
      rain1h: resp.rain?.['1h'] ?? null,
      snow1h: resp.snow?.['1h'] ?? null,
      weatherMain: mapWeatherCodeToEnum(resp.weather[0].id),
      weatherDesc: resp.weather[0].description,
      iconCode: resp.weather[0].icon,
    };
  }

  private processHourlyBatch(
    garden: Garden,
    list: HourlyForecastApiResponse['list'],
  ): HourlyForecastBatch[] {
    const now = new Date();
    return list.map((h) => ({
      gardenId: garden.id,
      forecastFor: new Date(h.dt * 1000),
      forecastedAt: now,
      temp: h.main.temp,
      feelsLike: h.main.feels_like,
      pressure: h.main.pressure,
      humidity: h.main.humidity,
      clouds: h.clouds.all,
      visibility: h.visibility,
      pop: h.pop,
      windSpeed: h.wind.speed,
      windDeg: h.wind.deg,
      windGust: h.wind.gust ?? null,
      rain1h: h.rain?.['1h'] ?? null,
      snow1h: h.snow?.['1h'] ?? null,
      weatherMain: mapWeatherCodeToEnum(h.weather[0].id),
      weatherDesc: h.weather[0].description,
      iconCode: h.weather[0].icon,
    }));
  }

  private processDailyBatch(
    garden: Garden,
    list: DailyForecastApiResponse['list'],
  ): DailyForecastBatch[] {
    const now = new Date();
    return list.map((d) => ({
      gardenId: garden.id,
      forecastFor: new Date(d.dt * 1000),
      forecastedAt: now,
      tempDay: d.temp.day,
      tempMin: d.temp.min,
      tempMax: d.temp.max,
      tempNight: d.temp.night,
      feelsLikeDay: d.feels_like.day,
      pressure: d.pressure,
      humidity: d.humidity,
      clouds: d.clouds,
      pop: d.pop,
      windSpeed: d.speed,
      windDeg: d.deg,
      windGust: d.gust ?? null,
      rain: d.rain ?? null,
      weatherMain: mapWeatherCodeToEnum(d.weather[0].id),
      weatherDesc: d.weather[0].description,
      iconCode: d.weather[0].icon,
    }));
  }

  // Keep original methods for backward compatibility (if needed elsewhere)
  private processHourly(
    garden: Garden,
    list: HourlyForecastApiResponse['list'],
  ): Prisma.HourlyForecastCreateInput[] {
    const now = new Date();
    return list.map((h) => ({
      garden: { connect: { id: garden.id } },
      forecastFor: new Date(h.dt * 1000),
      forecastedAt: now,
      temp: h.main.temp,
      feelsLike: h.main.feels_like,
      pressure: h.main.pressure,
      humidity: h.main.humidity,
      clouds: h.clouds.all,
      visibility: h.visibility,
      pop: h.pop,
      windSpeed: h.wind.speed,
      windDeg: h.wind.deg,
      windGust: h.wind.gust ?? null,
      rain1h: h.rain?.['1h'] ?? null,
      snow1h: h.snow?.['1h'] ?? null,
      weatherMain: mapWeatherCodeToEnum(h.weather[0].id),
      weatherDesc: h.weather[0].description,
      iconCode: h.weather[0].icon,
    }));
  }

  private processDaily(
    garden: Garden,
    list: DailyForecastApiResponse['list'],
  ): Prisma.DailyForecastCreateInput[] {
    const now = new Date();
    return list.map((d) => ({
      garden: { connect: { id: garden.id } },
      forecastFor: new Date(d.dt * 1000),
      forecastedAt: now,
      tempDay: d.temp.day,
      tempMin: d.temp.min,
      tempMax: d.temp.max,
      tempNight: d.temp.night,
      feelsLikeDay: d.feels_like.day,
      pressure: d.pressure,
      humidity: d.humidity,
      clouds: d.clouds,
      pop: d.pop,
      windSpeed: d.speed,
      windDeg: d.deg,
      windGust: d.gust ?? null,
      rain: d.rain ?? null,
      weatherMain: mapWeatherCodeToEnum(d.weather[0].id),
      weatherDesc: d.weather[0].description,
      iconCode: d.weather[0].icon,
    }));
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
        `Failed to refresh weather data for garden ${gardenId}. Check logs for details.,`,
      );
    }
  }

  /**
   * Update weather for one garden using efficient batch operations.
   * Returns true on success, false otherwise.
   */
  public async updateWeatherForGarden(garden: Garden): Promise<boolean> {
    if (!garden.lat || !garden.lng) return false;
    
    const startTime = Date.now();
    this.logger.debug(`Starting weather update for garden ${garden.id}`);
    
    try {
      // Fetch all weather data in parallel
      const [current, hourly, daily] = await Promise.all([
        this.fetchCurrent(garden.lat, garden.lng),
        this.fetchHourly(garden.lat, garden.lng),
        this.fetchDaily(garden.lat, garden.lng),
      ]);

      // Process all data for batch operations
      const obs = this.processCurrent(garden, current);
      const hf = this.processHourlyBatch(garden, hourly.list);
      const df = this.processDailyBatch(garden, daily.list);

      this.logger.debug(
        `Garden ${garden.id}: Processing ${hf.length} hourly + ${df.length} daily forecasts using batch operations`,
      );

      // Execute efficient batch transaction
      await this.prisma.$transaction(async (tx) => {
        // Create weather observation first
        await tx.weatherObservation.create({ data: obs });
        
        // Delete existing forecasts for the same time periods
        const hourlyForecastTimes = hf.map(entry => entry.forecastFor);
        const dailyForecastTimes = df.map(entry => entry.forecastFor);

        // Batch delete existing forecasts
        await Promise.all([
          tx.hourlyForecast.deleteMany({
            where: {
              gardenId: garden.id,
              forecastFor: { in: hourlyForecastTimes },
            },
          }),
          tx.dailyForecast.deleteMany({
            where: {
              gardenId: garden.id,
              forecastFor: { in: dailyForecastTimes },
            },
          }),
        ]);

        // Batch create new forecasts - much more efficient than individual upserts
        await Promise.all([
          tx.hourlyForecast.createMany({ 
            data: hf,
            skipDuplicates: true, // Extra safety
          }),
          tx.dailyForecast.createMany({ 
            data: df,
            skipDuplicates: true, // Extra safety
          }),
        ]);
      }, {
        timeout: 30000, // Increase timeout to 30 seconds for safety
        maxWait: 35000, // Maximum wait time
      });

      const duration = Date.now() - startTime;
      this.logger.debug(
        `Garden ${garden.id} weather update completed successfully in ${duration}ms using batch operations`,
      );

      return true;
    } catch (error) {
      const duration = Date.now() - startTime;
      this.logger.error(
        `Garden ${garden.id} update failed after ${duration}ms`,
        error,
      );
      await this.handleFailure(garden.id, (error as Error).message);
      return false;
    }
  }

  /** Schedule update for all active gardens */
  public async updateAllActiveGardens(): Promise<void> {
    this.logger.log('Starting weather update for all ACTIVE gardens');
    const startTime = Date.now();
    
    const gardens = await this.prisma.garden.findMany({
      where: { status: 'ACTIVE', lat: { not: null }, lng: { not: null } },
    });

    this.logger.log(`Found ${gardens.length} active gardens to update`);

    const results = await Promise.allSettled(
      gardens.map((g) => this.updateWeatherForGarden(g)),
    );

    const success = results.filter(
      (r) => r.status === 'fulfilled' && (r as any).value === true,
    ).length;
    const failed = results.length - success;
    const duration = Date.now() - startTime;
    
    this.logger.log(
      `Weather update completed in ${duration}ms — Success: ${success}, Failed: ${failed}`,
    );

    // Log failed gardens for debugging
    if (failed > 0) {
      const failedIndexes = results
        .map((r, i) => (r.status === 'rejected' || !(r as any).value ? i : -1))
        .filter(i => i !== -1);
      this.logger.warn(
        `Failed garden IDs: ${failedIndexes.map(i => gardens[i].id).join(', ')}`,
      );
    }
  }

  private async handleFailure(gardenId: number, msg: string) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });
    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }
    const existing = await this.prisma.alert.findFirst({
      where: { gardenId, type: AlertType.WEATHER, status: AlertStatus.PENDING },
    });
    if (!existing) {
      await this.prisma.alert.create({
        data: {
          gardenId,
          userId: garden.gardenerId,
          type: AlertType.WEATHER,
          message: msg.slice(0, 200),
          suggestion: 'Check API key, coordinates and network.',
          status: AlertStatus.PENDING,
        },
      });
    }
  }

  /** Remove expired forecasts */
  public async cleanupExpiredForecasts() {
    const now = new Date();
    const [h, d] = await Promise.all([
      this.prisma.hourlyForecast.deleteMany({
        where: { forecastFor: { lt: now } },
      }),
      this.prisma.dailyForecast.deleteMany({
        where: { forecastFor: { lt: new Date(now.setHours(0, 0, 0, 0)) } },
      }),
    ]);
    this.logger.log(`Cleaned forecasts — hourly:${h.count}, daily:${d.count}`);
    return { hourlyDeleted: h.count, dailyDeleted: d.count };
  }

  /** Remove old observations beyond TTL */
  public async cleanupOldObservations(months = 6) {
    const cutoff = new Date();
    cutoff.setMonth(cutoff.getMonth() - months);
    const res = await this.prisma.weatherObservation.deleteMany({
      where: { observedAt: { lt: cutoff } },
    });
    this.logger.log(`Deleted ${res.count} old observations`);
    return res.count;
  }

  /** Get or refresh hourly forecasts */
  public async getHourlyForecasts(gardenId: number) {
    const now = Date.now();
    const cached = this.cache.hourlyForecast[gardenId];
    if (cached && now - cached.timestamp < this.ttl.hourly) {
      return cached.data;
    }
    const forecasts = await this.prisma.hourlyForecast.findMany({
      where: { gardenId, forecastFor: { gte: new Date() } },
      orderBy: { forecastFor: 'asc' },
    });
    this.cache.hourlyForecast[gardenId] = { data: forecasts, timestamp: now };
    return forecasts;
  }

  /** Get or refresh daily forecasts */
  public async getDailyForecasts(gardenId: number) {
    const now = Date.now();
    const cached = this.cache.dailyForecast[gardenId];
    if (cached && now - cached.timestamp < this.ttl.daily) {
      return cached.data;
    }
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const forecasts = await this.prisma.dailyForecast.findMany({
      where: { gardenId, forecastFor: { gte: today } },
      orderBy: { forecastFor: 'asc' },
    });
    this.cache.dailyForecast[gardenId] = { data: forecasts, timestamp: now };
    return forecasts;
  }

  /** Clear in-memory cache */
  public clearCache(gardenId?: number) {
    if (gardenId != null) {
      delete this.cache.observation[gardenId];
      delete this.cache.hourlyForecast[gardenId];
      delete this.cache.dailyForecast[gardenId];
      this.logger.debug(`Cleared cache for garden ${gardenId}`);
    } else {
      this.cache = { observation: {}, hourlyForecast: {}, dailyForecast: {} };
      this.logger.debug('Cleared all weather cache');
    }
  }

  /** Return daily summary grouped by date */
  public async getWeatherHistory(
    gardenId: number,
    startDate: Date,
    endDate: Date,
  ) {
    const obs = await this.prisma.weatherObservation.findMany({
      where: { gardenId, observedAt: { gte: startDate, lte: endDate } },
      orderBy: { observedAt: 'asc' },
    });
    if (!obs.length)
      throw new NotFoundException(`No history for garden ${gardenId}`);

    const map = new Map<
      string,
      {
        date: string;
        temps: number[];
        hums: number[];
        counts: Record<string, number>;
      }
    >();

    obs.forEach((o) => {
      const key = o.observedAt.toISOString().split('T')[0];
      if (!map.has(key)) {
        map.set(key, { date: key, temps: [], hums: [], counts: {} });
      }
      const d = map.get(key)!;
      d.temps.push(o.temp);
      d.hums.push(o.humidity);
      const wm = o.weatherMain.toString();
      d.counts[wm] = (d.counts[wm] || 0) + 1;
    });

    return Array.from(map.values()).map((d) => {
      const avgTemp = d.temps.reduce((a, b) => a + b, 0) / d.temps.length;
      const avgHum = d.hums.reduce((a, b) => a + b, 0) / d.hums.length;
      const dominant =
        Object.entries(d.counts).sort((a, b) => b[1] - a[1])[0]?.[0] ?? null;
      return {
        date: d.date,
        minTemp: Math.min(...d.temps),
        maxTemp: Math.max(...d.temps),
        avgTemp,
        minHum: Math.min(...d.hums),
        maxHum: Math.max(...d.hums),
        avgHum,
        dominant,
      };
    });
  }

  /** Get or refresh the latest observation from cache/DB */
  public async getLatestWeatherObservation(
    gardenId: number,
  ): Promise<WeatherObservation> {
    const now = Date.now();
    const cached = this.cache.observation[gardenId];
    if (cached && now - cached.timestamp < this.ttl.observation) {
      this.logger.debug(`Cache hit for observation garden ${gardenId}`);
      return cached.data;
    }
    this.logger.debug(`Cache miss for observation garden ${gardenId}`);
    const obs = await this.prisma.weatherObservation.findFirst({
      where: { gardenId },
      orderBy: { observedAt: 'desc' },
    });
    if (!obs) {
      this.logger.warn(
        `No observations found for garden ${gardenId} when fetching for weather endpoint.`,
      );
      throw new NotFoundException(
        `No current weather observation for garden ${gardenId}`,
      );
    }
    this.cache.observation[gardenId] = { data: obs, timestamp: now };
    return obs;
  }
}