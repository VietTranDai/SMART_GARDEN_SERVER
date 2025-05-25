import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { WeatherAdviceDto } from './dto/weather-advice.dto';
import {
  WeatherMain,
  WeatherObservation,
  GardenType,
  ActivityType,
  SensorType,
} from '@prisma/client';

@Injectable()
export class WeatherAdviceService {
  private readonly logger = new Logger(WeatherAdviceService.name);
  private observationCache: Record<number, CacheEntry<WeatherObservation>> = {};
  private readonly observationTtl = 15 * 60_000;

  constructor(private prisma: PrismaService) {}

  /*
   * 🌱 Lấy thông tin siêu chi tiết về vườn và người chăm sóc
   */
  public async getCompleteGardenProfile(gardenId: number) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        gardener: {
          include: {
            user: {
              select: {
                firstName: true,
                lastName: true,
                bio: true,
              },
            },
            experienceLevel: true,
            posts: {
              take: 3,
              orderBy: { createdAt: 'desc' },
              where: { gardenId },
            },
          },
        },
        sensors: {
          where: { sensorData: { some: {} } },
          include: {
            sensorData: {
              take: 10,
              orderBy: { timestamp: 'desc' },
            },
          },
        },
        activities: {
          take: 5,
          orderBy: { timestamp: 'desc' },
          include: {
            evaluations: true,
          },
        },
        task: {
          where: {
            status: 'PENDING',
            dueDate: { gte: new Date() },
          },
          orderBy: { dueDate: 'asc' },
          take: 5,
        },
        wateringSchedule: {
          where: {
            scheduledAt: {
              gte: new Date(),
              lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 ngày tới
            },
          },
          orderBy: { scheduledAt: 'asc' },
        },
        alerts: {
          where: { status: 'PENDING' },
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    if (!garden) {
      throw new NotFoundException(
        `Ôi không! Tôi không tìm thấy vườn với ID ${gardenId}. Bạn có chắc ID này đúng không? 🤔`,
      );
    }

    return garden;
  }

