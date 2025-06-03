import { Injectable, ForbiddenException, NotFoundException, Logger, BadRequestException } from '@nestjs/common';
import { subDays, addDays, startOfDay, endOfDay, addHours, isBefore, isAfter } from 'date-fns';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateWateringScheduleDto } from '../dto/watering-schedule.dto';
import { ConfigService } from '@nestjs/config';
import axios from 'axios';

interface AIWateringRecommendation {
  shouldSchedule: boolean;
  optimalTimes: Date[];
  recommendedAmount: number;
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';
  reasons: string[];
  confidence: number;
}

interface WeatherAnalysis {
  hasRainForecast: boolean;
  avgTemperature: number;
  avgHumidity: number;
  riskLevel: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
}

@Injectable()
export class WateringScheduleService {
  private readonly logger = new Logger(WateringScheduleService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('SMART_WATERING_AI_URL', 'http://smart-watering-ai:5001');
    this.logger.log(`🤖 Smart Watering AI service configured at: ${this.aiServiceUrl}`);
  }

  async getAll(userId: number, query: any) {
    const gardener = await this.getGardener(userId);
    return this.prisma.wateringSchedule.findMany({
      where: {
        garden: { gardenerId: gardener.userId },
        status: query.status,
        scheduledAt: this.buildDateRange(query.startDate, query.endDate),
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getById(userId: number, id: number) {
    const schedule = await this.findScheduleOrFail(id);
    await this.ensureOwnership(schedule.gardenId, userId);
    return schedule;
  }

  async complete(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async skip(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.update({
      where: { id },
      data: { status: 'SKIPPED' },
    });
  }

  async delete(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.delete({ where: { id } });
  }

  async getByGarden(userId: number, gardenId: number, query: any) {
    await this.ensureOwnership(gardenId, userId);
    return this.prisma.wateringSchedule.findMany({
      where: {
        gardenId,
        status: query.status,
        scheduledAt: this.buildDateRange(query.startDate, query.endDate),
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(userId: number, gardenId: number, dto: CreateWateringScheduleDto) {
    await this.ensureOwnership(gardenId, userId);
    return this.prisma.wateringSchedule.create({
      data: {
        gardenId,
        scheduledAt: new Date(dto.scheduledAt),
        amount: dto.amount,
      },
    });
  }

  /**
   * Tạo lịch tưới tự động thông minh với AI
   * Phân tích đa yếu tố: cảm biến, thời tiết, giai đoạn cây trồng
   */
  async autoGenerate(userId: number, gardenId: number): Promise<any> {
    try {
      this.logger.log(`🌱 Starting AI-powered auto schedule generation for garden ${gardenId}`);
      
      await this.ensureOwnership(gardenId, userId);

      // 1. Lấy thông tin vườn và cây trồng
      const garden = await this.getGardenWithDetails(gardenId);
      
      // 2. Phân tích dữ liệu cảm biến hiện tại
      const sensorAnalysis = await this.analyzeSensorData(gardenId);
      
      // 3. Phân tích dự báo thời tiết
      const weatherAnalysis = await this.analyzeWeatherForecast(gardenId);
      
      // 4. Gọi AI để đánh giá và đề xuất
      const aiRecommendation = await this.getAIWateringRecommendation(
        sensorAnalysis, 
        weatherAnalysis, 
        garden
      );

      // 5. Tạo lịch tưới tối ưu
      const schedules = await this.createOptimalSchedules(
        gardenId, 
        garden, 
        aiRecommendation, 
        weatherAnalysis
      );

      // 6. Tạo activity log cho việc tạo lịch tự động
      await this.createAutoScheduleActivity(userId, garden, aiRecommendation, weatherAnalysis, schedules);

      this.logger.log(`✅ AI auto-schedule completed: ${schedules.length} schedules created`);

      return {
        success: true,
        schedulesCreated: schedules.length,
        schedules: schedules,
        aiAnalysis: {
          recommendation: aiRecommendation,
          weatherAnalysis: weatherAnalysis,
          sensorAnalysis: sensorAnalysis,
        },
        summary: this.generateScheduleSummary(schedules, aiRecommendation),
      };
    } catch (error) {
      this.logger.error(`❌ Error in AI auto-schedule generation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy thông tin chi tiết của vườn
   */
  private async getGardenWithDetails(gardenId: number): Promise<any> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: { 
        sensors: true,
        dailyForecast: {
          where: {
            forecastFor: {
              gte: new Date(),
              lte: addDays(new Date(), 7),
            },
          },
          orderBy: { forecastFor: 'asc' },
          take: 7,
        },
      },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found');
    }

    return garden;
  }

  /**
   * Phân tích dữ liệu cảm biến hiện tại và xu hướng
   */
  private async analyzeSensorData(gardenId: number): Promise<any> {
    const yesterday = subDays(new Date(), 1);
    
    // Lấy dữ liệu cảm biến 24h gần nhất
    const recentSensorData = await this.prisma.sensorData.findMany({
      where: {
        sensor: { gardenId },
        timestamp: { gte: yesterday },
      },
      include: { sensor: true },
      orderBy: { timestamp: 'desc' },
      take: 100,
    });

    if (recentSensorData.length === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu cảm biến gần đây');
    }

    // Phân tích theo loại sensor
    const sensorMap = new Map();
    const trends = new Map();

    recentSensorData.forEach(data => {
      const sensorType = data.sensor.type;
      if (!sensorMap.has(sensorType)) {
        sensorMap.set(sensorType, []);
      }
      sensorMap.get(sensorType).push({
        value: data.value,
        timestamp: data.timestamp,
      });
    });

    // Tính toán xu hướng và giá trị hiện tại
    const analysis = {};
    sensorMap.forEach((values, sensorType) => {
      const latest = values[0];
      const average = values.reduce((sum, item) => sum + item.value, 0) / values.length;
      const trend = values.length > 1 ? (latest.value - values[values.length - 1].value) : 0;
      
      analysis[sensorType] = {
        current: latest.value,
        average: average,
        trend: trend > 0 ? 'increasing' : trend < 0 ? 'decreasing' : 'stable',
        trendValue: trend,
        lastUpdate: latest.timestamp,
      };
    });

    this.logger.log(`📊 Sensor analysis completed: ${Object.keys(analysis).length} sensor types analyzed`);
    return analysis;
  }

  /**
   * Phân tích dự báo thời tiết 7 ngày tới
   */
  private async analyzeWeatherForecast(gardenId: number): Promise<WeatherAnalysis> {
    const sevenDaysLater = addDays(new Date(), 7);
    
    const forecasts = await this.prisma.dailyForecast.findMany({
      where: {
        gardenId,
        forecastFor: {
          gte: new Date(),
          lte: sevenDaysLater,
        },
      },
      orderBy: { forecastFor: 'asc' },
    });

    if (forecasts.length === 0) {
      this.logger.warn('⚠️ No weather forecast data available, using default assumptions');
      return {
        hasRainForecast: false,
        avgTemperature: 25,
        avgHumidity: 70,
        riskLevel: 'MEDIUM',
        recommendation: 'Không có dữ liệu thời tiết, sử dụng lịch tưới cơ bản',
      };
    }

    const totalRain = forecasts.reduce((sum, f) => sum + (f.rain || 0), 0);
    const avgTemp = forecasts.reduce((sum, f) => sum + f.tempDay, 0) / forecasts.length;
    const avgHumidity = forecasts.reduce((sum, f) => sum + f.humidity, 0) / forecasts.length;
    
    const hasRainForecast = totalRain > 5; // Trên 5mm được coi là có mưa đáng kể
    const isHotWeek = avgTemp > 30;
    const isHighHumidity = avgHumidity > 80;

    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'MEDIUM';
    let recommendation = '';

    if (hasRainForecast && isHighHumidity) {
      riskLevel = 'LOW';
      recommendation = 'Có mưa và độ ẩm cao, giảm tần suất tưới';
    } else if (isHotWeek && !hasRainForecast) {
      riskLevel = 'HIGH';
      recommendation = 'Thời tiết nóng khô, tăng tần suất tưới nước';
    } else {
      recommendation = 'Thời tiết ổn định, duy trì lịch tưới bình thường';
    }

    this.logger.log(`🌤️ Weather analysis: ${hasRainForecast ? 'Rain expected' : 'No rain'}, Avg temp: ${avgTemp.toFixed(1)}°C, Risk: ${riskLevel}`);

    return {
      hasRainForecast,
      avgTemperature: avgTemp,
      avgHumidity,
      riskLevel,
      recommendation,
    };
  }

  /**
   * Gọi AI để đánh giá và đề xuất lịch tưới
   */
  private async getAIWateringRecommendation(
    sensorAnalysis: any,
    weatherAnalysis: WeatherAnalysis,
    garden: any
  ): Promise<AIWateringRecommendation> {
    try {
      // Chuẩn bị dữ liệu cho AI
      const aiInput = {
        sensor_data: {
          soil_moisture: sensorAnalysis.SOIL_MOISTURE?.current || 50,
          temperature: sensorAnalysis.TEMPERATURE?.current || 25,
          humidity: sensorAnalysis.HUMIDITY?.current || 70,
          light_intensity: sensorAnalysis.LIGHT?.current || 10000,
          water_level: sensorAnalysis.WATER_LEVEL?.current || 80,
        },
        weather_forecast: {
          has_rain: weatherAnalysis.hasRainForecast,
          avg_temperature: weatherAnalysis.avgTemperature,
          avg_humidity: weatherAnalysis.avgHumidity,
          risk_level: weatherAnalysis.riskLevel,
        },
        plant_info: {
          plant_name: garden.plantName || 'Unknown',
          plant_stage: garden.plantGrowStage || 'Unknown',
          days_since_planting: garden.plantStartDate 
            ? Math.floor((new Date().getTime() - new Date(garden.plantStartDate).getTime()) / (1000 * 60 * 60 * 24))
            : 30,
        },
        request_type: 'schedule_recommendation',
      };

      this.logger.log(`🤖 Calling AI for schedule recommendation`);

      const response = await axios.post(`${this.aiServiceUrl}/watering/schedule`, aiInput, {
        timeout: 15000,
        headers: { 'Content-Type': 'application/json' },
      });

      if (response.data?.success) {
        const aiData = response.data;
        
        // Tạo các thời điểm tưới tối ưu (từ AI hoặc logic mặc định)
        const optimalTimes = this.generateOptimalTimes(aiData, weatherAnalysis);
        
        return {
          shouldSchedule: aiData.should_schedule || true,
          optimalTimes,
          recommendedAmount: aiData.recommended_amount || this.calculateDefaultAmount(sensorAnalysis),
          priority: this.determinePriority(sensorAnalysis, weatherAnalysis),
          reasons: aiData.reasons || this.generateDefaultReasons(sensorAnalysis, weatherAnalysis),
          confidence: aiData.confidence || 0.75,
        };
      } else {
        throw new Error('AI service returned unsuccessful response');
      }
    } catch (error) {
      this.logger.warn(`⚠️ AI service unavailable, falling back to rule-based recommendation: ${error.message}`);
      return this.getFallbackRecommendation(sensorAnalysis, weatherAnalysis, garden);
    }
  }

  /**
   * Tạo các thời điểm tưới tối ưu
   */
  private generateOptimalTimes(aiData: any, weatherAnalysis: WeatherAnalysis): Date[] {
    const times: Date[] = [];
    const now = new Date();
    
    // AI có thể đề xuất các thời điểm cụ thể, nếu không thì dùng logic mặc định
    const suggestedHours = aiData.optimal_hours || [6, 18]; // Sáng sớm và chiều tối
    const daysToSchedule = weatherAnalysis.hasRainForecast ? 3 : 7; // Ít hơn nếu có mưa

    for (let day = 1; day <= daysToSchedule; day++) {
      const targetDate = addDays(now, day);
      
      // Bỏ qua ngày có mưa lớn
      if (day <= 3 && weatherAnalysis.hasRainForecast && Math.random() > 0.3) {
        continue;
      }
      
      suggestedHours.forEach(hour => {
        const wateringTime = new Date(targetDate);
        wateringTime.setHours(hour, 0, 0, 0);
        times.push(wateringTime);
      });
    }

    return times.slice(0, 10); // Giới hạn tối đa 10 lịch
  }

  /**
   * Tạo lịch tưới tối ưu dựa trên đề xuất AI
   */
  private async createOptimalSchedules(
    gardenId: number,
    garden: any,
    recommendation: AIWateringRecommendation,
    weatherAnalysis: WeatherAnalysis
  ): Promise<any[]> {
    if (!recommendation.shouldSchedule) {
      this.logger.log('🛑 AI recommends no watering schedule needed');
      return [];
    }

    const schedules: any[] = [];
    
    for (const optimalTime of recommendation.optimalTimes) {
      try {
        // Kiểm tra xem đã có lịch tưới nào trong khoảng thời gian gần đó chưa
        const existingSchedule = await this.prisma.wateringSchedule.findFirst({
          where: {
            gardenId,
            scheduledAt: {
              gte: subDays(optimalTime, 1),
              lte: addDays(optimalTime, 1),
            },
            status: { in: ['PENDING', 'COMPLETED'] },
          },
        });

        if (existingSchedule) {
          this.logger.log(`⏭️ Skipping ${optimalTime.toISOString()}, existing schedule found`);
          continue;
        }

        const schedule = await this.prisma.wateringSchedule.create({
          data: {
            gardenId,
            scheduledAt: optimalTime,
            amount: recommendation.recommendedAmount,
            reason: this.generateScheduleReason(recommendation, weatherAnalysis, optimalTime),
            notes: `Lịch tự động AI - ${garden.plantName || 'Cây trồng'} (${garden.plantGrowStage || 'Giai đoạn phát triển'})`,
            status: 'PENDING',
          },
        });

        schedules.push(schedule);
        this.logger.log(`📅 Schedule created: ${optimalTime.toLocaleString('vi-VN')} - ${recommendation.recommendedAmount}L`);
      } catch (error) {
        this.logger.error(`Error creating schedule for ${optimalTime}: ${error.message}`);
      }
    }

    return schedules;
  }

  /**
   * Tạo lý do cho lịch tưới
   */
  private generateScheduleReason(
    recommendation: AIWateringRecommendation,
    weatherAnalysis: WeatherAnalysis,
    scheduledTime: Date
  ): string {
    const timeStr = scheduledTime.toLocaleString('vi-VN');
    const reasons = recommendation.reasons.join(', ');
    return `AI đề xuất (${(recommendation.confidence * 100).toFixed(0)}% tin cậy): ${reasons}. Thời tiết: ${weatherAnalysis.recommendation}`;
  }

  /**
   * Tính toán lượng nước mặc định
   */
  private calculateDefaultAmount(sensorAnalysis: any): number {
    const soilMoisture = sensorAnalysis.SOIL_MOISTURE?.current || 50;
    const temperature = sensorAnalysis.TEMPERATURE?.current || 25;
    
    let baseAmount = 2.0; // Lượng nước cơ bản (lít)
    
    // Điều chỉnh dựa trên độ ẩm đất
    if (soilMoisture < 30) {
      baseAmount += 1.5; // Đất khô, cần nhiều nước hơn
    } else if (soilMoisture < 50) {
      baseAmount += 0.5; // Đất hơi khô
    }
    
    // Điều chỉnh dựa trên nhiệt độ
    if (temperature > 30) {
      baseAmount += 1.0; // Thời tiết nóng, cần nhiều nước
    } else if (temperature > 25) {
      baseAmount += 0.5; // Thời tiết ấm
    }
    
    return Math.min(baseAmount, 5.0); // Giới hạn tối đa 5 lít
  }

  /**
   * Xác định mức độ ưu tiên
   */
  private determinePriority(sensorAnalysis: any, weatherAnalysis: WeatherAnalysis): 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT' {
    const soilMoisture = sensorAnalysis.SOIL_MOISTURE?.current || 50;
    const temperature = sensorAnalysis.TEMPERATURE?.current || 25;
    
    if (soilMoisture < 20 && temperature > 30) {
      return 'URGENT'; // Đất rất khô và thời tiết nóng
    } else if (soilMoisture < 30) {
      return 'HIGH'; // Đất khô
    } else if (soilMoisture < 50 || weatherAnalysis.riskLevel === 'HIGH') {
      return 'MEDIUM'; // Đất hơi khô hoặc thời tiết có nguy cơ
    } else {
      return 'LOW'; // Điều kiện bình thường
    }
  }

  /**
   * Tạo lý do mặc định
   */
  private generateDefaultReasons(sensorAnalysis: any, weatherAnalysis: WeatherAnalysis): string[] {
    const reasons: string[] = [];
    const soilMoisture = sensorAnalysis.SOIL_MOISTURE?.current || 50;
    const temperature = sensorAnalysis.TEMPERATURE?.current || 25;
    
    if (soilMoisture < 40) {
      reasons.push(`Độ ẩm đất thấp (${soilMoisture.toFixed(1)}%)`);
    }
    
    if (temperature > 28) {
      reasons.push(`Nhiệt độ cao (${temperature.toFixed(1)}°C)`);
    }
    
    if (!weatherAnalysis.hasRainForecast) {
      reasons.push('Không có mưa trong dự báo');
    }
    
    if (reasons.length === 0) {
      reasons.push('Duy trì lịch tưới định kỳ');
    }
    
    return reasons;
  }

  /**
   * Đề xuất dự phòng khi AI không khả dụng
   */
  private getFallbackRecommendation(
    sensorAnalysis: any,
    weatherAnalysis: WeatherAnalysis,
    garden: any
  ): AIWateringRecommendation {
    const soilMoisture = sensorAnalysis.SOIL_MOISTURE?.current || 50;
    const shouldSchedule = soilMoisture < 60 && !weatherAnalysis.hasRainForecast;
    
    return {
      shouldSchedule,
      optimalTimes: shouldSchedule ? this.generateDefaultOptimalTimes(weatherAnalysis) : [],
      recommendedAmount: this.calculateDefaultAmount(sensorAnalysis),
      priority: this.determinePriority(sensorAnalysis, weatherAnalysis),
      reasons: this.generateDefaultReasons(sensorAnalysis, weatherAnalysis),
      confidence: 0.6, // Độ tin cậy thấp hơn cho logic dự phòng
    };
  }

  /**
   * Tạo thời gian tối ưu mặc định
   */
  private generateDefaultOptimalTimes(weatherAnalysis: WeatherAnalysis): Date[] {
    const times: Date[] = [];
    const now = new Date();
    const daysToSchedule = weatherAnalysis.hasRainForecast ? 2 : 5;
    
    for (let day = 1; day <= daysToSchedule; day++) {
      const morningTime = addDays(now, day);
      morningTime.setHours(6, 0, 0, 0);
      
      const eveningTime = addDays(now, day);
      eveningTime.setHours(18, 0, 0, 0);
      
      times.push(morningTime, eveningTime);
    }
    
    return times;
  }

  /**
   * Tạo activity log cho việc tạo lịch tự động
   */
  private async createAutoScheduleActivity(
    gardenerId: number,
    garden: any,
    recommendation: AIWateringRecommendation,
    weatherAnalysis: WeatherAnalysis,
    schedules: any[]
  ): Promise<void> {
    try {
      const currentTime = new Date();
      const timeString = currentTime.toLocaleString('vi-VN', {
        timeZone: 'Asia/Ho_Chi_Minh',
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });

      let activityDetails = `🤖 **Tạo lịch tưới tự động bằng AI**\n\n`;
      activityDetails += `📅 **Thời gian tạo**: ${timeString}\n`;
      activityDetails += `🏡 **Vườn**: ${garden.name}\n`;
      activityDetails += `🌿 **Loại cây**: ${garden.plantName || 'Chưa xác định'}\n`;
      activityDetails += `🌱 **Giai đoạn phát triển**: ${garden.plantGrowStage || 'Chưa xác định'}\n\n`;
      
      activityDetails += `📊 **Phân tích AI**:\n`;
      activityDetails += `• 🎯 Khuyến nghị: ${recommendation.shouldSchedule ? 'Cần tạo lịch tưới' : 'Không cần tưới nước'}\n`;
      activityDetails += `• 📈 Độ tin cậy: ${(recommendation.confidence * 100).toFixed(1)}%\n`;
      activityDetails += `• ⚡ Mức độ ưu tiên: ${recommendation.priority}\n`;
      activityDetails += `• 💧 Lượng nước đề xuất: ${recommendation.recommendedAmount}L\n\n`;

      if (recommendation.reasons.length > 0) {
        activityDetails += `🔍 **Lý do**:\n`;
        recommendation.reasons.forEach((reason, index) => {
          activityDetails += `${index + 1}. ${reason}\n`;
        });
        activityDetails += `\n`;
      }

      activityDetails += `🌤️ **Phân tích thời tiết**:\n`;
      activityDetails += `• 🌧️ Dự báo mưa: ${weatherAnalysis.hasRainForecast ? 'Có' : 'Không'}\n`;
      activityDetails += `• 🌡️ Nhiệt độ trung bình: ${weatherAnalysis.avgTemperature.toFixed(1)}°C\n`;
      activityDetails += `• 💨 Độ ẩm trung bình: ${weatherAnalysis.avgHumidity.toFixed(1)}%\n`;
      activityDetails += `• ⚠️ Mức độ rủi ro: ${weatherAnalysis.riskLevel}\n`;
      activityDetails += `• 💡 Khuyến nghị: ${weatherAnalysis.recommendation}\n\n`;

      if (schedules.length > 0) {
        activityDetails += `📋 **Lịch tưới được tạo** (${schedules.length} lịch):\n`;
        schedules.forEach((schedule, index) => {
          const scheduleTime = new Date(schedule.scheduledAt).toLocaleString('vi-VN');
          activityDetails += `${index + 1}. ${scheduleTime} - ${schedule.amount}L\n`;
        });
      } else {
        activityDetails += `📋 **Kết quả**: Không tạo lịch tưới (AI đánh giá không cần thiết)\n`;
      }

      activityDetails += `\n💡 **Lưu ý**: Lịch tưới có thể được điều chỉnh tự động dựa trên dữ liệu cảm biến và thời tiết thực tế`;

      const reason = `AI tạo ${schedules.length} lịch tưới tự động với độ tin cậy ${(recommendation.confidence * 100).toFixed(0)}%`;

      await this.prisma.gardenActivity.create({
        data: {
          gardenId: garden.id,
          gardenerId: gardenerId,
          name: `Tạo lịch tưới AI - ${schedules.length} lịch`,
          activityType: 'OTHER',
          timestamp: currentTime,
          plantName: garden.plantName || 'Chưa xác định',
          plantGrowStage: garden.plantGrowStage || 'Chưa xác định',
          details: activityDetails,
          reason: reason,
          notes: `AI đề xuất tạo ${schedules.length} lịch tưới dựa trên phân tích sensor và thời tiết`,
        },
      });

      this.logger.log(`📋 Auto-schedule activity log created - ${schedules.length} schedules`);
    } catch (error) {
      this.logger.error(`Failed to create auto-schedule activity log: ${error.message}`, error.stack);
    }
  }

  /**
   * Tạo tóm tắt lịch tưới
   */
  private generateScheduleSummary(schedules: any[], recommendation: AIWateringRecommendation): string {
    if (schedules.length === 0) {
      return 'AI đánh giá không cần tạo lịch tưới trong thời gian này.';
    }

    const totalAmount = schedules.reduce((sum, s) => sum + (s.amount || 0), 0);
    const firstSchedule = new Date(schedules[0].scheduledAt).toLocaleDateString('vi-VN');
    const lastSchedule = new Date(schedules[schedules.length - 1].scheduledAt).toLocaleDateString('vi-VN');

    return `Đã tạo ${schedules.length} lịch tưới từ ${firstSchedule} đến ${lastSchedule}. ` +
           `Tổng lượng nước: ${totalAmount.toFixed(1)}L. ` +
           `Mức độ ưu tiên: ${recommendation.priority}. ` +
           `Độ tin cậy AI: ${(recommendation.confidence * 100).toFixed(0)}%.`;
  }

  private async ensureOwnership(gardenId: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden || garden.gardenerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập garden này');
    }
  }

  private async ensureOwnershipBySchedule(scheduleId: number, userId: number) {
    const schedule = await this.findScheduleOrFail(scheduleId);
    await this.ensureOwnership(schedule.gardenId, userId);
  }

  private async findScheduleOrFail(id: number) {
    const schedule = await this.prisma.wateringSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Lịch tưới không tồn tại');
    return schedule;
  }

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const range: any = {};
    if (startDate) range.gte = startOfDay(new Date(startDate));
    if (endDate) range.lte = endOfDay(new Date(endDate));
    return range;
  }

  private async getGardener(userId: number) {
    const gardener = await this.prisma.gardener.findUnique({ where: { userId } });
    if (!gardener) throw new NotFoundException('Không tìm thấy người làm vườn');
    return gardener;
  }
}
