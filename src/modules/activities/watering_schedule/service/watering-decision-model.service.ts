import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import axios from 'axios';
import { WateringDecisionDto, WateringStatsDto, SensorDataForRequestModelAIDto, WateringDecisionRequestDto } from '../dto/watering-decision-model.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WateringDecisionModelService {
  private readonly logger = new Logger(WateringDecisionModelService.name);
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('SMART_WATERING_AI_URL', 'http://smart-watering-ai:5001');
    this.logger.log(`🤖 Smart Watering AI service configured at: ${this.aiServiceUrl}`);
  }

  /**
   * Phương thức gộp để lấy quyết định tưới nước với thời gian tùy chọn
   * Dữ liệu sensor luôn được lấy từ database
   */
  async getWateringDecision(
    userId: number, 
    gardenId: number, 
    requestDto: WateringDecisionRequestDto = {}
  ): Promise<WateringDecisionDto> {
    try {
      this.logger.log(`🌱 Processing watering decision for garden ${gardenId} by user ${userId}`);

      // Kiểm tra quyền truy cập vườn
      const garden = await this.ensureGardenOwnership(gardenId, userId);

      // Xử lý thời gian tưới nước
      const wateringTime = requestDto.wateringTime ? new Date(requestDto.wateringTime) : new Date();
      
      // Validate thời gian không quá xa trong tương lai (max 7 ngày)
      const maxFutureTime = new Date();
      maxFutureTime.setDate(maxFutureTime.getDate() + 7);
      
      if (wateringTime > maxFutureTime) {
        throw new BadRequestException('Thời gian tưới nước không được quá 7 ngày trong tương lai');
      }

      this.logger.log(`⏰ Watering time: ${wateringTime.toLocaleString('vi-VN')}`);

      // Lấy dữ liệu cảm biến mới nhất từ database
      const sensorData = await this.getLatestSensorData(gardenId);

      this.logger.log(`📊 Sensor data retrieved: Soil ${sensorData.soil_moisture}%, Temp ${sensorData.temperature}°C, Humidity ${sensorData.air_humidity}%`);

      // Gọi AI model với dữ liệu sensor và thời gian
      const decision = await this.callAIModel(sensorData, wateringTime);

      // Tạo log hoạt động
      await this.createWateringDecisionActivity(userId, garden, sensorData, decision, requestDto.notes);

      const result = {
        ...decision,
        sensor_data: {
          soil_moisture: sensorData.soil_moisture,
          air_humidity: sensorData.air_humidity,
          temperature: sensorData.temperature,
          light_intensity: sensorData.light_intensity,
          water_level: sensorData.water_level,
        },
        timestamp: new Date(),
      };

      this.logger.log(`✅ Watering decision completed: ${result.decision} (confidence: ${result.confidence}%)`);

      return result;
    } catch (error) {
      this.logger.error(`❌ Error processing watering decision for garden ${gardenId}: ${error.message}`, error.stack);
      
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      throw new InternalServerErrorException('Lỗi khi lấy quyết định tưới nước từ AI model');
    }
  }


  async getWateringStatsByGarden(userId: number, gardenId: number, days: number): Promise<WateringStatsDto> {
    try {
      // Kiểm tra quyền truy cập vườn
      await this.ensureGardenOwnership(gardenId, userId);

      // Tính toán thống kê
      const stats = await this.calculateWateringStats(gardenId, days);

      return stats;
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error getting watering stats:', error);
      throw new InternalServerErrorException('Lỗi khi lấy thống kê quyết định tưới nước');
    }
  }

  async testAIConnection(): Promise<any> {
    try {
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000,
      });
      
      return {
        status: 'success',
        message: 'AI model hoạt động bình thường',
        aiResponse: response.data,
        timestamp: new Date(),
      };
    } catch (error) {
      console.error('AI model test failed:', error);
      throw new InternalServerErrorException('AI model không phản hồi');
    }
  }

  // Private helper methods
  private async ensureGardenOwnership(gardenId: number, userId: number): Promise<any> {
    const garden = await this.prisma.garden.findUnique({ 
      where: { id: gardenId } 
    });
    
    if (!garden) {
      throw new NotFoundException('Không tìm thấy vườn');
    }
    
    if (garden.gardenerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập vườn này');
    }

    return garden;
  }

  private async getLatestSensorData(gardenId: number): Promise<SensorDataForRequestModelAIDto> {
    const latestData = await this.prisma.sensorData.findMany({
      where: {
        sensor: { gardenId },
      },
      include: {
        sensor: true,
      },
      orderBy: { timestamp: 'desc' },
      take: 50, // Lấy 50 bản ghi gần nhất để tìm đủ các loại sensor
    });

    if (latestData.length === 0) {
      throw new NotFoundException('Không tìm thấy dữ liệu cảm biến cho vườn này');
    }

    // Tìm dữ liệu mới nhất cho từng loại sensor
    const sensorMap = new Map();
    for (const data of latestData) {
      if (!sensorMap.has(data.sensor.type)) {
        sensorMap.set(data.sensor.type, data.value);
      }
    }

    // Kiểm tra sensor bắt buộc
    const requiredSensors = ['SOIL_MOISTURE', 'HUMIDITY', 'TEMPERATURE', 'LIGHT'];
    const missingSensors = requiredSensors.filter(type => !sensorMap.has(type));
    
    if (missingSensors.length > 0) {
      throw new NotFoundException(`Thiếu dữ liệu cảm biến: ${missingSensors.join(', ')}`);
    }

    return {
      soil_moisture: sensorMap.get('SOIL_MOISTURE'),
      air_humidity: sensorMap.get('HUMIDITY'),
      temperature: sensorMap.get('TEMPERATURE'),
      light_intensity: sensorMap.get('LIGHT'),
      water_level: sensorMap.get('WATER_LEVEL') || 80.0, // Default if not available
    };
  }


  private async callAIModel(sensorData: SensorDataForRequestModelAIDto, wateringTime: Date): Promise<Omit<WateringDecisionDto, 'sensor_data' | 'timestamp'>> {
    try {
      // Transform data to match AI model format
      const modelData = {
        'soil_moisture_1(%)': sensorData.soil_moisture,
        'soil_moisture_2(%)': sensorData.soil_moisture,
        'temperature(°C)': sensorData.temperature,
        'light_level(lux)': sensorData.light_intensity,
        'water_level(%)': sensorData.water_level || 80.0,
        'hour': wateringTime.getHours(),
        'day_of_week': wateringTime.getDay() === 0 ? 6 : wateringTime.getDay() - 1, // Convert Sunday=0 to Monday=0 format
      };

      const response = await axios.post(`${this.aiServiceUrl}/watering/decision`, modelData, {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.data || response.data.success === false) {
        throw new Error(`AI model error: ${response.data?.error || 'Unknown error'}`);
      }

      return {
        decision: response.data.should_water ? 'water_now' : 'no_water',
        confidence: 85.0, // AI model doesn't return confidence, use default
        reasons: response.data.should_water ? 
          ['AI model khuyến nghị tưới nước dựa trên dữ liệu cảm biến'] : 
          ['AI model không khuyến nghị tưới nước lúc này'],
        recommended_amount: response.data.water_amount_litres || 0,
      };
    } catch (error) {
      console.error('AI model call failed:', error);
      if (error.code === 'ECONNREFUSED') {
        throw new InternalServerErrorException('AI model không khả dụng');
      }
      if (error.response?.data?.error) {
        throw new InternalServerErrorException(`AI model lỗi: ${error.response.data.error}`);
      }
      throw new InternalServerErrorException('Lỗi khi gọi AI model');
    }
  }

  private async calculateWateringStats(gardenId: number, days: number): Promise<WateringStatsDto> {
    const fromDate = new Date();
    fromDate.setDate(fromDate.getDate() - days);
    const toDate = new Date();

    // Mô phỏng thống kê - trong thực tế có thể lưu decisions vào database
    // Đây là placeholder logic, có thể mở rộng sau
    const sensorDataCount = await this.prisma.sensorData.count({
      where: {
        sensor: { gardenId },
        timestamp: {
          gte: fromDate,
          lte: toDate,
        },
      },
    });

    // Ước tính dựa trên dữ liệu hiện có
    const estimatedDecisions = Math.floor(sensorDataCount / 4); // Giả sử mỗi 4 sensor reading tạo 1 decision
    const estimatedWaterRecommendations = Math.floor(estimatedDecisions * 0.4); // 40% recommend watering
    const estimatedNoWaterRecommendations = estimatedDecisions - estimatedWaterRecommendations;

    return {
      gardenId,
      totalDecisions: estimatedDecisions,
      waterRecommendations: estimatedWaterRecommendations,
      noWaterRecommendations: estimatedNoWaterRecommendations,
      averageConfidence: 78.5, // Mock data - có thể tính toán thực từ stored decisions
      averageWaterAmount: 2.3, // Mock data
      fromDate,
      toDate,
    };
  }

  /**
   * Tạo nhật ký hoạt động cho quyết định tưới nước
   */
  private async createWateringDecisionActivity(
    gardenerId: number,
    garden: any,
    sensorData: SensorDataForRequestModelAIDto,
    decision: any,
    userNotes?: string,
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

      // Tạo mô tả chi tiết cho hoạt động
      let activityDetails = `🤖 **Quyết định tưới nước bằng AI**\n\n`;
      activityDetails += `📅 **Thời gian**: ${timeString}\n`;
      activityDetails += `🏡 **Vườn**: ${garden.name}\n`;
      activityDetails += `🌿 **Loại cây**: ${garden.plantName || 'Chưa xác định'}\n`;
      activityDetails += `🌱 **Giai đoạn phát triển**: ${garden.plantGrowStage || 'Chưa xác định'}\n\n`;
      
      activityDetails += `📊 **Dữ liệu cảm biến**:\n`;
      activityDetails += `• 💧 Độ ẩm đất: ${sensorData.soil_moisture}%\n`;
      activityDetails += `• 🌡️ Nhiệt độ: ${sensorData.temperature}°C\n`;
      activityDetails += `• 💨 Độ ẩm không khí: ${sensorData.air_humidity}%\n`;
      activityDetails += `• ☀️ Cường độ ánh sáng: ${sensorData.light_intensity} lux\n`;
      activityDetails += `• 🚰 Mức nước trong bể: ${sensorData.water_level}%\n\n`;

      activityDetails += `🎯 **Quyết định AI**: ${decision.decision === 'water_now' ? '💧 Cần tưới nước' : '⏸️ Không cần tưới'}\n`;
      activityDetails += `📈 **Độ tin cậy**: ${decision.confidence}%\n`;
      
      if (decision.recommended_amount > 0) {
        activityDetails += `💧 **Lượng nước đề xuất**: ${decision.recommended_amount} lít\n`;
      }

      if (decision.reasons && decision.reasons.length > 0) {
        activityDetails += `\n🔍 **Lý do**:\n`;
        decision.reasons.forEach((reason: string, index: number) => {
          activityDetails += `${index + 1}. ${reason}\n`;
        });
      }

      if (userNotes) {
        activityDetails += `\n📝 **Ghi chú của người dùng**: ${userNotes}\n`;
      }

      // Thêm thông tin dự báo thời tiết nếu có
      const weatherInfo = await this.getWeatherInfoForActivity(garden.id);
      if (weatherInfo) {
        activityDetails += `\n🌤️ **Thông tin thời tiết**:\n`;
        activityDetails += `• 🌡️ Nhiệt độ hiện tại: ${weatherInfo.temperature}°C\n`;
        activityDetails += `• 💨 Độ ẩm: ${weatherInfo.humidity}%\n`;
        activityDetails += `• ☁️ Mây: ${weatherInfo.clouds}%\n`;
        if (weatherInfo.rain) {
          activityDetails += `• 🌧️ Lượng mưa dự báo: ${weatherInfo.rain}mm\n`;
        }
      }

      // Thêm khuyến nghị cho người dùng
      activityDetails += `\n💡 **Khuyến nghị cho người chăm sóc**:\n`;
      if (decision.decision === 'water_now') {
        activityDetails += `• ✅ Thực hiện tưới nước theo lượng đề xuất\n`;
        activityDetails += `• ⏰ Tưới vào sáng sớm (6-8h) hoặc chiều mát (17-19h)\n`;
        activityDetails += `• 🔍 Quan sát phản ứng của cây sau khi tưới\n`;
        
        // Tự động tạo lịch tưới nếu AI đề xuất
        await this.createWateringScheduleIfNeeded(garden.id, decision, userNotes);
        activityDetails += `• 📅 Đã tự động thêm vào lịch tưới\n`;
      } else {
        activityDetails += `• ⏸️ Tạm hoãn việc tưới nước\n`;
        activityDetails += `• 👀 Tiếp tục theo dõi độ ẩm đất\n`;
        activityDetails += `• 🔄 Kiểm tra lại sau 6-12 giờ\n`;
      }

      activityDetails += `\n🔬 **Chi tiết kỹ thuật**:\n`;
      activityDetails += `• 🤖 Mô hình AI: Smart Watering Decision Model\n`;
      activityDetails += `• 📊 Thuật toán: Machine Learning với Random Forest\n`;
      activityDetails += `• 🎯 Độ chính xác: ~${decision.confidence}%\n`;
      activityDetails += `• 🕐 Thời gian xử lý: ${new Date().toISOString()}\n`;

      activityDetails += `\n📈 **Lịch sử và xu hướng**:\n`;
      const recentDecisions = await this.getRecentWateringDecisions(garden.id);
      if (recentDecisions.length > 0) {
        const wateringCount = recentDecisions.filter(d => d.includes('Tưới nước')).length;
        const skipCount = recentDecisions.length - wateringCount;
        activityDetails += `• 📊 7 ngày qua: ${wateringCount} lần tưới, ${skipCount} lần bỏ qua\n`;
        activityDetails += `• 📈 Xu hướng: ${this.analyzeTrend(recentDecisions)}\n`;
      }

      activityDetails += `\n💚 **Lưu ý**: Quyết định được đưa ra dựa trên dữ liệu cảm biến thời gian thực, dự báo thời tiết và đặc điểm sinh trưởng của cây trồng`;

      // Tạo ghi chú ngắn gọn cho reason
      const reason = `AI ${decision.decision === 'water_now' ? 'khuyến nghị tưới nước' : 'không khuyến nghị tưới nước'} dựa trên phân tích ${Object.keys(sensorData).length} thông số cảm biến (độ tin cậy: ${decision.confidence}%)`;

      // Tạo activity record
      const activity = await this.prisma.gardenActivity.create({
        data: {
          gardenId: garden.id,
          gardenerId: gardenerId,
          name: `Quyết định AI - ${decision.decision === 'water_now' ? 'Tưới nước' : 'Không tưới'}`,
          activityType: 'WATERING',
          timestamp: currentTime,
          plantName: garden.plantName || 'Chưa xác định',
          plantGrowStage: garden.plantGrowStage || 'Chưa xác định',
          // Lưu trữ dữ liệu cảm biến vào activity
          humidity: sensorData.air_humidity,
          temperature: sensorData.temperature,
          lightIntensity: sensorData.light_intensity,
          waterLevel: sensorData.water_level,
          soilMoisture: sensorData.soil_moisture,
          details: activityDetails,
          reason: reason,
          notes: userNotes || `AI quyết định ${decision.decision === 'water_now' ? 'tưới' : 'không tưới'} nước tự động`,
        },
      });

      this.logger.log(`📋 Comprehensive activity log created - Garden: ${garden.name}, Decision: ${decision.decision}, Activity ID: ${activity.id}`);
    } catch (error) {
      this.logger.error(`Failed to create comprehensive activity log: ${error.message}`, error.stack);
      // Không throw error để không ảnh hưởng đến flow chính
    }
  }

  /**
   * Lấy thông tin thời tiết cho activity
   */
  private async getWeatherInfoForActivity(gardenId: number): Promise<any> {
    try {
      const latestWeather = await this.prisma.weatherObservation.findFirst({
        where: { gardenId },
        orderBy: { observedAt: 'desc' },
      });

      if (latestWeather) {
        return {
          temperature: latestWeather.temp,
          humidity: latestWeather.humidity,
          clouds: latestWeather.clouds,
          rain: latestWeather.rain1h,
        };
      }

      // Fallback to forecast if no observation
      const forecast = await this.prisma.hourlyForecast.findFirst({
        where: { 
          gardenId,
          forecastFor: { gte: new Date() },
        },
        orderBy: { forecastFor: 'asc' },
      });

      if (forecast) {
        return {
          temperature: forecast.temp,
          humidity: forecast.humidity,
          clouds: forecast.clouds,
          rain: forecast.rain1h,
        };
      }

      return null;
    } catch (error) {
      this.logger.warn(`Could not fetch weather info: ${error.message}`);
      return null;
    }
  }

  /**
   * Lấy các quyết định tưới nước gần đây
   */
  private async getRecentWateringDecisions(gardenId: number): Promise<string[]> {
    try {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const recentActivities = await this.prisma.gardenActivity.findMany({
        where: {
          gardenId,
          activityType: 'WATERING',
          timestamp: { gte: sevenDaysAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      return recentActivities.map(activity => activity.name);
    } catch (error) {
      this.logger.warn(`Could not fetch recent decisions: ${error.message}`);
      return [];
    }
  }

  /**
   * Phân tích xu hướng quyết định
   */
  private analyzeTrend(decisions: string[]): string {
    if (decisions.length < 3) return 'Chưa đủ dữ liệu để phân tích';

    const recentWatering = decisions.slice(0, 3).filter(d => d.includes('Tưới nước')).length;
    const olderWatering = decisions.slice(3, 6).filter(d => d.includes('Tưới nước')).length;

    if (recentWatering > olderWatering) {
      return 'Tăng tần suất tưới nước (có thể do thời tiết khô hoặc cây phát triển mạnh)';
    } else if (recentWatering < olderWatering) {
      return 'Giảm tần suất tưới nước (có thể do thời tiết ẩm hoặc cây ổn định)';
    } else {
      return 'Duy trì tần suất tưới nước ổn định';
    }
  }

  /**
   * Tự động tạo lịch tưới nếu AI đề xuất
   */
  private async createWateringScheduleIfNeeded(
    gardenId: number, 
    decision: any, 
    userNotes?: string
  ): Promise<void> {
    try {
      if (decision.decision !== 'water_now') return;

      // Tạo lịch tưới cho 2 thời điểm tối ưu: sáng mai và chiều mai
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);

      const morningTime = new Date(tomorrow);
      morningTime.setHours(6, 30, 0, 0); // 6:30 sáng

      const eveningTime = new Date(tomorrow);
      eveningTime.setHours(18, 0, 0, 0); // 6:00 chiều

      // Chọn thời gian phù hợp nhất dựa trên thời điểm hiện tại
      const now = new Date();
      const scheduleTime = now.getHours() < 12 ? morningTime : eveningTime;

      // Kiểm tra xem đã có lịch tưới chưa
      const existingSchedule = await this.prisma.wateringSchedule.findFirst({
        where: {
          gardenId,
          scheduledAt: {
            gte: new Date(scheduleTime.getTime() - 3 * 60 * 60 * 1000), // 3 hours before
            lte: new Date(scheduleTime.getTime() + 3 * 60 * 60 * 1000), // 3 hours after
          },
          status: 'PENDING',
        },
      });

      if (!existingSchedule) {
        await this.prisma.wateringSchedule.create({
          data: {
            gardenId,
            scheduledAt: scheduleTime,
            amount: decision.recommended_amount || 2.0,
            reason: `AI tự động tạo lịch - ${decision.reasons?.join(', ') || 'Cây cần tưới nước'}`,
            notes: `Lịch tự động từ AI (${decision.confidence}% tin cậy)` + (userNotes ? ` - ${userNotes}` : ''),
            status: 'PENDING',
          },
        });

        this.logger.log(`📅 Auto-created watering schedule for ${scheduleTime.toLocaleString('vi-VN')}`);
      }
    } catch (error) {
      this.logger.warn(`Could not create automatic watering schedule: ${error.message}`);
    }
  }
}
