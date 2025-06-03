import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException, Logger } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import axios from 'axios';
import { WateringDecisionDto, WateringStatsDto, CreateWateringDecisionDto, SensorDataForRequestModelAIDto, WateringDecisionRequestDto } from '../dto/watering-decision-model.dto';
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

  async createCustomWateringDecision(
    userId: number, 
    gardenId: number, 
    createDto: CreateWateringDecisionDto
  ): Promise<WateringDecisionDto> {
    try {
      // Kiểm tra quyền truy cập vườn
      await this.ensureGardenOwnership(gardenId, userId);

      // Validate sensor data
      this.validateSensorData(createDto.sensorData);

      // Extend with default water level for AI model
      const extendedSensorData: SensorDataForRequestModelAIDto = {
        ...createDto.sensorData,
        water_level: 80.0, // Default for custom data
      };

      // Gọi AI model với thời gian hiện tại
      const decision = await this.callAIModel(extendedSensorData, new Date());

      return {
        ...decision,
        sensor_data: createDto.sensorData,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error creating custom watering decision:', error);
      throw new InternalServerErrorException('Lỗi khi tạo quyết định tưới nước tùy chỉnh');
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

  private validateSensorData(sensorData: SensorDataForRequestModelAIDto): void {
    const { soil_moisture, air_humidity, temperature, light_intensity, water_level } = sensorData;

    if (soil_moisture < 0 || soil_moisture > 100) {
      throw new BadRequestException('Độ ẩm đất phải từ 0 đến 100%');
    }
    
    if (air_humidity < 0 || air_humidity > 100) {
      throw new BadRequestException('Độ ẩm không khí phải từ 0 đến 100%');
    }
    
    if (temperature < -50 || temperature > 70) {
      throw new BadRequestException('Nhiệt độ phải từ -50 đến 70°C');
    }
    
    if (light_intensity < 0 || light_intensity > 200000) {
      throw new BadRequestException('Cường độ ánh sáng không hợp lệ');
    }

    if (water_level < 0 || water_level > 100) {
      throw new BadRequestException('Mức nước trong bể phải từ 0 đến 100%');
    }
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

      activityDetails += `\n💡 **Lưu ý**: Quyết định được đưa ra dựa trên dữ liệu cảm biến thời gian thực và mô hình AI được huấn luyện`;

      // Tạo ghi chú ngắn gọn cho reason
      const reason = `AI khuyến nghị ${decision.decision === 'water_now' ? 'tưới nước' : 'không tưới nước'} dựa trên dữ liệu cảm biến (độ tin cậy: ${decision.confidence}%)`;

      await this.prisma.gardenActivity.create({
        data: {
          gardenId: garden.id,
          gardenerId: gardenerId,
          name: `Quyết định AI - ${decision.decision === 'water_now' ? 'Tưới nước' : 'Không tưới'}`,
          activityType: 'WATERING',
          timestamp: currentTime,
          plantName: garden.plantName || 'Chưa xác định',
          plantGrowStage: garden.plantGrowStage || 'Chưa xác định',
          details: activityDetails,
          reason: reason,
          notes: userNotes || 'Quyết định tưới nước tự động bằng AI',
        },
      });

      this.logger.log(`📋 Activity log created for watering decision - Garden: ${garden.name}, Decision: ${decision.decision}`);
    } catch (error) {
      this.logger.error(`Failed to create activity log for watering decision: ${error.message}`, error.stack);
      // Không throw error để không ảnh hưởng đến flow chính
    }
  }
}