  /*
   * 📊 Phân tích dữ liệu cảm biến thông minh
   */
  private async analyzeSensorData(gardenId: number) {
    const sensors = await this.prisma.sensor.findMany({
      where: { gardenId },
      include: {
        sensorData: {
          where: {
            timestamp: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // 24h qua
            },
          },
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    const analysis = {
      soilMoisture: {
        current: 0,
        trend: 'stable',
        isOptimal: true,
        suggestion: '',
      },
      soilPH: { current: 0, trend: 'stable', isOptimal: true, suggestion: '' },
      temperature: {
        current: 0,
        trend: 'stable',
        isOptimal: true,
        suggestion: '',
      },
      humidity: {
        current: 0,
        trend: 'stable',
        isOptimal: true,
        suggestion: '',
      },
      light: { current: 0, trend: 'stable', isOptimal: true, suggestion: '' },
    };

    // Phân tích từng loại cảm biến
    for (const sensor of sensors) {
      if (sensor.sensorData.length === 0) continue;

      const latestValue = sensor.sensorData[0].value;
      const trend = this.calculateTrend(sensor.sensorData);

      switch (sensor.type) {
        case SensorType.SOIL_MOISTURE:
          analysis.soilMoisture = {
            current: latestValue,
            trend,
            isOptimal: latestValue >= 40 && latestValue <= 70,
            suggestion: this.getSoilMoistureSuggestion(latestValue, trend),
          };
          break;
        case SensorType.SOIL_PH:
          analysis.soilPH = {
            current: latestValue,
            trend,
            isOptimal: latestValue >= 6.0 && latestValue <= 7.0,
            suggestion: this.getSoilPHSuggestion(latestValue, trend),
          };
          break;
        case SensorType.TEMPERATURE:
          analysis.temperature = {
            current: latestValue,
            trend,
            isOptimal: latestValue >= 20 && latestValue <= 30,
            suggestion: this.getTemperatureSuggestion(latestValue, trend),
          };
          break;
        case SensorType.HUMIDITY:
          analysis.humidity = {
            current: latestValue,
            trend,
            isOptimal: latestValue >= 60 && latestValue <= 80,
            suggestion: this.getHumiditySuggestion(latestValue, trend),
          };
          break;
        case SensorType.LIGHT:
          analysis.light = {
            current: latestValue,
            trend,
            isOptimal: latestValue >= 1000 && latestValue <= 50000,
            suggestion: this.getLightSuggestion(latestValue, trend),
          };
          break;
      }
    }

    return analysis;
  }

  /*
   * 🎯 Tạo lời khuyên siêu chi tiết và thân thiện
   */
  public async generateSuperFriendlyAdvice(
    gardenId: number,
  ): Promise<WeatherAdviceDto[]> {
    const garden = await this.getCompleteGardenProfile(gardenId);
    const currentWeather = await this.getLatestWeatherObservation(gardenId);
    const sensorAnalysis = await this.analyzeSensorData(gardenId);
    const weatherHistory = await this.getWeatherTrend(gardenId, 7);

    const advice: WeatherAdviceDto[] = [];
    const gardenerName = garden.gardener.user.firstName;
    const experienceLevel = garden.gardener.experienceLevel.title;

    // 🌡️ Lời khuyên dựa trên thời tiết với cá nhân hóa
    advice.push(
      ...this.generatePersonalizedWeatherAdvice(
        currentWeather,
        garden,
        gardenerName,
        experienceLevel,
        sensorAnalysis,
      ),
    );

    // 🌱 Lời khuyên dựa trên loại cây và giai đoạn phát triển
    if (garden.plantName && garden.plantGrowStage) {
      advice.push(
        ...this.generatePlantStageAdvice(
          currentWeather,
          garden.plantName,
          garden.plantGrowStage,
          garden.plantStartDate,
          sensorAnalysis,
          gardenerName,
        ),
      );
    }

    // 📊 Lời khuyên dựa trên dữ liệu cảm biến
    advice.push(
      ...this.generateSensorBasedAdvice(
        sensorAnalysis,
        currentWeather,
        garden.type,
        gardenerName,
      ),
    );

    // 🗓️ Lời khuyên dựa trên lịch trình và công việc
    advice.push(
      ...this.generateScheduleBasedAdvice(
        garden.task,
        garden.wateringSchedule,
        currentWeather,
        gardenerName,
      ),
    );

    // 🏆 Lời khuyên dựa trên kinh nghiệm và hoạt động gần đây
    advice.push(
      ...this.generateExperienceBasedAdvice(
        garden.gardener.experienceLevel,
        garden.activities,
        currentWeather,
        gardenerName,
      ),
    );

    // ⚠️ Cảnh báo dựa trên alerts hiện tại
    if (garden.alerts.length > 0) {
      advice.push(
        ...this.generateAlertBasedAdvice(
          garden.alerts,
          currentWeather,
          gardenerName,
        ),
      );
    }

    // 🌤️ Dự báo và lời khuyên cho những ngày tới
    advice.push(
      ...(await this.generateForecastAdvice(
        gardenId,
        garden.type,
        gardenerName,
      )),
    );

    return this.prioritizeAndPersonalizeAdvice(
      advice,
      garden.gardener.experienceLevel.level,
    );
  }

  /*
   * 🌡️ Lời khuyên thời tiết được cá nhân hóa hoàn toàn
   */
  private generatePersonalizedWeatherAdvice(
    weather: WeatherObservation,
    garden: any,
    gardenerName: string,
    experienceLevel: string,
    sensorData: any,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();
    const timeOfDay = this.getTimeOfDay();

    switch (weather.weatherMain) {
      case WeatherMain.CLEAR:
        if (weather.temp > 35) {
          advice.push({
            id: 1001,
            title: `🔥 ${gardenerName} ơi, nhiệt độ ${weather.temp}°C đây - Khẩn cấp bảo vệ vườn!`,
            description: `Chào ${gardenerName}! Tôi thấy vườn ${garden.type === 'OUTDOOR' ? 'ngoài trời' : garden.type === 'BALCONY' ? 'ban công' : 'trong nhà'} của bạn đang phải đối mặt với nhiệt độ cực nóng ${weather.temp}°C. Với kinh nghiệm ${experienceLevel} của bạn, chúng ta cần hành động ngay để cứu vườn nhé! 💪`,

            detailedSteps: [
              `🌅 ${timeOfDay === 'morning' ? 'Ngay bây giờ' : 'Sáng mai sớm 5:30'}): Tưới nước sâu 2-3 lít/m² (khoảng ${garden.type === 'BALCONY' ? '1-2 lít/chậu' : '3-5 lít/luống'})`,
              `🌾 10 phút sau: Phủ lớp mulch dày 7-10cm quanh gốc cây (dùng rơm, lá khô, hoặc vỏ trấu)`,
              `☂️ Trước 9h sáng: Căng lưới che 70% ánh sáng hoặc dùng tấm bạt che từ 9h-16h`,
              `💧 Mỗi 2 tiếng: Kiểm tra độ ẩm đất bằng ngón tay - nếu khô 3cm thì tưới ngay`,
              `🌫️ 17h-18h: Phun sương nhẹ lên không khí xung quanh (KHÔNG phun trực tiếp lên lá)`,
              `🌙 20h: Tưới nước nhẹ bổ sung nếu đất vẫn khô`,
            ],

            reasons: [
              `🌡️ Nhiệt độ ${weather.temp}°C có thể gây "cháy lá" - lá bị khô, vàng và rụng trong vài giờ`,
              `💨 Tốc độ bốc hơi nước tăng gấp 4-5 lần bình thường, cây có thể bị mất nước nghiêm trọng`,
              `🔥 Nhiệt độ đất có thể lên tới 45-50°C, làm tổn thương hệ thống rễ`,
              `🌿 ${garden.plantName ? `Cây ${garden.plantName}` : 'Cây của bạn'} đang trong giai đoạn ${garden.plantGrowStage || 'phát triển'} rất nhạy cảm với nhiệt`,
            ],

            tips: [
              `💡 Mẹo của ${experienceLevel}: Đặt chai nước nhựa có đục lỗ nhỏ cạnh gốc cây để tưới từ từ suốt ngày`,
              `🌴 Tạo bóng mát tự nhiên: ${garden.type === 'OUTDOOR' ? 'Trồng cây chuối, đu đủ để che bóng dài hạn' : 'Dùng ô dù hoặc màn che di động'}`,
              `🧊 Làm mát nhanh: Đặt chậu nước lớn gần cây để tăng độ ẩm không khí`,
              `📱 Theo dõi thông minh: ${sensorData.soilMoisture.current ? `Cảm biến độ ẩm đất hiện tại: ${sensorData.soilMoisture.current}%` : 'Cài đặt cảm biến độ ẩm để theo dõi tự động'}`,
              `🌱 Lựa chọn thông minh: Trồng thêm cây chịu nắng như sả, bạc hà, húng quế xung quanh`,
            ],

            precautions: [
              `⚠️ TUYỆT ĐỐI KHÔNG tưới nước lạnh đột ngột vào đất nóng (có thể gây sốc nhiệt cho rễ)`,
              `🚫 TRÁNH tưới nước từ 11h-15h (nước sẽ bốc hơi ngay, lãng phí và có thể làm cháy lá)`,
              `❌ KHÔNG bón phân khi cây đang stress nhiệt (cây không thể hấp thụ, có thể gây cháy rễ)`,
              `⛔ NGƯNG cắt tỉa hoặc làm tổn thương cây trong thời gian này`,
              `🔍 CHÚ Ý: Nếu lá bắt đầu cong, cuộn lại - đó là dấu hiệu cây đang bảo vệ bản thân`,
            ],

            personalizedMessage: `Này ${gardenerName}, tôi biết với trình độ ${experienceLevel} của bạn, việc này không quá khó! Nhưng thời tiết hôm nay thực sự đặc biệt nóng. ${garden.plantName ? `Cây ${garden.plantName} ở giai đoạn ${garden.plantGrowStage}` : 'Cây của bạn'} đang cần sự chăm sóc đặc biệt. Hãy kiên nhẫn và làm từng bước nhé! 💪🌱`,

            urgencyLevel: 'CRITICAL',
            difficultyLevel:
              experienceLevel === 'Người làm vườn mới' ? 'MEDIUM' : 'EASY',
            bestTimeOfDay: '5:30-6:30 và 17:00-20:00',
            duration: '45-60 phút (chia làm nhiều lần)',
            frequency:
              'Mỗi 2-3 tiếng cho đến khi nhiệt độ giảm xuống dưới 32°C',

            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 35, max: 45 },
            icon: 'flame-outline',
            priority: 10,
            applicableGardenTypes: [garden.type],
            plantTypes: garden.plantName
              ? [garden.plantName]
              : ['Tất cả các loại cây'],
            seasonality: ['Mùa khô', 'Mùa hè'],

            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });

          // Thêm lời khuyên bổ sung cho loại vườn cụ thể
          if (garden.type === 'BALCONY') {
            advice.push({
              id: 1002,
              title: `🏢 Mẹo đặc biệt cho vườn ban công của ${gardenerName}`,
              description: `Ban công thường nóng hơn mặt đất 3-5°C vì hiệu ứng phản xạ từ tường và sàn. Đây là những mẹo đặc biệt cho không gian của bạn!`,

              detailedSteps: [
                `🧱 Làm mát sàn ban công: Phun nước lên sàn, tường ban công lúc 17h để giảm nhiệt độ`,
                `📦 Nâng cao chậu cây: Dùng gạch, khế gỗ để chậu cây không tiếp xúc trực tiếp với sàn nóng`,
                `💨 Tạo luồng gió: Mở cửa 2 đầu ban công để tạo gió thoáng, hoặc dùng quạt mini`,
                `🌿 Nhóm cây lại: Đặt các chậu cây gần nhau để tạo vi khí hậu ẩm ướt`,
                `☂️ Che chắn thông minh: Dùng màn tre, lưới che hoặc trồng cây leo để tạo bóng mát tự nhiên`,
              ],

              tips: [
                `💡 Hack ban công: Treo túi nước bên ngoài lan can để làm mát không khí`,
                `🌱 Chọn cây thông minh: Cây lưỡi hổ, sen đá, cây thủy canh ít cần nước hơn`,
                `🏺 Dự trữ nước: Đặt thùng nước lớn ở góc khuất để có nước tưới khẩn cấp`,
              ],
              personalizedMessage: `Này ${gardenerName}, tôi biết với trình độ ${experienceLevel} của bạn, việc này không quá khó! Nhưng thời tiết hôm nay thực sự đặc biệt nóng. ${garden.plantName ? `Cây ${garden.plantName} ở giai đoạn ${garden.plantGrowStage}` : 'Cây của bạn'} đang cần sự chăm sóc đặc biệt. Hãy kiên nhẫn và làm từng bước nhé! 💪🌱`,
              reasons: [
                `🌡️ Nhiệt độ ${weather.temp}°C làm tăng gấp đôi nhu cầu nước của cây`,
                `☀️ Ánh nắng mạnh có thể làm cháy lá non và chồi mới`,
                `💨 Gió ${weather.windSpeed}m/s kết hợp nóng sẽ làm khô đất nhanh hơn`,
                `🌱 ${garden.plantName ? `Cây ${garden.plantName}` : 'Cây'} đang ${garden.plantGrowStage || 'phát triển'} cần điều kiện ổn định`,
              ],

              urgencyLevel: 'HIGH',
              difficultyLevel: 'EASY',
              weatherCondition: WeatherMain.CLEAR,
              temperature: { min: 35, max: 45 },
              icon: 'home-outline',
              priority: 9,
              applicableGardenTypes: ['BALCONY'],

              createdAt: now.toISOString(),
              updatedAt: now.toISOString(),
            });
          }
        }

        // Nhiệt độ 30-35°C - Nóng nhưng có thể kiểm soát
        else if (weather.temp >= 30 && weather.temp < 35) {
          advice.push({
            id: 1003,
            title: `☀️ Chào ${gardenerName}! Hôm nay ${weather.temp}°C - Hãy chăm sóc cây đặc biệt nhé`,
            description: `Nhiệt độ ${weather.temp}°C khá nóng rồi ${gardenerName} ạ! ${garden.plantName ? `Cây ${garden.plantName} ở giai đoạn ${garden.plantGrowStage}` : 'Cây của bạn'} sẽ cần nhiều nước và chăm sóc hơn hôm nay. Cùng tôi chăm sóc thật tốt nhé! 🌱`,

            detailedSteps: [
              `🌅 Tưới nước buổi sáng (6:00-7:30): Tưới sâu ${garden.type === 'BALCONY' ? '0.5-1 lít/chậu' : '2-3 lít/m²'} để cây có đủ nước cả ngày`,
              `👆 Kiểm tra độ ẩm (10:00): Chọc ngón tay xuống đất 3-5cm, nếu khô thì tưới thêm`,
              `🌾 Phủ mulch (10:30): Trải lớp rơm, lá khô dày 3-5cm quanh gốc để giữ ẩm`,
              `☂️ Tạo bóng râm (11:00-15:00): Dùng lưới che 50% hoặc dù che nắng di động`,
              `💦 Tưới bổ sung (17:00-18:00): Tưới nhẹ nếu cây có dấu hiệu héo`,
              `🌃 Kiểm tra tối (19:00): Đảm bảo đất vẫn ẩm, lá cây đã "hồi phục"`,
            ],

            reasons: [
              `🌡️ Nhiệt độ ${weather.temp}°C làm tăng gấp đôi nhu cầu nước của cây`,
              `☀️ Ánh nắng mạnh có thể làm cháy lá non và chồi mới`,
              `💨 Gió ${weather.windSpeed}m/s kết hợp nóng sẽ làm khô đất nhanh hơn`,
              `🌱 ${garden.plantName ? `Cây ${garden.plantName}` : 'Cây'} đang ${garden.plantGrowStage || 'phát triển'} cần điều kiện ổn định`,
            ],

            tips: [
              `💡 Mẹo kiểm tra nhanh: Nếu lá bắt đầu hơi cong về phía trong = cây đang khát nước`,
              `🥤 Dùng gel giữ ẩm: Trộn gel giữ nước vào đất để giữ ẩm lâu hơn`,
              `🌿 Nhóm cây thông minh: Đặt cây cao che cho cây thấp, tạo vi khí hậu mát mẻ`,
              `📊 Theo dõi dữ liệu: ${sensorData.soilMoisture.current ? `Độ ẩm đất hiện tại ${sensorData.soilMoisture.current}% - ${sensorData.soilMoisture.suggestion}` : 'Lắp đặt cảm biến để theo dõi chính xác hơn'}`,
              `🧪 pH đất: ${sensorData.soilPH.current ? `pH hiện tại ${sensorData.soilPH.current} - ${sensorData.soilPH.suggestion}` : 'Kiểm tra pH để đảm bảo cây hấp thụ nước tốt'}`,
            ],

            precautions: [
              `⚠️ Không tưới nước lạnh khi đất đang nóng (tạo sốc nhiệt)`,
              `🚫 Tránh tưới lên lá khi có nắng (lá có thể bị cháy)`,
              `❌ Không bón phân khi cây đang stress nhiệt`,
              `⛔ Tạm hoãn việc cắt tỉa cho đến khi thời tiết mát hơn`,
            ],

            personalizedMessage: `${gardenerName} ơi, với trình độ ${experienceLevel}, bạn chắc chắn làm được việc này thôi! ${garden.plantName ? `Cây ${garden.plantName}` : 'Cây của bạn'} sẽ rất biết ơn sự chăm sóc tỉ mỉ của bạn đấy! 🥰`,

            urgencyLevel: 'HIGH',
            difficultyLevel: 'EASY',
            bestTimeOfDay: '6:00-7:30 và 17:00-18:30',
            duration: '20-30 phút',
            frequency: '2-3 lần/ngày',

            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 30, max: 35 },
            icon: 'sunny-outline',
            priority: 8,
            applicableGardenTypes: [garden.type],
            plantTypes: garden.plantName
              ? [garden.plantName]
              : ['Rau lá', 'Cây gia vị', 'Hoa kiểng'],

            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        }

        // Nhiệt độ 25-30°C - Lý tưởng nhưng cần chú ý
        else if (weather.temp >= 25 && weather.temp < 30) {
          advice.push({
            id: 1004,
            title: `🌤️ ${gardenerName}, thời tiết hôm nay tuyệt vời ${weather.temp}°C!`,
            description: `Chào ${gardenerName}! Hôm nay là ngày tuyệt vời để làm vườn với nhiệt độ ${weather.temp}°C - không quá nóng, không quá lạnh. Đây là thời điểm hoàn hảo để thực hiện nhiều công việc chăm sóc cây! ✨`,

            detailedSteps: [
              `🌅 Buổi sáng (7:00-9:00): Tưới nước bình thường, kiểm tra tổng quan sức khỏe cây`,
              `✂️ Cắt tỉa nhẹ (8:00-10:00): Loại bỏ lá vàng, cành chết, chồi yếu`,
              `🌱 Gieo trồng mới (9:00-11:00): Thời điểm tốt để gieo hạt hoặc trồng cây con`,
              `🥄 Bón phân (10:00): Bón phân hữu cơ hoặc phân NPK loãng`,
              `💦 Tưới chiều (16:00-18:00): Tưới nước nhẹ nếu cần thiết`,
              `📝 Ghi chép (18:00): Ghi lại tình trạng cây, lên kế hoạch cho ngày mai`,
            ],

            reasons: [
              `🌡️ Nhiệt độ ${weather.temp}°C là lý tưởng cho hầu hết các loại cây phát triển`,
              `☀️ Ánh sáng vừa đủ, không quá gắt, cây có thể quang hợp hiệu quả`,
              `💨 Gió ${weather.windSpeed}m/s nhẹ nhàng, giúp thông gió tốt`,
              `🌿 Điều kiện thuận lợi cho cây hấp thụ dinh dưỡng và phát triển`,
            ],

            tips: [
              `💡 Tận dụng thời tiết tốt: Đây là lúc cây hấp thụ phân bón tốt nhất`,
              `🌱 Nhân giống: Thời điểm lý tưởng để cắt tỉa nhân giống, chiết cành`,
              `📊 Dữ liệu cảm biến tốt: ${sensorData.temperature.current ? `Nhiệt độ đất ${sensorData.temperature.current}°C - lý tưởng!` : 'Lắp đặt cảm biến để tối ưu hóa'}`,
              `🎯 Kế hoạch dài hạn: Lên kế hoạch trồng trọt cho mùa tiếp theo`,
              `📚 Học hỏi: Đọc thêm về kỹ thuật chăm sóc ${garden.plantName || 'cây trồng'}`,
            ],

            precautions: [
              `⚠️ Không bón phân quá liều - cây dễ hấp thụ trong thời tiết này`,
              `🚫 Tránh tưới nước quá nhiều - đất ẩm quá dễ sinh bệnh`,
              `✂️ Cắt tỉa vừa phải - không cắt quá nhiều một lúc`,
            ],

            personalizedMessage: `${gardenerName} thân yêu! Hôm nay là cơ hội tuyệt vời để thực hiện những ý tưởng sáng tạo của bạn. Với kinh nghiệm ${experienceLevel}, bạn có thể thử những kỹ thuật mới! 🌟`,

            urgencyLevel: 'MEDIUM',
            difficultyLevel: 'EASY',
            bestTimeOfDay: '7:00-11:00 và 16:00-18:00',
            duration: '60-90 phút',
            frequency: 'Hằng ngày trong thời tiết đẹp',

            weatherCondition: WeatherMain.CLEAR,
            temperature: { min: 25, max: 30 },
            icon: 'partly-sunny-outline',
            priority: 6,
            applicableGardenTypes: [garden.type],

            createdAt: now.toISOString(),
            updatedAt: now.toISOString(),
          });
        }
        break;

      case WeatherMain.RAIN:
        advice.push({
          id: 1005,
          title: `🌧️ ${gardenerName} ơi, trời mưa to rồi! Hãy bảo vệ vườn và tận dụng nước mưa nhé`,
          description: `Chào ${gardenerName}! Trời đang mưa với cường độ ${weather.rain1h || 'vừa phải'}mm/h. Đây vừa là thách thức vừa là cơ hội tuyệt vời! Mưa tốt cho cây nhưng chúng ta cần bảo vệ chúng khỏi mưa quá lớn. 🌦️`,

          detailedSteps: [
            `🏃‍♂️ Ngay lập tức: Di chuyển ${garden.type === 'BALCONY' ? 'chậu cây nhỏ vào góc khuất gió' : 'cây con, cây yếu vào nơi che mưa'}`,
            `🪣 Hứng nước mưa: Đặt thùng, chậu, xô để hứng nước mưa sạch (nước mưa tốt hơn nước máy!)`,
            `🕳️ Kiểm tra thoát nước: Đảm bảo ${garden.type === 'BALCONY' ? 'lỗ thoát nước chậu không bị tắc' : 'rãnh thoát nước vườn thông thoáng'}`,
            `🛡️ Che phủ cây non: Dùng nylon trong suốt hoặc tấm nhựa che cây mới trồng, cây yếu`,
            `🌳 Cố định cây cao: Buộc chống hoặc cài cọc cho cây cao, cây leo tránh gãy đổ`,
            `📱 Theo dõi: Kiểm tra dự báo thời tiết để chuẩn bị cho những ngày tiếp theo`,
          ],

          reasons: [
            `💧 Nước mưa chứa nitơ tự nhiên, rất tốt cho cây (tốt hơn nước máy 10 lần!)`,
            `⚡ Mưa to có thể gây úng rễ, làm cây bị thối rễ trong vài ngày`,
            `💨 Gió mưa ${weather.windSpeed}m/s có thể làm gãy cành, lật chậu`,
            `🦠 Môi trường ẩm ướt dễ phát sinh nấm bệnh hại cây`,
          ],

          tips: [
            `💡 Kho báu nước mưa: 1 lít nước mưa = 1 lít nước máy + phân đạm tự nhiên!`,
            `🏺 Dự trữ thông minh: Để nước mưa lắng 1-2 ngày rồi dùng, hiệu quả hơn`,
            `🌱 Lợi thế ${garden.type}: ${garden.type === 'BALCONY' ? 'Ban công có thể kiểm soát lượng nước dễ dàng' : garden.type === 'OUTDOOR' ? 'Vườn ngoài trời nhận đủ nước tự nhiên' : 'Có thể điều chỉnh ánh sáng và nước linh hoạt'}`,
            `📊 Theo dõi độ ẩm: ${sensorData.soilMoisture.current ? `Độ ẩm đất hiện tại ${sensorData.soilMoisture.current}% - cao hơn bình thường` : 'Đất sẽ rất ẩm, không cần tưới thêm vài ngày'}`,
            `🎯 Kế hoạch sau mưa: Chuẩn bị thuốc phòng nấm để xử lý sau khi hết mưa`,
          ],

          precautions: [
            `⚠️ NGƯNG tưới nước hoàn toàn trong thời gian mưa`,
            `🚫 KHÔNG bón phân - mưa sẽ rửa trôi hết`,
            `❌ TRÁNH dẫm lên đất ướt - làm chặt đất, khó thoát nước`,
            `⛔ KHÔNG cắt tỉa khi ẩm ướt - dễ nhiễm bệnh`,
            `🔍 CHÚ Ý: Nếu mưa kéo dài >3 ngày, kiểm tra dấu hiệu thối rễ`,
          ],

          personalizedMessage: `${gardenerName}, đây là cơ hội tuyệt vời để nghỉ ngơi và quan sát vườn từ xa! ${garden.plantName ? `Cây ${garden.plantName}` : 'Cây của bạn'} sẽ rất thích nước mưa này đấy. Hãy tận dụng thời gian này để lên kế hoạch chăm sóc sau mưa nhé! ☔`,

          urgencyLevel: 'MEDIUM',
          difficultyLevel: 'EASY',
          duration: '30-45 phút setup ban đầu',
          frequency: 'Một lần khi bắt đầu mưa',

          weatherCondition: WeatherMain.RAIN,
          icon: 'rainy-outline',
          priority: 7,
          applicableGardenTypes: [garden.type],

          createdAt: now.toISOString(),
          updatedAt: now.toISOString(),
        });
        break;

      // Tiếp tục với các case khác...
    }

    return advice;
  }

  /*
   * 🌱 Lời khuyên dựa trên giai đoạn phát triển của cây
   */
  private generatePlantStageAdvice(
    weather: WeatherObservation,
    plantName: string,
    growthStage: string,
    plantStartDate: Date | null,
    sensorData: any,
    gardenerName: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();
    const daysFromPlanting = plantStartDate
      ? Math.floor(
          (now.getTime() - plantStartDate.getTime()) / (1000 * 60 * 60 * 24),
        )
      : 0;

    advice.push({
      id: 2001,
      title: `🌿 Chăm sóc cây ${plantName} giai đoạn ${growthStage} (ngày thứ ${daysFromPlanting})`,
      description: `Chào ${gardenerName}! Cây ${plantName} của bạn đang ở giai đoạn ${growthStage}, đã trồng được ${daysFromPlanting} ngày. Với thời tiết hiện tại ${weather.temp}°C, đây là những điều cần chú ý đặc biệt!`,

      detailedSteps: this.getPlantStageSpecificSteps(
        plantName,
        growthStage,
        weather,
        daysFromPlanting,
      ),

      reasons: [
        `🌱 Giai đoạn ${growthStage} là thời kỳ ${this.getStageDescription(growthStage)} của cây`,
        `🌡️ Nhiệt độ ${weather.temp}°C ${this.getTemperatureImpact(weather.temp, growthStage)}`,
        `💧 Nhu cầu nước ở giai đoạn này ${this.getWaterRequirement(growthStage)}`,
        `🌞 Ánh sáng ${this.getLightRequirement(growthStage, weather.weatherMain)}`,
      ],

      applicableGardenTypes: [],
      tips: this.getPlantSpecificTips(plantName, growthStage, weather),

      precautions: this.getPlantSpecificPrecautions(
        plantName,
        growthStage,
        weather,
      ),

      personalizedMessage: `${gardenerName}, cây ${plantName} của bạn đang phát triển rất tốt! Ở giai đoạn ${growthStage}, cây cần sự chăm sóc đặc biệt. Bạn đang làm rất tốt rồi! 🌟`,

      urgencyLevel: 'MEDIUM',
      difficultyLevel: 'EASY',
      weatherCondition: weather.weatherMain,
      temperature: { min: weather.temp - 2, max: weather.temp + 2 },
      icon: 'leaf-outline',
      priority: 7,
      plantTypes: [plantName],

      createdAt: now.toISOString(),
      updatedAt: now.toISOString(),
    });

    return advice;
  }

  /*
   * 📊 Lời khuyên dựa trên dữ liệu cảm biến
   */
  private generateSensorBasedAdvice(
    sensorData: any,
    weather: WeatherObservation,
    gardenType: GardenType,
    gardenerName: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();

    // Lời khuyên về độ ẩm đất
    if (!sensorData.soilMoisture.isOptimal) {
      advice.push({
        id: 3001,
        title: `💧 ${gardenerName}, độ ẩm đất cần điều chỉnh! (${sensorData.soilMoisture.current}%)`,
        description: `Cảm biến đo được độ ẩm đất ${sensorData.soilMoisture.current}% - ${sensorData.soilMoisture.current < 40 ? 'hơi khô' : 'hơi ướt'} so với mức lý tưởng 40-70%. Với thời tiết ${weather.temp}°C, chúng ta cần điều chỉnh ngay!`,

        detailedSteps:
          sensorData.soilMoisture.current < 40
            ? [
                `🚰 Tưới nước ngay: ${gardenType === 'BALCONY' ? '0.5-1 lít/chậu' : '1-2 lít/m²'} từ từ`,
                `⏰ Chờ 30 phút: Để nước ngấm đều`,
                `👆 Kiểm tra lại: Chọc tay xuống đất 5cm`,
                `🔄 Lặp lại nếu cần: Tưới thêm 50% lượng nước nếu vẫn khô`,
                `📊 Theo dõi: Kiểm tra cảm biến sau 1 giờ`,
              ]
            : [
                `⏸️ NGƯNG tưới nước ngay lập tức`,
                `🌬️ Tăng thông gió: Mở cửa, dùng quạt nếu trong nhà`,
                `🕳️ Kiểm tra thoát nước: Đảm bảo lỗ thoát không bị tắc`,
                `☀️ Đưa ra nắng nhẹ: Nếu có thể, để cây ra nơi có gió nhẹ`,
                `⏳ Chờ đợi: Để đất khô tự nhiên trước khi tưới lại`,
              ],
        reasons: [
          `Độ ẩm đất ${sensorData.soilMoisture.current}% hiện tại ${sensorData.soilMoisture.isOptimal ? 'đang ở mức tốt' : 'không tối ưu'} cho cây trồng.`,
          `Thời tiết hiện tại (${weather.weatherDesc}, ${weather.temp}°C) có thể ảnh hưởng đến tốc độ bay hơi nước của đất.`,
        ],
        tips: [
          `📱 Theo dõi real-time: Độ ẩm lý tưởng cho hầu hết cây là 50-65%`,
          `🌡️ Kết hợp nhiệt độ: Khi ${weather.temp}°C, cây cần ${weather.temp > 30 ? 'nhiều' : 'ít'} nước hơn`,
          `🕐 Thời gian tốt nhất: Tưới vào lúc 6h-7h sáng hoặc 17h-18h chiều`,
          `🧪 Kiểm tra pH: Độ ẩm cao + pH không phù hợp = rễ dễ thối`,
        ],

        personalizedMessage: `${gardenerName} ơi, cảm biến thông minh này giúp chúng ta biết chính xác cây cần gì! Đây là lợi thế lớn so với việc đoán mò. Hãy tin tưởng vào dữ liệu và kinh nghiệm của bạn! 📊✨`,

        urgencyLevel:
          sensorData.soilMoisture.current < 30 ||
          sensorData.soilMoisture.current > 80
            ? 'HIGH'
            : 'MEDIUM',
        difficultyLevel: 'EASY',
        weatherCondition: weather.weatherMain,
        icon: 'water-outline',
        priority: 8,
        applicableGardenTypes: [gardenType],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    // Lời khuyên về pH đất
    if (!sensorData.soilPH.isOptimal) {
      advice.push({
        id: 3002,
        title: `🧪 ${gardenerName}, pH đất cần điều chỉnh! (pH ${sensorData.soilPH.current})`,
        description: `pH đất hiện tại là ${sensorData.soilPH.current}, ${sensorData.soilPH.current < 6 ? 'hơi chua' : 'hơi kiềm'} so với mức lý tưởng 6.0-7.0. Điều này ảnh hưởng đến khả năng hấp thụ dinh dưỡng của cây!`,

        detailedSteps:
          sensorData.soilPH.current < 6
            ? [
                `🦴 Bổ sung vôi: Rắc vôi bột mịn 10-20g/m² lên đất`,
                `🥚 Vỏ trứng nghiền: Trộn vỏ trứng nghiền nhỏ vào đất`,
                `🌿 Tro cây: Dùng tro cây cháy rải đều (5-10g/m²)`,
                `💧 Tưới nước: Tưới nước để hòa tan chậm`,
                `⏰ Chờ 1 tuần: Kiểm tra lại pH sau 7 ngày`,
              ]
            : [
                `🍃 Phân hữu cơ chua: Bón phân xanh, phân chuồi ủ kỹ`,
                `🌰 Mùn cưa: Trộn mùn cưa hoặc lá thông vào đất`,
                `🧄 Giấm loãng: Tưới nước pha giấm trắng (1:100) mỗi tuần 1 lần`,
                `☕ Bã cà phê: Trộn bã cà phê khô vào đất`,
                `📏 Theo dõi: Kiểm tra pH mỗi tuần cho đến khi đạt 6.0-7.0`,
              ],
        reasons: [
          `pH đất ${sensorData.soilPH.current} hiện tại ${sensorData.soilPH.isOptimal ? 'đang ở mức tốt' : 'không tối ưu'}, ảnh hưởng đến khả năng hấp thụ dinh dưỡng.`,
          `Duy trì pH đất trong khoảng 6.0-7.0 là quan trọng cho hầu hết các loại cây.`,
        ],
        tips: [
          `Kiểm tra pH đất định kỳ, đặc biệt sau khi bón phân hoặc thay đổi giá thể.`,
          `Sử dụng bộ test pH đáng tin cậy để có kết quả chính xác.`,
        ],
        personalizedMessage: `${gardenerName}, pH đất là "chìa khóa vàng" giúp cây hấp thụ dinh dưỡng hiệu quả! Điều chỉnh pH đúng cách sẽ giúp cây khỏe mạnh gấp nhiều lần! 🗝️🌱`,

        urgencyLevel: 'MEDIUM',
        difficultyLevel: 'MEDIUM',
        duration: '30-45 phút',
        frequency: 'Kiểm tra và điều chỉnh mỗi tuần',

        weatherCondition: weather.weatherMain,
        icon: 'flask-outline',
        priority: 6,
        applicableGardenTypes: [gardenType],
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return advice;
  }

  /*
   * 🗓️ Lời khuyên dựa trên lịch trình và công việc
   */
  private generateScheduleBasedAdvice(
    tasks: any[],
    wateringSchedule: any[],
    weather: WeatherObservation,
    gardenerName: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();

    // Lời khuyên về công việc sắp đến hạn
    const upcomingTasks = tasks.filter((task) => {
      const dueDate = new Date(task.dueDate);
      const timeDiff = dueDate.getTime() - now.getTime();
      return timeDiff > 0 && timeDiff <= 24 * 60 * 60 * 1000; // 24 giờ tới
    });

    if (upcomingTasks.length > 0) {
      advice.push({
        id: 4001,
        title: `📅 ${gardenerName}, bạn có ${upcomingTasks.length} công việc cần làm trong 24h tới!`,
        description: `Thời tiết hiện tại ${weather.temp}°C ${weather.weatherDesc} khá ${this.getWeatherSuitability(weather.weatherMain)} để thực hiện các công việc trong vườn. Hãy cùng xem lại danh sách nhé!`,

        detailedSteps: upcomingTasks.map((task, index) => {
          const dueDate = new Date(task.dueDate);
          const hoursLeft = Math.ceil(
            (dueDate.getTime() - now.getTime()) / (1000 * 60 * 60),
          );
          return `${index + 1}. ${task.type} ${task.plantTypeName ? `cho ${task.plantTypeName}` : ''} - còn ${hoursLeft} giờ (${task.description})`;
        }),
        reasons: [
          `Hoàn thành công việc đúng hạn giúp duy trì sức khỏe và năng suất của vườn.`,
          `Thời tiết hiện tại ${this.getWeatherSuitability(weather.weatherMain)} để thực hiện công việc.`,
        ],
        tips: [
          `⏰ Ưu tiên thời gian: Làm công việc quan trọng vào ${this.getBestTimeForWeather(weather.weatherMain)}`,
          `🌡️ Phù hợp thời tiết: ${this.getWeatherTaskAdvice(weather.weatherMain, weather.temp)}`,
          `📋 Checklist: Chuẩn bị dụng cụ trước để tiết kiệm thời gian`,
          `📱 Cập nhật: Đánh dấu hoàn thành ngay sau khi làm xong`,
        ],

        personalizedMessage: `${gardenerName}, bạn quản lý thời gian rất tốt! Việc có kế hoạch rõ ràng như thế này sẽ giúp vườn phát triển tuyệt vời. Cứ từng bước một nhé! 🎯`,

        urgencyLevel: 'HIGH',
        difficultyLevel: 'EASY',
        weatherCondition: weather.weatherMain,
        icon: 'calendar-outline',
        priority: 9,
        applicableGardenTypes: [], // Consider adding gardenType if relevant for tasks
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return advice;
  }

  /*
   * 🏆 Lời khuyên dựa trên kinh nghiệm và hoạt động
   */
  private generateExperienceBasedAdvice(
    experienceLevel: any,
    recentActivities: any[],
    weather: WeatherObservation,
    gardenerName: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();

    // Phân tích hoạt động gần đây
    const lastActivity = recentActivities[0];
    const activityPattern = this.analyzeActivityPattern(recentActivities);

    if (experienceLevel.level <= 2) {
      // Người mới bắt đầu
      advice.push({
        id: 5001,
        title: `🌟 ${gardenerName}, tips đặc biệt cho ${experienceLevel.title}!`,
        description: `Chào ${experienceLevel.title} ${gardenerName}! Tôi thấy bạn ${lastActivity ? `vừa ${lastActivity.name} ${this.getTimeAgo(lastActivity.timestamp)}` : 'đang bắt đầu hành trình làm vườn'}. Đây là những mẹo đặc biệt cho bạn!`,

        detailedSteps: [
          `📚 Học từ cơ bản: ${this.getBasicAdviceForWeather(weather.weatherMain)}`,
          `👀 Quan sát mỗi ngày: Nhìn lá cây để biết cây cần gì`,
          `📝 Ghi chép đơn giản: Ngày tưới nước, ngày bón phân`,
          `🤝 Kết nối cộng đồng: Chia sẻ ảnh và hỏi đáp với người có kinh nghiệm`,
          `🎯 Bắt đầu nhỏ: Tập trung chăm sóc tốt 1-2 loại cây trước`,
        ],
        reasons: [
          `Xây dựng kiến thức và kỹ năng cơ bản là nền tảng quan trọng cho người mới làm vườn.`,
          `Thời tiết hiện tại là cơ hội tốt để học hỏi và thực hành.`,
        ],
        tips: [
          `💡 Mẹo cho người mới: ${this.getBeginnerTips(weather.weatherMain)}`,
          `📖 Tài liệu hữu ích: Đọc về ${this.getRecommendedTopics(experienceLevel.level)}`,
          `🏅 Mục tiêu nhỏ: Mỗi tuần học 1 kỹ thuật mới`,
          `💪 Động lực: Bạn đã tích lũy được ${experienceLevel.level} điểm kinh nghiệm rồi!`,
        ],

        personalizedMessage: `${gardenerName}, mọi chuyên gia đều bắt đầu từ con số 0! Bạn đang làm rất tốt rồi. Hãy kiên nhẫn và tận hưởng từng khoảnh khắc chăm sóc cây nhé! 🌱💚`,

        urgencyLevel: 'LOW',
        difficultyLevel: 'EASY',
        weatherCondition: weather.weatherMain,
        icon: 'school-outline',
        priority: 4,
        applicableGardenTypes: [], // Consider gardenType if advice varies
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    } else if (experienceLevel.level >= 5) {
      // Người có kinh nghiệm
      advice.push({
        id: 5002,
        title: `🏆 ${gardenerName} - Thử thách mới cho ${experienceLevel.title}!`,
        description: `Xin chào ${experienceLevel.title} ${gardenerName}! Với ${experienceLevel.level} điểm kinh nghiệm, bạn đã rất giỏi! Đây là những thử thách nâng cao phù hợp với thời tiết hiện tại.`,

        detailedSteps: [
          `🧪 Thí nghiệm nâng cao: ${this.getAdvancedExperiments(weather.weatherMain)}`,
          `📊 Phân tích dữ liệu: Tối ưu hóa dựa trên dữ liệu cảm biến`,
          `🌱 Nhân giống: Thử kỹ thuật chiết cành, ghép cây`,
          `💡 Đổi mới: Thử phương pháp trồng mới (thủy canh, khí canh)`,
          `👨‍🏫 Chia sẻ kiến thức: Hướng dẫn người mới trong cộng đồng`,
        ],
        reasons: [
          `Thử thách bản thân với các kỹ thuật nâng cao giúp phát triển kỹ năng làm vườn.`,
          `Chia sẻ kiến thức giúp cộng đồng làm vườn phát triển.`,
        ],
        tips: [
          // Added tips for advanced users
          `Tham gia các workshop hoặc khóa học chuyên sâu.`,
          `Thử nghiệm với các giống cây trồng mới hoặc hiếm.`,
          `Thiết kế và xây dựng các hệ thống vườn thông minh.`,
        ],
        personalizedMessage: `${gardenerName}, bạn đã trở thành một ${experienceLevel.title} thực thụ! Hãy tiếp tục thử nghiệm và chia sẻ kiến thức với cộng đồng. Bạn có thể truyền cảm hứng cho nhiều người! 🌟`,

        urgencyLevel: 'LOW',
        difficultyLevel: 'HARD',
        weatherCondition: weather.weatherMain,
        icon: 'trophy-outline',
        priority: 3,
        applicableGardenTypes: [], // Consider gardenType
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return advice;
  }

  /*
   * ⚠️ Lời khuyên dựa trên cảnh báo hiện tại
   */
  private generateAlertBasedAdvice(
    alerts: any[],
    weather: WeatherObservation,
    gardenerName: string,
  ): WeatherAdviceDto[] {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();

    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === 'CRITICAL',
    );
    const highAlerts = alerts.filter((alert) => alert.severity === 'HIGH');

    if (criticalAlerts.length > 0) {
      advice.push({
        id: 6001,
        title: `🚨 ${gardenerName}, có ${criticalAlerts.length} cảnh báo KHẨN CẤP cần xử lý ngay!`,
        description: `Chào ${gardenerName}! Hệ thống phát hiện ${criticalAlerts.length} vấn đề nghiêm trọng cần xử lý ngay lập tức. Với thời tiết hiện tại, việc xử lý càng cấp bách!`,

        detailedSteps: criticalAlerts.map(
          (alert, index) =>
            `${index + 1}. ${alert.type}: ${alert.message} - ${alert.suggestion || 'Cần xử lý ngay'}`,
        ),
        reasons: criticalAlerts.map(
          (alert) =>
            `${alert.type}: ${alert.message} - Yêu cầu hành động ngay để tránh thiệt hại nghiêm trọng.`,
        ),
        tips: [
          `⚡ Hành động ngay: Xử lý cảnh báo CRITICAL trước tiên`,
          `📞 Nhờ trợ giúp: Nếu không chắc chắn, hỏi người có kinh nghiệm`,
          `📱 Cập nhật: Báo cáo kết quả xử lý trong ứng dụng`,
          `🔄 Theo dõi: Kiểm tra lại sau khi xử lý để đảm bảo hiệu quả`,
        ],

        personalizedMessage: `${gardenerName}, đừng lo lắng! Mọi vấn đề đều có cách giải quyết. Hãy bình tĩnh xử lý từng bước một. Tôi tin bạn sẽ làm được! 💪`,

        urgencyLevel: 'CRITICAL',
        difficultyLevel: 'MEDIUM',
        weatherCondition: weather.weatherMain,
        icon: 'alert-circle-outline',
        priority: 10,
        applicableGardenTypes: [], // Consider gardenType
        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return advice;
  }

  /*
   * 🌤️ Lời khuyên dựa trên dự báo thời tiết
   */
  private async generateForecastAdvice(
    gardenId: number,
    gardenType: GardenType,
    gardenerName: string,
  ): Promise<WeatherAdviceDto[]> {
    const advice: WeatherAdviceDto[] = [];
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    const dayAfterTomorrow = new Date(now.getTime() + 48 * 60 * 60 * 1000);
    // Lấy dự báo 3 ngày tới
    const forecasts = await this.prisma.dailyForecast.findMany({
      where: {
        gardenId,
        forecastFor: {
          gte: tomorrow,
          lte: dayAfterTomorrow,
        },
      },
      orderBy: { forecastFor: 'asc' },
    });

    if (forecasts.length > 0) {
      const forecast = forecasts[0]; // Ngày mai

      advice.push({
        id: 7001,
        title: `🔮 ${gardenerName}, dự báo ngày mai: ${forecast.weatherDesc} ${forecast.tempMax}°C/${forecast.tempMin}°C`,
        description: `Chào ${gardenerName}! Ngày mai sẽ có ${forecast.weatherDesc} với nhiệt độ từ ${forecast.tempMin}°C đến ${forecast.tempMax}°C. ${forecast.pop > 0.5 ? `Khả năng mưa ${Math.round(forecast.pop * 100)}%` : 'Trời khô ráo'}. Hãy chuẩn bị từ hôm nay!`,

        detailedSteps: this.getForecastPreparationSteps(forecast, gardenType),

        reasons: [
          `🌡️ Chênh lệch nhiệt độ ${forecast.tempMax - forecast.tempMin}°C - ${this.getTemperatureVariationAdvice(forecast.tempMax - forecast.tempMin)}`,
          `💧 Khả năng mưa ${Math.round(forecast.pop * 100)}% - ${this.getRainProbabilityAdvice(forecast.pop)}`,
          `💨 Gió ${forecast.windSpeed}m/s - ${this.getWindAdvice(forecast.windSpeed)}`,
          `☁️ Độ che phủ ${forecast.clouds}% - ${this.getCloudCoverAdvice(forecast.clouds)}`,
        ],

        tips: [
          `💡 Chuẩn bị từ hôm nay: ${this.getTomorrowPreparationTips(forecast.weatherMain)}`,
          `⏰ Thời gian tốt nhất: ${this.getBestTimingForForecast(forecast)}`,
          `🎯 Kế hoạch thông minh: ${this.getSmartPlanningTips(forecast, gardenType)}`,
          `📊 Tối ưu hóa: Dự báo giúp bạn lên kế hoạch chăm sóc hiệu quả hơn 50%`,
        ],

        personalizedMessage: `${gardenerName}, việc dự đoán trước thời tiết là dấu hiệu của một người làm vườn thông minh! Bạn đang phát triển tư duy chiến lược rất tốt đấy! 🧠✨`,

        urgencyLevel:
          forecast.weatherMain === WeatherMain.THUNDERSTORM ? 'HIGH' : 'MEDIUM',
        difficultyLevel: 'EASY',
        bestTimeOfDay: 'Chuẩn bị hôm nay, thực hiện sáng mai',
        duration: '20-30 phút chuẩn bị',
        frequency: 'Hằng ngày theo dõi dự báo',

        weatherCondition: forecast.weatherMain,
        temperature: { min: forecast.tempMin, max: forecast.tempMax },
        icon: 'telescope-outline',
        priority: 5,
        applicableGardenTypes: [gardenType],

        createdAt: now.toISOString(),
        updatedAt: now.toISOString(),
      });
    }

    return advice;
  }

  /*
   * 🎯 Sắp xếp và cá nhân hóa lời khuyên theo mức độ kinh nghiệm
   */
  private prioritizeAndPersonalizeAdvice(
    advice: WeatherAdviceDto[],
    experienceLevel: number,
  ): WeatherAdviceDto[] {
    return advice
      .filter((item) => {
        // Lọc theo độ khó phù hợp với trình độ
        if (experienceLevel <= 2 && item.difficultyLevel === 'HARD')
          return false;
        if (
          experienceLevel >= 5 &&
          item.difficultyLevel === 'EASY' &&
          item.urgencyLevel === 'LOW'
        )
          return false;
        return true;
      })
      .sort((a, b) => {
        // Sắp xếp theo độ ưu tiên
        const urgencyOrder = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        const urgencyDiff =
          urgencyOrder[b.urgencyLevel] - urgencyOrder[a.urgencyLevel];
        if (urgencyDiff !== 0) return urgencyDiff;

        return b.priority - a.priority;
      })
      .slice(0, 8); // Giới hạn 8 lời khuyên để không làm người dùng choáng ngợp
  }

  // =================== HELPER METHODS ===================

  private getTimeOfDay(): string {
    const hour = new Date().getHours();
    if (hour < 6) return 'late_night';
    if (hour < 12) return 'morning';
    if (hour < 18) return 'afternoon';
    return 'evening';
  }

  private calculateTrend(sensorData: any[]): 'RISING' | 'FALLING' | 'STABLE' {
    if (sensorData.length < 3) return 'STABLE';

    const recent = sensorData.slice(0, Math.ceil(sensorData.length / 3));
    const older = sensorData.slice(-Math.ceil(sensorData.length / 3));

    const recentAvg =
      recent.reduce((sum, data) => sum + data.value, 0) / recent.length;
    const olderAvg =
      older.reduce((sum, data) => sum + data.value, 0) / older.length;

    const change = ((recentAvg - olderAvg) / olderAvg) * 100;

    if (change > 5) return 'RISING';
    if (change < -5) return 'FALLING';
    return 'STABLE';
  }

  private getSoilMoistureSuggestion(value: number, trend: string): string {
    if (value < 30)
      return `Đất quá khô! ${trend === 'FALLING' ? 'Và đang tiếp tục khô đi' : ''}`;
    if (value < 40)
      return `Đất hơi khô, cần tưới nước ${trend === 'FALLING' ? 'ngay' : 'sớm'}`;
    if (value > 80)
      return `Đất quá ướt! ${trend === 'RISING' ? 'Và đang ngày càng ướt hơn' : 'Cần thoát nước'}`;
    if (value > 70)
      return `Đất hơi ướt, ${trend === 'RISING' ? 'cần dừng tưới' : 'theo dõi thêm'}`;
    return `Độ ẩm tốt! ${trend === 'STABLE' ? 'Duy trì như vậy' : `Đang ${trend === 'RISING' ? 'tăng' : 'giảm'} nhẹ`}`;
  }

  private getSoilPHSuggestion(value: number, trend: string): string {
    if (value < 5.5)
      return `Đất quá chua! ${trend === 'FALLING' ? 'Đang ngày càng chua hơn' : ''}`;
    if (value < 6.0)
      return `Đất hơi chua, ${trend === 'FALLING' ? 'cần bổ sung vôi ngay' : 'theo dõi thêm'}`;
    if (value > 7.5)
      return `Đất quá kiềm! ${trend === 'RISING' ? 'Đang ngày càng kiềm hơn' : ''}`;
    if (value > 7.0)
      return `Đất hơi kiềm, ${trend === 'RISING' ? 'cần bổ sung chất chua' : 'vẫn chấp nhận được'}`;
    return `pH tuyệt vời! ${trend === 'STABLE' ? 'Duy trì như vậy' : `Đang ${trend === 'RISING' ? 'tăng' : 'giảm'} nhẹ`}`;
  }

  private getTemperatureSuggestion(value: number, trend: string): string {
    if (value < 15)
      return `Quá lạnh cho cây! ${trend === 'FALLING' ? 'Đang giảm thêm' : ''}`;
    if (value > 35)
      return `Quá nóng cho cây! ${trend === 'RISING' ? 'Đang tăng thêm' : ''}`;
    return `Nhiệt độ ${value}°C ${value >= 20 && value <= 30 ? 'rất tốt' : 'chấp nhận được'}!`;
  }

  private getHumiditySuggestion(value: number, trend: string): string {
    if (value < 40)
      return `Không khí quá khô! ${trend === 'FALLING' ? 'Đang giảm thêm' : ''}`;
    if (value > 85)
      return `Không khí quá ẩm! ${trend === 'RISING' ? 'Đang tăng thêm' : ''}`;
    return `Độ ẩm không khí ${value >= 60 && value <= 80 ? 'lý tưởng' : 'chấp nhận được'}!`;
  }

  private getLightSuggestion(value: number, trend: string): string {
    if (value < 500)
      return `Quá tối! ${trend === 'FALLING' ? 'Đang tối dần' : 'Cần bổ sung ánh sáng'}`;
    if (value > 70000)
      return `Quá chói! ${trend === 'RISING' ? 'Đang sáng dần' : 'Cần che bớt'}`;
    return `Ánh sáng ${value >= 1000 && value <= 50000 ? 'tuyệt vời' : 'chấp nhận được'}!`;
  }

  private getPlantStageSpecificSteps(
    plantName: string,
    growthStage: string,
    weather: WeatherObservation,
    daysFromPlanting: number,
  ): string[] {
    const baseSteps = [
      `🌱 Kiểm tra tình trạng: Quan sát lá, thân, rễ của cây ${plantName}`,
      `💧 Tưới nước phù hợp: ${this.getWateringAdviceForStage(growthStage, weather.temp)}`,
      `🌞 Điều chỉnh ánh sáng: ${this.getLightAdviceForStage(growthStage, weather.weatherMain)}`,
      `🥄 Dinh dưỡng: ${this.getNutritionAdviceForStage(growthStage, daysFromPlanting)}`,
    ];

    // Thêm bước đặc biệt theo giai đoạn
    if (growthStage.includes('mầm') || growthStage.includes('nảy mầm')) {
      baseSteps.push(
        `🔍 Chăm sóc đặc biệt: Giữ ẩm đều, tránh ánh sáng trực tiếp mạnh`,
      );
    } else if (
      growthStage.includes('lá') ||
      growthStage.includes('sinh trưởng')
    ) {
      baseSteps.push(
        `✂️ Tỉa cành: Loại bỏ lá vàng, chồi yếu để tập trung dinh dưỡng`,
      );
    } else if (
      growthStage.includes('ra hoa') ||
      growthStage.includes('đậu trái')
    ) {
      baseSteps.push(
        `🐝 Hỗ trợ thụ phân: Thu hút côn trùng có ích, tránh stress cho cây`,
      );
    }

    return baseSteps;
  }

  private getStageDescription(growthStage: string): string {
    if (growthStage.includes('mầm')) return 'nảy mầm và hình thành rễ';
    if (growthStage.includes('lá')) return 'phát triển lá và thân';
    if (growthStage.includes('hoa')) return 'ra hoa và chuẩn bị sinh sản';
    if (growthStage.includes('trái')) return 'đậu trái và chín';
    return 'phát triển tổng thể';
  }

  private getTemperatureImpact(temp: number, stage: string): string {
    if (temp < 15) return 'có thể làm chậm quá trình phát triển';
    if (temp > 35) return 'có thể gây stress và ảnh hưởng đến sinh trưởng';
    if (temp >= 20 && temp <= 30) return 'rất lý tưởng cho giai đoạn này';
    return 'chấp nhận được cho sự phát triển';
  }

  private getWaterRequirement(stage: string): string {
    if (stage.includes('mầm')) return 'rất cao và đều đặn (đất luôn ẩm)';
    if (stage.includes('lá')) return 'cao và ổn định';
    if (stage.includes('hoa')) return 'vừa phải, tránh quá ướt';
    if (stage.includes('trái')) return 'cao nhưng không được úng';
    return 'cần điều chỉnh theo từng giai đoạn';
  }

  private getLightRequirement(stage: string, weatherMain: WeatherMain): string {
    const lightNeeds = stage.includes('mầm')
      ? 'ánh sáng nhẹ nhàng'
      : stage.includes('lá')
        ? 'ánh sáng mạnh để quang hợp'
        : stage.includes('hoa')
          ? 'ánh sáng đầy đủ cho ra hoa'
          : 'ánh sáng phù hợp';

    const weatherCondition =
      weatherMain === WeatherMain.CLEAR
        ? 'có thể quá mạnh, cần che bớt'
        : weatherMain === WeatherMain.CLOUDS
          ? 'vừa phải, rất tốt'
          : weatherMain === WeatherMain.RAIN
            ? 'bị hạn chế, cần bổ sung'
            : 'cần theo dõi';

    return `cần ${lightNeeds}, hôm nay ${weatherCondition}`;
  }

  private getPlantSpecificTips(
    plantName: string,
    stage: string,
    weather: WeatherObservation,
  ): string[] {
    const tips = [
      `🌿 Đặc điểm ${plantName}: ${this.getPlantCharacteristics(plantName)}`,
      `📏 Giai đoạn ${stage}: ${this.getStageSpecificTips(stage)}`,
      `🌡️ Với thời tiết ${weather.temp}°C: ${this.getWeatherSpecificTips(weather.weatherMain, weather.temp)}`,
    ];

    // Thêm tips đặc biệt cho từng loại cây
    const plantSpecificAdvice = this.getPlantTypeAdvice(plantName);
    if (plantSpecificAdvice) {
      tips.push(`💡 Mẹo đặc biệt: ${plantSpecificAdvice}`);
    }

    return tips;
  }

  private getPlantSpecificPrecautions(
    plantName: string,
    stage: string,
    weather: WeatherObservation,
  ): string[] {
    return [
      `⚠️ Tránh: ${this.getPlantSpecificThingsToAvoid(plantName, stage)}`,
      `🚫 Không nên: ${this.getWeatherSpecificPrecautions(weather.weatherMain)}`,
      `❌ Cảnh báo: ${this.getStageSpecificPrecautions(stage)}`,
    ];
  }

  private getWeatherSuitability(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        return 'thuận lợi';
      case WeatherMain.CLOUDS:
        return 'tốt';
      case WeatherMain.RAIN:
        return 'hạn chế';
      case WeatherMain.THUNDERSTORM:
        return 'không phù hợp';
      default:
        return 'cần thận trọng';
    }
  }

  private getBestTimeForWeather(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        return 'sáng sớm (6-8h) hoặc chiều mát (16-18h)';
      case WeatherMain.CLOUDS:
        return 'bất kỳ lúc nào trong ngày';
      case WeatherMain.RAIN:
        return 'trước hoặc sau cơn mưa';
      default:
        return 'khi thời tiết ổn định';
    }
  }

  private getWeatherTaskAdvice(weatherMain: WeatherMain, temp: number): string {
    if (weatherMain === WeatherMain.RAIN)
      return 'Hoãn công việc ngoài trời, tập trung việc trong nhà';
    if (temp > 35) return 'Làm việc vào sáng sớm hoặc chiều tối';
    if (temp < 10) return 'Giữ ấm và làm việc trong thời gian ngắn';
    return 'Thời tiết thuận lợi cho mọi công việc';
  }

  private getTimeAgo(timestamp: Date): string {
    const now = new Date();
    const diff = now.getTime() - new Date(timestamp).getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const days = Math.floor(hours / 24);

    if (days > 0) return `${days} ngày trước`;
    if (hours > 0) return `${hours} giờ trước`;
    return 'vừa xong';
  }

  private analyzeActivityPattern(activities: any[]): any {
    // Phân tích pattern hoạt động của người dùng
    const activityCounts = activities.reduce((acc, activity) => {
      acc[activity.activityType] = (acc[activity.activityType] || 0) + 1;
      return acc;
    }, {});

    return {
      mostFrequent: Object.keys(activityCounts).reduce(
        (a, b) => (activityCounts[a] > activityCounts[b] ? a : b),
        Object.keys(activityCounts)[0],
      ),
      total: activities.length,
      lastWeek: activities.filter(
        (a) =>
          new Date(a.timestamp) >
          new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
      ).length,
    };
  }

  private getBasicAdviceForWeather(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        return 'Ngày nắng: tưới nước sáng sớm, che nắng trưa';
      case WeatherMain.RAIN:
        return 'Ngày mưa: kiểm tra thoát nước, thu gom nước mưa';
      case WeatherMain.CLOUDS:
        return 'Ngày có mây: thời điểm tốt để cắt tỉa, trồng mới';
      default:
        return 'Quan sát thời tiết và điều chỉnh chăm sóc phù hợp';
    }
  }

  private getBeginnerTips(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        return 'Chọc ngón tay xuống đất 3cm, khô thì tưới';
      case WeatherMain.RAIN:
        return 'Đặt chậu hứng nước mưa, nước mưa tốt cho cây';
      case WeatherMain.CLOUDS:
        return 'Thời điểm tốt để học kỹ thuật mới';
      default:
        return 'Bắt đầu với 1-2 loại cây dễ trồng';
    }
  }

  private getRecommendedTopics(level: number): string {
    if (level <= 1) return 'cách tưới nước, nhận biết thiếu nước';
    if (level <= 3) return 'bón phân, cắt tỉa cơ bản';
    return 'kỹ thuật nhân giống, xử lý sâu bệnh';
  }

  private getAdvancedExperiments(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        return 'Thử nghiệm hệ thống tưới nhỏ giọt tự động';
      case WeatherMain.RAIN:
        return 'Thiết kế hệ thống thu gom nước mưa thông minh';
      case WeatherMain.CLOUDS:
        return 'Thử nghiệm ghép cây, chiết cành';
      default:
        return 'Nghiên cứu vi khí hậu trong vườn';
    }
  }

  private getForecastPreparationSteps(
    forecast: any,
    gardenType: GardenType,
  ): string[] {
    const steps: string[] = [];

    if (forecast.weatherMain === WeatherMain.RAIN) {
      steps.push('🏃‍♂️ Chuẩn bị che mưa: Sẵn sàng màn che, nylon để bảo vệ cây');
      steps.push('🪣 Chuẩn bị thu nước: Đặt thùng, chậu ở vị trí thuận lợi');
      steps.push(
        '🕳️ Kiểm tra thoát nước: Đảm bảo không bị tắc nghẽn' as string,
      );
    } else if (forecast.tempMax > 35) {
      steps.push('☂️ Chuẩn bị che nắng: Lưới che, ô dù, tấm che' as string);
      steps.push('💧 Dự trữ nước: Đổ đầy bình, thùng nước' as string);
      steps.push('🌾 Chuẩn bị mulch: Rơm, lá khô để phủ gốc' as string);
    } else if (forecast.tempMin < 10) {
      steps.push('🧥 Chuẩn bị giữ ấm: Vải che, nylon, đèn sưởi nhẹ' as string);
      steps.push('🏠 Di chuyển cây nhạy cảm: Vào trong nhà hoặc nơi kín gió');
    }

    steps.push('📱 Theo dõi dự báo: Cập nhật thông tin thời tiết mới nhất');

    return steps;
  }

  // Các helper method khác...
  private getTemperatureVariationAdvice(variation: number): string {
    if (variation > 15) return 'chênh lệch lớn, cây dễ stress';
    if (variation > 10) return 'chênh lệch khá cao, cần chú ý';
    return 'chênh lệch bình thường';
  }

  private getRainProbabilityAdvice(probability: number): string {
    if (probability > 0.8) return 'rất cao, chắc chắn có mưa';
    if (probability > 0.5) return 'khả năng cao, nên chuẩn bị';
    if (probability > 0.2) return 'có thể có mưa rào';
    return 'thời tiết khô ráo';
  }

  private getWindAdvice(windSpeed: number): string {
    if (windSpeed > 15) return 'gió rất mạnh, cần cố định cây';
    if (windSpeed > 10) return 'gió mạnh, chú ý cây cao';
    if (windSpeed > 5) return 'gió nhẹ, có lợi cho cây';
    return 'gió yếu hoặc không có gió';
  }

  private getCloudCoverAdvice(clouds: number): string {
    if (clouds > 80) return 'trời âm u, ánh sáng yếu';
    if (clouds > 50) return 'có mây che, ánh sáng vừa phải';
    if (clouds > 20) return 'có mây thưa, ánh sáng tốt';
    return 'trời quang, ánh sáng mạnh';
  }

  private getTomorrowPreparationTips(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.RAIN:
        return 'Chuẩn bị dụng cụ che mưa và thu nước';
      case WeatherMain.CLEAR:
        return 'Chuẩn bị nước tưới và dụng cụ che nắng';
      case WeatherMain.THUNDERSTORM:
        return 'Gia cố và di chuyển cây vào nơi an toàn';
      default:
        return 'Chuẩn bị linh hoạt theo tình huống';
    }
  }

  private getBestTimingForForecast(forecast: any): string {
    if (forecast.weatherMain === WeatherMain.RAIN) {
      return 'Trước 7h sáng hoặc sau 17h chiều (tránh mưa)';
    }
    if (forecast.tempMax > 35) {
      return 'Sáng sớm 5h-7h, tối 18h-20h';
    }
    return 'Sáng 6h-9h, chiều 16h-18h';
  }

  private getSmartPlanningTips(forecast: any, gardenType: GardenType): string {
    const gardenTypeAdvice =
      gardenType === 'BALCONY'
        ? 'dễ di chuyển và che chắn'
        : gardenType === 'OUTDOOR'
          ? 'cần chuẩn bị kỹ lưỡng'
          : gardenType === 'INDOOR'
            ? 'ít bị ảnh hưởng thời tiết'
            : 'linh hoạt điều chỉnh';

    return `Vườn ${gardenType.toLowerCase()} của bạn ${gardenTypeAdvice}`;
  }

  // Các method helper bổ sung
  private getWateringAdviceForStage(stage: string, temp: number): string {
    const baseAdvice = stage.includes('mầm')
      ? 'Tưới nhẹ, thường xuyên'
      : stage.includes('lá')
        ? 'Tưới sâu, ít lần'
        : 'Tưới đều, ổn định';

    const tempAdjustment =
      temp > 30
        ? ' (tăng 50% do nóng)'
        : temp < 15
          ? ' (giảm 30% do lạnh)'
          : '';

    return baseAdvice + tempAdjustment;
  }

  private getLightAdviceForStage(
    stage: string,
    weatherMain: WeatherMain,
  ): string {
    const lightNeeds = stage.includes('mầm')
      ? 'Ánh sáng nhẹ'
      : stage.includes('hoa')
        ? 'Ánh sáng đầy đủ'
        : 'Ánh sáng trung bình';

    const weatherAdjustment =
      weatherMain === WeatherMain.CLEAR
        ? ', che nắng gắt'
        : weatherMain === WeatherMain.CLOUDS
          ? ', không cần che'
          : weatherMain === WeatherMain.RAIN ||
              weatherMain === WeatherMain.DRIZZLE ||
              weatherMain === WeatherMain.SNOW ||
              weatherMain === WeatherMain.ATMOSPHERE ||
              weatherMain === WeatherMain.THUNDERSTORM
            ? ', bổ sung đèn LED'
            : '';

    return lightNeeds + weatherAdjustment;
  }

  private getNutritionAdviceForStage(stage: string, days: number): string {
    if (stage.includes('mầm') && days < 14)
      return 'Chưa cần bón phân, chỉ cần nước';
    if (stage.includes('lá')) return 'Bón phân đạm (N) để phát triển lá';
    if (stage.includes('hoa'))
      return 'Bón phân lân (P) và kali (K) cho hoa trái';
    return 'Bón phân cân bằng NPK';
  }

  private getPlantCharacteristics(plantName: string): string {
    // Cơ sở dữ liệu đặc điểm cây trồng
    const characteristics: Record<string, string> = {
      'cà chua': 'Thích nắng, cần giàn leo, nhạy cảm với nước đọng',
      'rau muống': 'Ưa ẩm, sinh trưởng nhanh, cần cắt thu hoạch thường xuyên',
      'rau xà lách': 'Sợ nắng gắt, cần mát mẻ, thích đất tơi xốp',
      ớt: 'Chịu hạn tốt, cần nắng nhiều, sợ úng rễ',
      'bạc hà': 'Dễ trồng, ưa ẩm, có thể trồng trong bóng râm',
    };

    return (
      characteristics[plantName.toLowerCase()] ||
      'Cây có đặc điểm riêng, cần tìm hiểu thêm'
    );
  }

  private getStageSpecificTips(stage: string): string {
    if (stage.includes('mầm')) return 'Giữ ẩm đều, tránh di chuyển cây';
    if (stage.includes('lá')) return 'Tỉa lá vàng, bón phân đạm';
    if (stage.includes('hoa')) return 'Giảm đạm, tăng lân kali, tránh stress';
    if (stage.includes('trái')) return 'Tưới đều, hỗ trợ cây chống đỗ';
    return 'Chăm sóc theo nhu cầu cụ thể của giai đoạn';
  }

  private getWeatherSpecificTips(
    weatherMain: WeatherMain,
    temp: number,
  ): string {
    let advice = '';
    switch (weatherMain) {
      case WeatherMain.CLEAR:
        advice =
          temp > 30 ? 'Che nắng, tưới sáng sớm' : 'Tận dụng ánh sáng tự nhiên';
        break;
      case WeatherMain.RAIN:
        advice = 'Kiểm tra thoát nước, thu nước mưa';
        break;
      case WeatherMain.CLOUDS:
        advice = 'Thời điểm tốt để cắt tỉa, trồng mới';
        break;
      default:
        advice = 'Theo dõi thời tiết và điều chỉnh';
    }
    return advice;
  }

  private getPlantTypeAdvice(plantName: string): string {
    const adviceMap: Record<string, string> = {
      'cà chua': 'Buộc thân vào cọc khi cao 20cm, tỉa chồi nách',
      ớt: 'Tỉa đầu khi cao 15cm để tạo tán, chống đỗ khi có trái',
      'rau muống': 'Cắt cách gốc 3-5cm để tái sinh, thu hoạch mỗi 2-3 tuần',
      'bạc hà': 'Cắt ngọn thường xuyên để không ra hoa, nhân giống bằng cành',
    };

    return adviceMap[plantName.toLowerCase()] || '';
  }

  private getPlantSpecificThingsToAvoid(
    plantName: string,
    stage: string,
  ): string {
    const generalAvoid = stage.includes('mầm')
      ? 'di chuyển nhiều, ánh sáng trực tiếp'
      : stage.includes('hoa')
        ? 'bón phân đạm quá nhiều, tưới lên hoa'
        : 'stress đột ngột';

    const plantSpecific: Record<string, string> = {
      'cà chua': 'úng rễ, nước lên lá vào buổi tối',
      ớt: 'tưới quá nhiều, thiếu ánh sáng',
      'rau xà lách': 'nắng gắt, nhiệt độ cao',
    };

    return plantSpecific[plantName.toLowerCase()] || generalAvoid;
  }

  private getWeatherSpecificPrecautions(weatherMain: WeatherMain): string {
    switch (weatherMain) {
      case WeatherMain.RAIN:
        return 'tưới thêm nước, để cây ngoài mưa lâu';
      case WeatherMain.CLEAR:
        return 'tưới nước buổi trưa, để cây thiếu nước';
      case WeatherMain.THUNDERSTORM:
        return 'để cây ngoài trời, làm việc khi có sấm sét';
      default:
        return 'bỏ qua dự báo thời tiết';
    }
  }

  private getStageSpecificPrecautions(stage: string): string {
    if (stage.includes('mầm')) return 'di chuyển cây thường xuyên';
    if (stage.includes('hoa')) return 'bón phân đạm nhiều';
    if (stage.includes('trái')) return 'để cây thiếu nước';
    return 'chăm sóc không đều đặn';
  }

  // Giữ nguyên các method cũ để backward compatibility
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
      this.logger.warn(`Không tìm thấy dữ liệu thời tiết cho vườn ${gardenId}`);
      throw new NotFoundException(
        `Chào bạn! Tôi không tìm thấy dữ liệu thời tiết cho vườn này. Có thể cảm biến chưa được kết nối? 🤔`,
      );
    }

    this.observationCache[gardenId] = { data: obs, timestamp: now };
    return obs;
  }

  public async getWeatherTrend(gardenId: number, days: number = 7) {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);

    return await this.prisma.weatherObservation.findMany({
      where: {
        gardenId,
        observedAt: { gte: fromDate },
      },
      orderBy: { observedAt: 'desc' },
      take: days * 4,
    });
  }

  public async getWeatherBasedAdvice(
    gardenId: number,
  ): Promise<WeatherAdviceDto[]> {
    this.logger.log(
      `🌱 Đang tạo lời khuyên thông minh cho vườn ${gardenId}...`,
    );
    return this.generateSuperFriendlyAdvice(gardenId);
  }
}

// Cập nhật interface CacheEntry
interface CacheEntry<T> {
  data: T;
  timestamp: number;
}
