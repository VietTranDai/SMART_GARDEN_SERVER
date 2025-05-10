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
} from '@prisma/client';
import { firstValueFrom } from 'rxjs';
import { AxiosError } from 'axios';
import { mapWeatherCodeToEnum } from './utils/weather-mapping.util';
import {
  CurrentWeatherResponse,
  HourlyForecastApiResponse,
  DailyForecastApiResponse,
  WeatherCache,
} from './dto/interface';
import { WeatherAdviceDto } from './dto/weather-advice.dto';

@Injectable()
export class WeatherService implements OnModuleInit {
  private readonly logger = new Logger(WeatherService.name);
  private readonly apiKey: string;

  // API endpoints
  private readonly currentUrl =
    'https://api.openweathermap.org/data/2.5/weather';
  private readonly hourlyUrl =
    'https://pro.openweathermap.org/data/2.5/forecast/hourly';
  private readonly dailyUrl =
    'https://api.openweathermap.org/data/2.5/forecast/daily';

  // In-memory cache
  private cache: WeatherCache = {
    observation: {},
    hourlyForecast: {},
    dailyForecast: {},
  };
  private readonly ttl = {
    observation: 15 * 60_000, // 15 phút
    hourly: 60 * 60_000, // 1 giờ
    daily: 6 * 60 * 60_000, // 6 giờ
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
   * Update weather for one garden.
   * Returns true on success, false otherwise.
   */
  public async updateWeatherForGarden(garden: Garden): Promise<boolean> {
    if (!garden.lat || !garden.lng) return false;
    try {
      const [current, hourly, daily] = await Promise.all([
        this.fetchCurrent(garden.lat, garden.lng),
        this.fetchHourly(garden.lat, garden.lng),
        this.fetchDaily(garden.lat, garden.lng),
      ]);

      const obs = this.processCurrent(garden, current);
      const hf = this.processHourly(garden, hourly.list);
      const df = this.processDaily(garden, daily.list);

      await this.prisma.$transaction(async (tx) => {
        await tx.weatherObservation.create({ data: obs });
        for (const entry of hf) {
          await tx.hourlyForecast.upsert({
            where: {
              gardenId_forecastFor: {
                gardenId: garden.id,
                forecastFor: entry.forecastFor,
              },
            },
            update: entry,
            create: entry,
          });
        }
        for (const entry of df) {
          await tx.dailyForecast.upsert({
            where: {
              gardenId_forecastFor: {
                gardenId: garden.id,
                forecastFor: entry.forecastFor,
              },
            },
            update: entry,
            create: entry,
          });
        }
      });

      return true;
    } catch (error) {
      this.logger.error(`Garden ${garden.id} update failed`, error);
      await this.handleFailure(garden.id, (error as Error).message);
      return false;
    }
  }

  /** Schedule update for all active gardens */
  public async updateAllActiveGardens(): Promise<void> {
    this.logger.log('Starting weather update for all ACTIVE gardens');
    const gardens = await this.prisma.garden.findMany({
      where: { status: 'ACTIVE', lat: { not: null }, lng: { not: null } },
    });

    const results = await Promise.allSettled(
      gardens.map((g) => this.updateWeatherForGarden(g)),
    );

    const success = results.filter(
      (r) => r.status === 'fulfilled' && (r as any).value === true,
    ).length;
    const failed = results.length - success;
    this.logger.log(
      `Weather update done — Success: ${success}, Failed: ${failed}`,
    );
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

  /** Get or refresh the latest observation from cache/DB */
  public async getLatestWeatherObservation(gardenId: number) {
    const now = Date.now();
    const cached = this.cache.observation[gardenId];
    if (cached && now - cached.timestamp < this.ttl.observation) {
      return cached.data;
    }
    const obs = await this.prisma.weatherObservation.findFirst({
      where: { gardenId },
      orderBy: { observedAt: 'desc' },
    });
    if (!obs)
      throw new NotFoundException(`No observations for garden ${gardenId}`);
    this.cache.observation[gardenId] = { data: obs, timestamp: now };
    return obs;
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

  /**
   * Generate advice based on weather conditions and garden type
   */
  public generateWeatherAdvice(
    weather: any,
    gardenType?: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();

    // Base advice on weather conditions
    switch (weather.weatherMain) {
      case WeatherMain.CLEAR:
        if (weather.temp < 0) {
          advice.push({
            id: 13,
            title: 'Cảnh báo sương giá',
            description:
              'Che phủ cây trồng bằng vải hoặc nilon để bảo vệ khỏi sương giá.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: -10, max: 0 },
            icon: 'snow-outline',
            priority: 5,
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          advice.push({
            id: 24,
            title: 'Bảo vệ cây khỏi sương giá',
            description:
              'Dùng vải che hoặc đèn sưởi để bảo vệ cây khỏi sương giá.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: -10, max: 0 },
            icon: 'snow-outline',
            priority: 5,
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else if (weather.temp < 10) {
          advice.push({
            id: 14,
            title: 'Thời tiết lạnh',
            description:
              'Cân nhắc di chuyển cây nhạy cảm vào trong nhà hoặc che phủ bằng vải chống lạnh.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 0, max: 10 },
            icon: 'thermometer-outline',
            priority: 4,
            applicableGardenTypes: [
              'OUTDOOR',
              'BALCONY',
              'ROOFTOP',
              'WINDOW_SILL',
            ],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else if (weather.temp < 20) {
          advice.push({
            id: 15,
            title: 'Thời tiết mát mẻ',
            description:
              'Thời tiết lý tưởng để làm vườn, cắt tỉa hoặc trồng mới cây.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 10, max: 20 },
            icon: 'sunny-outline',
            priority: 3,
            applicableGardenTypes: [
              'OUTDOOR',
              'BALCONY',
              'ROOFTOP',
              'WINDOW_SILL',
            ],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else if (weather.temp < 30) {
          advice.push({
            id: 16,
            title: 'Thời tiết ấm',
            description:
              'Đảm bảo tưới nước đầy đủ cho cây, đặc biệt vào buổi sáng để tránh mất nước.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 20, max: 30 },
            icon: 'water-outline',
            priority: 4,
            applicableGardenTypes: [
              'OUTDOOR',
              'BALCONY',
              'ROOFTOP',
              'WINDOW_SILL',
            ],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        } else {
          advice.push({
            id: 1,
            title: 'Tưới nước buổi sáng sớm',
            description:
              'Nhiệt độ cao có thể gây mất nước cho cây. Hãy tưới nước vào buổi sáng sớm để giúp cây chống chọi với nhiệt.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 30, max: 40 },
            icon: 'water-outline',
            priority: 5,
            bestTimeOfDay: '6:00 - 8:00',
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          advice.push({
            id: 2,
            title: 'Che phủ đất',
            description:
              'Sử dụng lớp phủ như rơm, vỏ cây để giảm bốc hơi nước và giữ độ ẩm cho đất.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 30, max: 40 },
            icon: 'leaf-outline',
            priority: 4,
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          advice.push({
            id: 23,
            title: 'Tưới nước sâu',
            description:
              'Tưới nước sâu và ít thường xuyên hơn để khuyến khích rễ phát triển sâu, giúp cây chịu nhiệt tốt hơn.',
            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 30, max: 40 },
            icon: 'water-outline',
            priority: 4,
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        }
        break;

      case WeatherMain.CLOUDS:
        advice.push({
          id: 4,
          title: 'Thời điểm tốt để cấy ghép',
          description:
            'Thời tiết có mây giúp giảm sốc nhiệt, lý tưởng để cấy ghép cây con hoặc chuyển chậu.',
          weatherCondition: WeatherMain.CLOUDS,
          icon: 'cloud-outline',
          priority: 3,
          applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        if (weather.temp > 25) {
          advice.push({
            id: 17,
            title: 'Theo dõi độ ẩm đất',
            description:
              'Mặc dù có mây, nhiệt độ cao vẫn có thể làm khô đất. Kiểm tra độ ẩm và tưới nước nếu cần.',
            weatherCondition: WeatherMain.CLOUDS,
            temperature: { min: 25, max: 40 },
            icon: 'water-outline',
            priority: 4,
            applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        }
        break;

      case WeatherMain.DRIZZLE:
        advice.push({
          id: 18,
          title: 'Mưa phùn: Không cần tưới nước',
          description:
            'Mưa phùn cung cấp đủ nước cho cây, không cần tưới thêm nhưng hãy kiểm tra độ ẩm đất.',
          weatherCondition: WeatherMain.DRIZZLE,
          icon: 'rainy-outline',
          priority: 3,
          applicableGardenTypes: [
            'OUTDOOR',
            'BALCONY',
            'ROOFTOP',
            'WINDOW_SILL',
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      case WeatherMain.RAIN:
        advice.push({
          id: 5,
          title: 'Kiểm tra thoát nước',
          description:
            'Mưa lớn có thể gây ngập úng. Đảm bảo hệ thống thoát nước hoạt động tốt để tránh úng rễ.',
          weatherCondition: WeatherMain.RAIN,
          icon: 'rainy-outline',
          priority: 4,
          applicableGardenTypes: [
            'OUTDOOR',
            'BALCONY',
            'ROOFTOP',
            'WINDOW_SILL',
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        advice.push({
          id: 6,
          title: 'Tạm hoãn bón phân',
          description:
            'Mưa lớn có thể rửa trôi phân bón. Hãy chờ thời tiết khô ráo để bón phân.',
          weatherCondition: WeatherMain.RAIN,
          icon: 'water-outline',
          priority: 3,
          applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        advice.push({
          id: 25,
          title: 'Kiểm tra bệnh hại',
          description:
            'Mưa nhiều có thể gây bệnh nấm. Kiểm tra lá và thân cây, sử dụng thuốc phòng nấm nếu cần.',
          weatherCondition: WeatherMain.RAIN,
          icon: 'bug-outline',
          priority: 3,
          applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      case WeatherMain.THUNDERSTORM:
        advice.push({
          id: 7,
          title: 'Bảo vệ cây khỏi gió mạnh',
          description:
            'Di chuyển chậu cây vào nơi kín gió hoặc cố định cây để tránh thiệt hại do bão.',
          weatherCondition: WeatherMain.THUNDERSTORM,
          icon: 'thunderstorm-outline',
          priority: 5,
          applicableGardenTypes: ['BALCONY', 'ROOFTOP', 'WINDOW_SILL'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        advice.push({
          id: 19,
          title: 'Tránh làm vườn trong cơn bão',
          description:
            'Để đảm bảo an toàn, không làm vườn khi có sấm sét hoặc gió mạnh.',
          weatherCondition: WeatherMain.THUNDERSTORM,
          icon: 'alert-outline',
          priority: 5,
          applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP'],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      case WeatherMain.SNOW:
        advice.push({
          id: 11,
          title: 'Bảo vệ cây khỏi tuyết',
          description:
            'Che phủ cây bằng vải hoặc di chuyển chậu cây vào trong để tránh tuyết và lạnh.',
          weatherCondition: WeatherMain.SNOW,
          icon: 'snow-outline',
          priority: 5,
          applicableGardenTypes: [
            'OUTDOOR',
            'BALCONY',
            'ROOFTOP',
            'WINDOW_SILL',
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      case WeatherMain.ATMOSPHERE:
        advice.push({
          id: 12,
          title: 'Cẩn thận với độ ẩm cao',
          description:
            'Độ ẩm cao có thể gây bệnh nấm mốc. Đảm bảo thông gió tốt và kiểm tra cây thường xuyên.',
          weatherCondition: WeatherMain.ATMOSPHERE,
          icon: 'water-outline',
          priority: 3,
          applicableGardenTypes: [
            'INDOOR',
            'OUTDOOR',
            'BALCONY',
            'ROOFTOP',
            'WINDOW_SILL',
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      default:
        advice.push({
          id: 8,
          title: 'Theo dõi điều kiện thời tiết',
          description:
            'Hãy theo dõi sát điều kiện thời tiết để điều chỉnh việc chăm sóc cây trồng phù hợp.',
          weatherCondition: weather.weatherMain,
          icon: 'thermometer-outline',
          priority: 2,
          applicableGardenTypes: [
            'INDOOR',
            'OUTDOOR',
            'BALCONY',
            'ROOFTOP',
            'WINDOW_SILL',
          ],
          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
    }

    // Add general advice based on wind speed
    if (weather.windSpeed > 10) {
      advice.push({
        id: 20,
        title: 'Cảnh báo gió mạnh',
        description:
          'Gió mạnh có thể làm gãy cây hoặc lật chậu. Di chuyển chậu vào nơi kín gió hoặc cố định cây.',
        weatherCondition: weather.weatherMain,
        wind: { minSpeed: 10 },
        icon: 'leaf-outline',
        priority: 5,
        applicableGardenTypes: ['OUTDOOR', 'BALCONY', 'ROOFTOP', 'WINDOW_SILL'],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // Add garden type specific advice
    if (gardenType) {
      switch (gardenType) {
        case 'INDOOR':
          advice.push({
            id: 9,
            title: 'Điều chỉnh ánh sáng cho cây trong nhà',
            description: `Với thời tiết ${weather.weatherDesc}, hãy đảm bảo cây nhận đủ ánh sáng bằng cách điều chỉnh vị trí hoặc sử dụng đèn trồng cây.`,
            weatherCondition: weather.weatherMain,
            icon: 'home-outline',
            priority: 3,
            applicableGardenTypes: ['INDOOR'],
            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
          if (weather.temp > 30) {
            advice.push({
              id: 21,
              title: 'Giữ mát cho cây trong nhà',
              description:
                'Nhiệt độ ngoài trời cao, hãy đóng rèm hoặc sử dụng điều hòa để giữ mát cho cây trong nhà.',
              weatherCondition: weather.weatherMain,
              temperature: { min: 30, max: 40 },
              icon: 'home-outline',
              priority: 4,
              applicableGardenTypes: ['INDOOR'],
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });
          } else if (weather.temp < 10) {
            advice.push({
              id: 22,
              title: 'Giữ ấm cho cây trong nhà',
              description:
                'Nhiệt độ ngoài trời thấp, đảm bảo nhiệt độ trong nhà đủ ấm bằng cách sử dụng máy sưởi hoặc đèn sưởi.',
              weatherCondition: weather.weatherMain,
              temperature: { min: -10, max: 10 },
              icon: 'home-outline',
              priority: 4,
              applicableGardenTypes: ['INDOOR'],
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });
          }
          break;

        case 'BALCONY':
        case 'ROOFTOP':
          if (weather.temp > 30) {
            advice.push({
              id: 26,
              title: 'Cung cấp bóng râm',
              description:
                'Nhiệt độ cao có thể làm cháy lá. Sử dụng lưới che hoặc ô để bảo vệ cây trên ban công hoặc sân thượng.',
              weatherCondition: weather.weatherMain,
              temperature: { min: 30, max: 40 },
              icon: 'sunny-outline',
              priority: 4,
              applicableGardenTypes: ['BALCONY', 'ROOFTOP'],
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });
          }
          break;

        case 'OUTDOOR':
          if (weather.temp < 0) {
            advice.push({
              id: 27,
              title: 'Chuẩn bị cho sương giá',
              description:
                'Sương giá có thể gây hại cây ngoài trời. Sử dụng khung che hoặc vải để bảo vệ cây qua đêm.',
              weatherCondition: weather.weatherMain,
              temperature: { min: -10, max: 0 },
              icon: 'snow-outline',
              priority: 5,
              applicableGardenTypes: ['OUTDOOR'],
              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });
          }
          break;

        default:
        // Default advice for other garden types
      }
    }

    // General maintenance advice
    advice.push({
      id: 28,
      title: 'Kiểm tra đất thường xuyên',
      description:
        'Luôn kiểm tra độ ẩm đất trước khi tưới nước để tránh tưới quá nhiều hoặc quá ít.',
      weatherCondition: WeatherMain.CLEAR,
      icon: 'hand-right-outline',
      priority: 2,
      applicableGardenTypes: [
        'INDOOR',
        'OUTDOOR',
        'BALCONY',
        'ROOFTOP',
        'WINDOW_SILL',
      ],
      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    // Sort by priority (highest first)
    return advice.sort((a, b) => b.priority - a.priority);
  }

  /**
   * Get weather advice for a garden based on current weather and garden type
   */
  public async getWeatherAdvice(gardenId: number): Promise<WeatherAdviceDto[]> {
    // Get the latest weather observation
    const weather = await this.getLatestWeatherObservation(gardenId);

    // Get garden details to determine the garden type
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { type: true },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    // Generate advice based on weather and garden type (may be null/undefined)
    return this.generateWeatherAdvice(weather, garden.type || undefined);
  }

  /**
   * Get garden type for advice generation
   */
  public async getGardenType(gardenId: number): Promise<{ type: string }> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { type: true },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }

    return { type: garden.type };
  }
}
