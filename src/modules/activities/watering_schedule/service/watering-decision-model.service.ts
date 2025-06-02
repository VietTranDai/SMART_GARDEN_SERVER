import { Injectable, NotFoundException, ForbiddenException, InternalServerErrorException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../../../../prisma/prisma.service';
import axios from 'axios';
import { WateringDecisionDto, WateringStatsDto, CreateWateringDecisionDto, SensorDataForRequestModelAIDto } from '../dto/watering-decision-model.dto';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class WateringDecisionModelService {
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('SMART_WATERING_AI_URL', 'http://smart-watering-ai:5001');
  }

  async getWateringDecisionByGarden(userId: number, gardenId: number): Promise<WateringDecisionDto> {
    try {
      // Kiểm tra quyền truy cập vườn
      await this.ensureGardenOwnership(gardenId, userId);

      // Lấy dữ liệu cảm biến mới nhất
      const extendedSensorData = await this.getLatestSensorData(gardenId);

      // Gọi AI model
      const decision = await this.callAIModel(extendedSensorData);

      // Convert back to standard DTO (without water_level)
      const sensorData: SensorDataForRequestModelAIDto = {
        soil_moisture: extendedSensorData.soil_moisture,
        air_humidity: extendedSensorData.air_humidity,
        temperature: extendedSensorData.temperature,
        light_intensity: extendedSensorData.light_intensity,
        water_level: extendedSensorData.water_level,
      };

      return {
        ...decision,
        sensor_data: sensorData,
        timestamp: new Date(),
      };
    } catch (error) {
      if (error instanceof BadRequestException || 
          error instanceof NotFoundException || 
          error instanceof ForbiddenException) {
        throw error;
      }
      console.error('Error getting watering decision:', error);
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

      // Gọi AI model
      const decision = await this.callAIModel(extendedSensorData);

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
  private async ensureGardenOwnership(gardenId: number, userId: number): Promise<void> {
    const garden = await this.prisma.garden.findUnique({ 
      where: { id: gardenId } 
    });
    
    if (!garden) {
      throw new NotFoundException('Không tìm thấy vườn');
    }
    
    if (garden.gardenerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập vườn này');
    }
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

  private async callAIModel(sensorData: SensorDataForRequestModelAIDto): Promise<Omit<WateringDecisionDto, 'sensor_data' | 'timestamp'>> {
    try {
      // Transform data to match AI model format
      const currentTime = new Date();
      const modelData = {
        'soil_moisture_1(%)': sensorData.soil_moisture,
        'soil_moisture_2(%)': sensorData.soil_moisture,
        'temperature(°C)': sensorData.temperature,
        'light_level(lux)': sensorData.light_intensity,
        'water_level(%)': sensorData.water_level || 80.0,
        'hour': currentTime.getHours(),
        'day_of_week': currentTime.getDay() === 0 ? 6 : currentTime.getDay() - 1, // Convert Sunday=0 to Monday=0 format
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
}
