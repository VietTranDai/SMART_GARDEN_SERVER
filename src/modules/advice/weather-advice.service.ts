import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WeatherAdviceDto } from './dto/weather-advice.dto';
import { WeatherMain, WeatherObservation } from '@prisma/client';

// Define CacheEntry interface locally or import if it becomes a shared DTO
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

@Injectable()
export class WeatherAdviceService {
  private readonly logger = new Logger(WeatherAdviceService.name);
  private observationCache: Record<number, CacheEntry<WeatherObservation>> = {};
  private readonly observationTtl = 15 * 60_000; // 15 minutes for observation cache

  constructor(private prisma: PrismaService) {}

  /** Get or refresh the latest observation from cache/DB */
  public async getLatestWeatherObservation(
    gardenId: number,
  ): Promise<WeatherObservation> {
    const now = Date.now();
    const cached = this.observationCache[gardenId];
    if (cached && now - cached.timestamp < this.observationTtl) {
      return cached.data;
    }
    const obs = await this.prisma.weatherObservation.findFirst({
      where: { gardenId },
      orderBy: { observedAt: 'desc' },
    });
    if (!obs) {
      this.logger.warn(
        `No observations found for garden ${gardenId} when fetching for advice.`,
      );
      throw new NotFoundException(`No observations for garden ${gardenId}`);
    }
    this.observationCache[gardenId] = { data: obs, timestamp: now };
    return obs;
  }

  /** Get garden type for advice generation */
  public async getGardenType(
    gardenId: number,
  ): Promise<{ type: string | null }> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { type: true },
    });

    if (!garden) {
      this.logger.warn(
        `Garden with ID ${gardenId} not found when fetching type for advice.`,
      );
      throw new NotFoundException(`Garden with ID ${gardenId} not found.`);
    }
    return { type: garden.type }; // type can be null
  }

  /**
   * Generate advice based on weather conditions and garden type
   */
  public generateWeatherAdvice(
    weather: WeatherObservation, // Use WeatherObservation type
    gardenType?: string | null, // type can be null
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
      weatherCondition: WeatherMain.CLEAR, // Defaulting to CLEAR, can be dynamic
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
   * Get weather-based advice for a garden.
   */
  public async getWeatherBasedAdvice(
    gardenId: number,
  ): Promise<WeatherAdviceDto[]> {
    this.logger.log(`Fetching weather-based advice for garden ${gardenId}`);
    const weather = await this.getLatestWeatherObservation(gardenId);
    const gardenData = await this.getGardenType(gardenId);
    return this.generateWeatherAdvice(weather, gardenData.type);
  }
}
