import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  PlantAdviceResponseDto,
  GardenInfoDto,
  OverallAssessmentDto,
  ImmediateActionDto,
  CareRecommendationsDto,
  GrowthStageAdviceDto,
  EnvironmentalAdviceDto,
  WeatherConsiderationsDto,
  SeasonalTipsDto,
  CommonIssueDto,
  LearningResourceDto,
  GamificationDto,
  EnvironmentalAdviceDetailDto,
  CareRecommendationDetailDto,
  GamificationTaskDto,
  GamificationAchievementDto,
  WeatherForecastDto,
  DailyWeatherAdviceDto,
} from '../dto/plant-advice.dto';
import {
  Garden,
  Plant,
  GrowthStage,
  Sensor,
  SensorData,
  WeatherObservation,
  DailyForecast,
  HourlyForecast,
} from '@prisma/client';

interface SensorAnalysis {
  temperature: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
  humidity: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
  soilMoisture: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
  light: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
  ph: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
  waterLevel: {
    current: number | null;
    trend: string;
    status: string;
    history: number[];
  };
}

interface WeatherAnalysis {
  current: WeatherObservation | null;
  rainForecast: DailyForecast[];
  temperatureTrend: 'warming' | 'cooling' | 'stable';
  extremeWeather: DailyForecast[];
  weeklyPattern: any;
  hourlyTrends: HourlyForecast[];
  dailyForecasts: DailyForecast[]; // Changed from dailyForecastsAll for consistency
}

@Injectable()
export class PlantAdviceService {
  constructor(private readonly prisma: PrismaService) {}

  async getPlantAdvice(gardenId: number): Promise<PlantAdviceResponseDto> {
    try {
      // Lấy dữ liệu vườn với thông tin chi tiết
      const garden = await this.getDetailedGardenData(gardenId);

      if (!garden) {
        throw new NotFoundException(
          `Xin lỗi, không tìm thấy vườn với ID ${gardenId}. Vui lòng kiểm tra lại!`,
        );
      }

      // Lấy thông tin cây trồng từ database
      const plantData = await this.getPlantInformation(garden.plantName || '');
      const currentGrowthStage = await this.getCurrentGrowthStage(
        plantData,
        garden.plantGrowStage ?? '',
      );

      // Phân tích toàn diện dữ liệu sensor
      const sensorAnalysis = await this.performAdvancedSensorAnalysis(gardenId);

      // Phân tích thời tiết và xu hướng
      const weatherAnalysis = await this.analyzeWeatherPatterns(garden);

      // Phân tích hoạt động chăm sóc gần đây
      const recentCareHistory = await this.analyzeCareHistory(gardenId);

      // Tính toán thông tin cơ bản của vườn
      const gardenInfo = this.buildDetailedGardenInfo(garden);

      // Đánh giá tổng quan với thuật toán thông minh
      const overallAssessment = this.calculateSmartHealthAssessment(
        sensorAnalysis,
        weatherAnalysis,
        currentGrowthStage,
        recentCareHistory,
      );

      // Tạo hành động khẩn cấp với ưu tiên thông minh
      const immediateActions = this.generatePrioritizedActions(
        sensorAnalysis,
        weatherAnalysis,
        currentGrowthStage,
        garden,
      );

      // Tạo khuyến nghị chăm sóc cá nhân hóa
      const careRecommendations = this.generatePersonalizedCareAdvice(
        sensorAnalysis,
        weatherAnalysis,
        currentGrowthStage,
        garden,
        recentCareHistory,
      );

      // Lời khuyên giai đoạn phát triển chi tiết
      const growthStageAdvice = this.generateDetailedGrowthAdvice(
        currentGrowthStage,
        gardenInfo.daysFromPlanting,
        plantData,
      );

      // Lời khuyên môi trường thông minh
      const environmentalAdvice = this.generateSmartEnvironmentalAdvice(
        sensorAnalysis,
        currentGrowthStage,
        weatherAnalysis,
      );

      // Phân tích và khuyến nghị thời tiết
      const weatherConsiderations =
        this.generateWeatherInsights(weatherAnalysis);

      // Mẹo theo mùa địa phương
      const seasonalTips = this.generateLocalSeasonalTips(
        garden,
        weatherAnalysis,
      );

      // Vấn đề thường gặp với giải pháp cụ thể
      const commonIssues = this.generateContextualIssues(
        sensorAnalysis,
        plantData,
        currentGrowthStage,
        weatherAnalysis,
      );

      // Tài nguyên học tập được cá nhân hóa
      const learningResources = this.generateCustomLearningResources(
        garden.plantName ?? '',
        garden.plantGrowStage ?? '',
        overallAssessment.status,
      );

      // Hệ thống gamification nâng cao
      const gamification = await this.generateAdvancedGamification(
        gardenId,
        garden.gardenerId,
      );

      return {
        gardenInfo,
        overallAssessment,
        immediateActions,
        careRecommendations,
        growthStageAdvice,
        environmentalAdvice,
        weatherConsiderations,
        seasonalTips,
        commonIssues,
        learningResources,
        gamification,
      };
    } catch (error) {
      console.error('Error generating plant advice:', error);
      throw new NotFoundException(
        'Xin lỗi, đã có lỗi xảy ra khi tạo lời khuyên. Vui lòng thử lại sau!',
      );
    }
  }

  private async getDetailedGardenData(gardenId: number) {
    return await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        gardener: {
          include: {
            user: true,
            experienceLevel: true,
          },
        },
        sensors: {
          include: {
            sensorData: {
              orderBy: { timestamp: 'desc' },
              take: 20, // Lấy nhiều dữ liệu hơn để phân tích xu hướng
            },
          },
        },
        weatherData: {
          orderBy: { observedAt: 'desc' },
          take: 10,
        },
        dailyForecast: {
          orderBy: { forecastFor: 'asc' },
          where: {
            forecastFor: {
              gte: new Date(),
              lte: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000), // 10 ngày tới
            },
          },
        },
        hourlyForecast: {
          orderBy: { forecastFor: 'asc' },
          where: {
            forecastFor: {
              gte: new Date(),
              lt: new Date(Date.now() + 48 * 60 * 60 * 1000), // 48 giờ tới
            },
          },
        },
        activities: {
          orderBy: { timestamp: 'desc' },
          take: 20,
          include: {
            weatherObservation: true,
          },
        },
        task: {
          where: {
            dueDate: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 ngày gần đây
            },
          },
          orderBy: { dueDate: 'desc' },
          include: {
            photoEvaluations: true,
          },
        },
        wateringSchedule: {
          where: {
            scheduledAt: {
              gte: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 ngày gần đây
            },
          },
          orderBy: { scheduledAt: 'desc' },
        },
      },
    });
  }

  private async getPlantInformation(plantName: string) {
    if (!plantName) return null;

    return await this.prisma.plant.findFirst({
      where: {
        OR: [
          { name: { contains: plantName, mode: 'insensitive' } },
          { scientificName: { contains: plantName, mode: 'insensitive' } },
        ],
      },
      include: {
        growthStages: {
          orderBy: { order: 'asc' },
        },
        PlantType: true,
      },
    });
  }

  private async getCurrentGrowthStage(plantData: any, stageName: string) {
    if (!plantData || !stageName) return null;

    return plantData.growthStages.find(
      (stage) =>
        stage.stageName.toLowerCase().includes(stageName.toLowerCase()) ||
        stageName.toLowerCase().includes(stage.stageName.toLowerCase()),
    );
  }

  private async performAdvancedSensorAnalysis(
    gardenId: number,
  ): Promise<SensorAnalysis> {
    const sensors = await this.prisma.sensor.findMany({
      where: { gardenId },
      include: {
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 50, // Lấy nhiều dữ liệu để phân tích xu hướng chi tiết
        },
      },
    });

    const analysis: SensorAnalysis = {
      temperature: {
        current: null,
        trend: 'stable',
        status: 'unknown',
        history: [],
      },
      humidity: {
        current: null,
        trend: 'stable',
        status: 'unknown',
        history: [],
      },
      soilMoisture: {
        current: null,
        trend: 'stable',
        status: 'unknown',
        history: [],
      },
      light: { current: null, trend: 'stable', status: 'unknown', history: [] },
      ph: { current: null, trend: 'stable', status: 'unknown', history: [] },
      waterLevel: {
        current: null,
        trend: 'stable',
        status: 'unknown',
        history: [],
      },
    };

    for (const sensor of sensors) {
      if (sensor.sensorData.length === 0) continue;

      const values = sensor.sensorData.map((d) => d.value);
      const latest = values[0];
      const trend = this.calculateAdvancedTrend(values);
      const status = this.evaluateSensorStatus(sensor.type, latest, trend);

      switch (sensor.type) {
        case 'TEMPERATURE':
          analysis.temperature = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
        case 'HUMIDITY':
          analysis.humidity = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
        case 'SOIL_MOISTURE':
          analysis.soilMoisture = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
        case 'LIGHT':
          analysis.light = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
        case 'SOIL_PH':
          analysis.ph = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
        case 'WATER_LEVEL':
          analysis.waterLevel = {
            current: latest,
            trend,
            status,
            history: values.slice(0, 10),
          };
          break;
      }
    }

    return analysis;
  }

  private calculateAdvancedTrend(
    values: number[],
  ): 'increasing' | 'decreasing' | 'stable' | 'fluctuating' {
    if (values.length < 5) return 'stable';

    // Tính xu hướng dựa trên độ dốc tuyến tính
    const n = Math.min(values.length, 10);
    const recentValues = values.slice(0, n);

    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    for (let i = 0; i < n; i++) {
      sumX += i;
      sumY += recentValues[i];
      sumXY += i * recentValues[i];
      sumXX += i * i;
    }

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const variance = this.calculateVariance(recentValues);

    // Nếu phương sai quá lớng, coi như dao động
    if (variance > this.getVarianceThreshold(recentValues)) {
      return 'fluctuating';
    }

    if (Math.abs(slope) < 0.1) return 'stable';
    return slope > 0 ? 'increasing' : 'decreasing';
  }

  private calculateVariance(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    const variance =
      values.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) /
      values.length;
    return variance;
  }

  private getVarianceThreshold(values: number[]): number {
    const mean = values.reduce((a, b) => a + b, 0) / values.length;
    return mean * 0.2; // 20% của giá trị trung bình
  }

  private evaluateSensorStatus(
    sensorType: string,
    value: number,
    trend: string,
  ): string {
    const thresholds = this.getSensorThresholds(sensorType);

    let status = 'optimal';

    if (value < thresholds.critical_low || value > thresholds.critical_high) {
      status = 'critical';
    } else if (value < thresholds.low || value > thresholds.high) {
      status =
        trend === 'decreasing' || trend === 'increasing'
          ? 'warning'
          : 'attention';
    } else if (trend === 'fluctuating') {
      status = 'unstable';
    }

    return status;
  }

  private getSensorThresholds(sensorType: string): any {
    const thresholds = {
      TEMPERATURE: { critical_low: 5, low: 15, high: 35, critical_high: 45 },
      HUMIDITY: { critical_low: 20, low: 40, high: 85, critical_high: 95 },
      SOIL_MOISTURE: { critical_low: 20, low: 40, high: 85, critical_high: 95 },
      LIGHT: {
        critical_low: 1000,
        low: 10000,
        high: 80000,
        critical_high: 100000,
      },
      SOIL_PH: { critical_low: 4.0, low: 5.5, high: 8.0, critical_high: 9.0 },
      WATER_LEVEL: { critical_low: 10, low: 30, high: 90, critical_high: 100 },
    };

    return (
      thresholds[sensorType] || {
        critical_low: 0,
        low: 25,
        high: 75,
        critical_high: 100,
      }
    );
  }

  private async analyzeWeatherPatterns(garden: any): Promise<WeatherAnalysis> {
    const current = garden.weatherData[0];
    const dailyForecasts = garden.dailyForecast || []; // Changed from dailyForecastsAll
    const hourlyForecasts = garden.hourlyForecast || [];

    const rainForecast = dailyForecasts.filter(
      (f) => f.weatherMain === 'RAIN' || f.pop > 0.3,
    );
    const extremeWeather = dailyForecasts.filter(
      (f) => f.tempMax > 38 || f.tempMin < 8 || f.windSpeed > 15 || f.pop > 0.8,
    );

    const temperatureTrend = this.analyzeTemperatureTrend(dailyForecasts);
    const weeklyPattern = this.analyzeWeeklyWeatherPattern(dailyForecasts);

    return {
      current,
      rainForecast,
      temperatureTrend,
      extremeWeather,
      weeklyPattern,
      hourlyTrends: hourlyForecasts,
      dailyForecasts, // Added this to be returned
    };
  }

  private analyzeTemperatureTrend(
    forecasts: any[],
  ): 'warming' | 'cooling' | 'stable' {
    if (forecasts.length < 3) return 'stable';

    const avgTemps = forecasts
      .slice(0, 5)
      .map((f) => (f.tempMax + f.tempMin) / 2);
    const firstHalf = avgTemps.slice(0, Math.ceil(avgTemps.length / 2));
    const secondHalf = avgTemps.slice(Math.floor(avgTemps.length / 2));

    const firstAvg = firstHalf.reduce((a, b) => a + b, 0) / firstHalf.length;
    const secondAvg = secondHalf.reduce((a, b) => a + b, 0) / secondHalf.length;

    const change = secondAvg - firstAvg;

    if (change > 3) return 'warming';
    if (change < -3) return 'cooling';
    return 'stable';
  }

  private analyzeWeeklyWeatherPattern(forecasts: any[]): any {
    const rainyDays = forecasts.filter(
      (f) => f.weatherMain === 'RAIN' || f.pop > 0.3,
    ).length;
    const hotDays = forecasts.filter((f) => f.tempMax > 32).length;
    const coolDays = forecasts.filter((f) => f.tempMax < 20).length;

    return {
      rainyDays,
      hotDays,
      coolDays,
      averageTemp:
        forecasts.reduce((acc, f) => acc + (f.tempMax + f.tempMin) / 2, 0) /
        forecasts.length,
      averageRainChance:
        forecasts.reduce((acc, f) => acc + f.pop, 0) / forecasts.length,
    };
  }

  private async analyzeCareHistory(gardenId: number) {
    const recentActivities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId,
        timestamp: {
          gte: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000), // 2 tuần gần đây
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    const wateringActivities = recentActivities.filter(
      (a) => a.activityType === 'WATERING',
    );
    const fertilizingActivities = recentActivities.filter(
      (a) => a.activityType === 'FERTILIZING',
    );
    const lastWatering = wateringActivities[0];
    const lastFertilizing = fertilizingActivities[0];

    return {
      totalActivities: recentActivities.length,
      wateringFrequency: wateringActivities.length,
      fertilizingFrequency: fertilizingActivities.length,
      lastWatering: lastWatering?.timestamp,
      lastFertilizing: lastFertilizing?.timestamp,
      careConsistency: this.calculateCareConsistency(wateringActivities),
      recentActivities: recentActivities.slice(0, 5),
    };
  }

  private calculateCareConsistency(wateringActivities: any[]): number {
    if (wateringActivities.length < 2) return 0;

    const intervals: number[] = []; // Fix: Explicitly type as number[]
    for (let i = 0; i < wateringActivities.length - 1; i++) {
      const interval =
        Math.abs(
          new Date(wateringActivities[i].timestamp).getTime() -
            new Date(wateringActivities[i + 1].timestamp).getTime(),
        ) /
        (1000 * 60 * 60 * 24); // Chuyển đổi thành ngày
      intervals.push(interval);
    }

    const avgInterval = intervals.reduce((a, b) => a + b, 0) / intervals.length;
    const variance =
      intervals.reduce((acc, val) => acc + Math.pow(val - avgInterval, 2), 0) /
      intervals.length;

    // Độ nhất quán cao nếu phương sai thấp
    return Math.max(0, 100 - variance * 10);
  }

  private buildDetailedGardenInfo(garden: any): GardenInfoDto {
    const daysFromPlanting = garden.plantStartDate
      ? Math.floor(
          (Date.now() - new Date(garden.plantStartDate).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    return {
      id: garden.id,
      name: garden.name,
      plantName: garden.plantName || 'Chưa xác định loại cây',
      plantGrowStage: garden.plantGrowStage || 'Chưa xác định giai đoạn',
      daysFromPlanting,
    };
  }

  private calculateSmartHealthAssessment(
    sensorAnalysis: SensorAnalysis,
    weatherAnalysis: WeatherAnalysis,
    growthStage: any,
    careHistory: any,
  ): OverallAssessmentDto {
    let score = 100;
    const issues: string[] = [];
    const positives: string[] = [];

    // Đánh giá dựa trên dữ liệu sensor với trọng số
    const sensorWeights = {
      soilMoisture: 25,
      temperature: 20,
      light: 20,
      humidity: 15,
      ph: 10,
      waterLevel: 10,
    };

    Object.entries(sensorAnalysis).forEach(([key, data]: [string, any]) => {
      if (data.current === null) return;

      const weight = sensorWeights[key] || 5;
      const sensorName = this.getFriendlySensorName(key);

      switch (data.status) {
        case 'critical':
          score -= weight;
          issues.push(`${sensorName} đang ở mức nguy hiểm và cần xử lý ngay`);
          break;
        case 'warning':
          score -= weight * 0.7;
          issues.push(`${sensorName} cần được điều chỉnh sớm`);
          break;
        case 'attention':
          score -= weight * 0.4;
          issues.push(`${sensorName} cần theo dõi thêm`);
          break;
        case 'unstable':
          score -= weight * 0.3;
          issues.push(`${sensorName} đang dao động, cần ổn định`);
          break;
        case 'optimal':
          positives.push(`${sensorName} đang ở mức tuyệt vời`);
          break;
      }
    });

    // Đánh giá thời tiết
    if (weatherAnalysis.extremeWeather.length > 0) {
      score -= 15;
      issues.push('Thời tiết khắc nghiệt sắp tới, cần chuẩn bị');
    } else if (weatherAnalysis.rainForecast.length > 0) {
      positives.push('Thời tiết thuận lợi với mưa nhẹ');
    }

    // Đánh giá lịch sử chăm sóc
    if (careHistory.careConsistency > 80) {
      positives.push('Bạn đang chăm sóc rất đều đặn');
    } else if (careHistory.careConsistency < 40) {
      score -= 10;
      issues.push('Lịch chăm sóc chưa đều đặn');
    }

    // Đánh giá theo giai đoạn phát triển
    if (growthStage) {
      const tempStatus = sensorAnalysis.temperature.current;
      if (
        tempStatus &&
        tempStatus >= growthStage.optimalTemperatureMin &&
        tempStatus <= growthStage.optimalTemperatureMax
      ) {
        positives.push('Nhiệt độ phù hợp với giai đoạn phát triển');
      }
    }

    score = Math.max(0, Math.min(100, score));

    let status: 'EXCELLENT' | 'GOOD' | 'FAIR' | 'POOR' | 'CRITICAL';
    let statusMessage: string;

    if (score >= 90) {
      status = 'EXCELLENT';
      statusMessage =
        '🌟 Tuyệt vời! Cây của bạn đang phát triển rất khỏe mạnh!';
    } else if (score >= 75) {
      status = 'GOOD';
      statusMessage = '😊 Rất tốt! Cây đang phát triển ổn định và khỏe mạnh.';
    } else if (score >= 60) {
      status = 'FAIR';
      statusMessage =
        '🤔 Ổn định. Cây đang phát triển bình thường nhưng có thể cải thiện thêm.';
    } else if (score >= 40) {
      status = 'POOR';
      statusMessage =
        '😟 Cần chú ý! Cây đang gặp một số vấn đề và cần chăm sóc kỹ hơn.';
    } else {
      status = 'CRITICAL';
      statusMessage =
        '🚨 Khẩn cấp! Cây đang trong tình trạng nguy hiểm và cần hành động ngay!';
    }

    let summary = statusMessage;

    if (positives.length > 0) {
      summary += ` Điểm tích cực: ${positives.join(', ')}.`;
    }

    if (issues.length > 0) {
      summary += ` Cần lưu ý: ${issues.join(', ')}.`;
    }

    return {
      healthScore: Math.round(score),
      status,
      summary,
    };
  }

  private getFriendlySensorName(sensorKey: string): string {
    const names = {
      temperature: 'Nhiệt độ',
      humidity: 'Độ ẩm không khí',
      soilMoisture: 'Độ ẩm đất',
      light: 'Ánh sáng',
      ph: 'Độ pH đất',
      waterLevel: 'Mực nước',
    };
    return names[sensorKey] || sensorKey;
  }

  private generatePrioritizedActions(
    sensorAnalysis: SensorAnalysis,
    weatherAnalysis: WeatherAnalysis,
    growthStage: any,
    garden: any,
  ): ImmediateActionDto[] {
    const actions: ImmediateActionDto[] = [];

    // Hành động khẩn cấp cho độ ẩm đất
    if (sensorAnalysis.soilMoisture.current !== null) {
      const moisture = sensorAnalysis.soilMoisture.current;
      const trend = sensorAnalysis.soilMoisture.trend;

      if (moisture < 25) {
        actions.push({
          priority: 'HIGH',
          category: 'WATERING',
          title: '🚨 Tưới nước khẩn cấp ngay lập tức!',
          description: `Đất đang rất khô (${moisture.toFixed(1)}%)! Cây có thể bị héo nếu không được tưới ngay. ${trend === 'decreasing' ? 'Độ ẩm đang giảm nhanh!' : ''}`,
          suggestedAmount: '2-3 lít, tưới từ từ nhiều lần trong ngày',
          timeFrame: 'Ngay bây giờ',
          reason:
            'Cây cần nước để duy trì sự sống. Độ ẩm đất quá thấp có thể gây tổn thương vĩnh viễn cho rễ.',
        });
      } else if (moisture < 40) {
        actions.push({
          priority: 'MEDIUM',
          category: 'WATERING',
          title: '💧 Cần tưới nước sớm',
          description: `Độ ẩm đất đang thấp (${moisture.toFixed(1)}%). ${trend === 'decreasing' ? 'Đang có xu hướng giảm tiếp.' : 'Cây sẽ cần nước trong thời gian tới.'}`,
          suggestedAmount: '1.5-2 lít',
          timeFrame: 'Trong 3-6 giờ tới',
          reason: 'Duy trì độ ẩm tối ưu giúp cây hấp thụ dinh dưỡng tốt hơn.',
        });
      } else if (moisture > 90) {
        actions.push({
          priority: 'HIGH',
          category: 'DRAINAGE',
          title: '⚠️ Ngưng tưới nước - Nguy cơ úng rễ!',
          description: `Đất quá ướt (${moisture.toFixed(1)}%)! Nguy cơ cao bị thối rễ. ${trend === 'increasing' ? 'Độ ẩm vẫn đang tăng!' : ''}`,
          timeFrame: 'Ngay bây giờ',
          reason:
            'Úng nước là một trong những nguyên nhân chính gây chết cây. Rễ cần có không khí để thở.',
        });
      }
    }

    // Hành động cho nhiệt độ
    if (sensorAnalysis.temperature.current !== null) {
      const temp = sensorAnalysis.temperature.current;
      const trend = sensorAnalysis.temperature.trend;

      if (temp > 40) {
        actions.push({
          priority: 'HIGH',
          category: 'COOLING',
          title: '🔥 Hạ nhiệt độ ngay lập tức!',
          description: `Nhiệt độ quá cao (${temp.toFixed(1)}°C)! ${trend === 'increasing' ? 'Nhiệt độ đang tiếp tục tăng!' : 'Cây có thể bị cháy lá.'} Cần hành động ngay để bảo vệ cây.`,
          timeFrame: 'Ngay bây giờ',
          reason:
            'Nhiệt độ cao có thể làm cháy lá, mất nước nhanh và gây stress nghiêm trọng cho cây.',
        });
      } else if (temp < 10) {
        actions.push({
          priority: 'HIGH',
          category: 'WARMING',
          title: '🥶 Bảo vệ cây khỏi lạnh!',
          description: `Nhiệt độ quá thấp (${temp.toFixed(1)}°C)! ${trend === 'decreasing' ? 'Nhiệt độ đang tiếp tục giảm!' : 'Cây có thể bị tổn thương do lạnh.'}`,
          timeFrame: 'Trong 1 giờ tới',
          reason:
            'Nhiệt độ thấp làm chậm quá trình trao đổi chất và có thể gây tổn thương tế bào.',
        });
      }
    }

    // Hành động dựa trên thời tiết
    if (weatherAnalysis.extremeWeather.length > 0) {
      const nextExtreme = weatherAnalysis.extremeWeather[0];
      const hoursUntil = Math.round(
        (new Date(nextExtreme.forecastFor).getTime() - Date.now()) /
          (1000 * 60 * 60),
      );

      if (hoursUntil <= 48) {
        let weatherType = 'thời tiết khắc nghiệt';
        let preparation = 'chuẩn bị bảo vệ cây';

        if (nextExtreme.tempMax > 38) {
          weatherType = 'nắng nóng gay gắt';
          preparation = 'che chắn và tăng tưới nước';
        } else if (nextExtreme.windSpeed > 15) {
          weatherType = 'gió mạnh';
          preparation = 'cố định cây và che chắn';
        } else if (nextExtreme.pop > 0.8) {
          weatherType = 'mưa to';
          preparation = 'che mưa và đảm bảo thoát nước';
        }

        actions.push({
          priority: 'MEDIUM',
          category: 'WEATHER_PREP',
          title: `⛈️ Chuẩn bị cho ${weatherType}`,
          description: `Dự báo có ${weatherType} trong ${hoursUntil} giờ tới. Hãy ${preparation} để bảo vệ cây tốt nhất.`,
          timeFrame: `${hoursUntil} giờ tới`,
          reason: `${weatherType.charAt(0).toUpperCase() + weatherType.slice(1)} có thể gây tổn hại nghiêm trọng cho cây nếu không được chuẩn bị kỹ.`,
        });
      }
    }

    // Hành động dựa trên ánh sáng
    if (sensorAnalysis.light.current !== null) {
      const light = sensorAnalysis.light.current;

      if (light < 5000) {
        actions.push({
          priority: 'MEDIUM',
          category: 'LIGHTING',
          title: '💡 Cần bổ sung ánh sáng',
          description: `Ánh sáng quá yếu (${light.toLocaleString()} lux). Cây có thể phát triển chậm và yếu đuối.`,
          timeFrame: 'Trong ngày hôm nay',
          reason:
            'Ánh sáng là yếu tố quan trọng cho quá trình quang hợp và phát triển của cây.',
        });
      }
    }

    // Sắp xếp theo độ ưu tiên
    return actions.sort((a, b) => {
      const priorityOrder = { HIGH: 3, MEDIUM: 2, LOW: 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }

  private generatePersonalizedCareAdvice(
    sensorAnalysis: SensorAnalysis,
    weatherAnalysis: WeatherAnalysis,
    growthStage: any,
    garden: any,
    careHistory: any,
  ): CareRecommendationsDto {
    const watering = this.generateAdvancedWateringAdvice(
      sensorAnalysis,
      weatherAnalysis,
      growthStage,
      careHistory,
    );

    const fertilizing = this.generateIntelligentFertilizingAdvice(
      growthStage,
      garden,
      careHistory,
      sensorAnalysis,
    );

    const pestControl = this.generateSmartPestControlAdvice(
      sensorAnalysis,
      weatherAnalysis,
      garden,
    );

    return {
      watering,
      fertilizing,
      pest_control: pestControl,
    };
  }

  private generateAdvancedWateringAdvice(
    sensorAnalysis: SensorAnalysis,
    weatherAnalysis: WeatherAnalysis,
    growthStage: any,
    careHistory: any,
  ) {
    let baseFrequency = 2; // Ngày
    let baseAmount = 1.5; // Lít

    // Điều chỉnh dựa trên độ ẩm đất hiện tại
    if (sensorAnalysis.soilMoisture.current !== null) {
      const moisture = sensorAnalysis.soilMoisture.current;
      const trend = sensorAnalysis.soilMoisture.trend;

      if (moisture < 40) {
        baseFrequency = 1; // Hằng ngày
        baseAmount = 2.5;
      } else if (moisture > 80) {
        baseFrequency = 4; // Mỗi 4 ngày
        baseAmount = 1.0;
      }

      // Điều chỉnh theo xu hướng
      if (trend === 'decreasing') {
        baseFrequency = Math.max(1, baseFrequency - 0.5);
      } else if (trend === 'increasing') {
        baseFrequency += 0.5;
      }
    }

    // Điều chỉnh dựa trên nhiệt độ
    if (sensorAnalysis.temperature.current !== null) {
      const temp = sensorAnalysis.temperature.current;
      if (temp > 30) {
        baseAmount *= 1.3;
        baseFrequency = Math.max(1, baseFrequency - 0.5);
      } else if (temp < 20) {
        baseAmount *= 0.8;
        baseFrequency += 0.5;
      }
    }

    // Điều chỉnh dựa trên thời tiết
    const upcomingRain = weatherAnalysis.rainForecast.filter(
      (f) =>
        new Date(f.forecastFor).getTime() - Date.now() <=
        2 * 24 * 60 * 60 * 1000,
    );

    if (upcomingRain.length > 0) {
      baseFrequency += 1;
      baseAmount *= 0.7;
    }

    // Điều chỉnh dựa trên giai đoạn phát triển
    if (growthStage) {
      if (growthStage.stageName.toLowerCase().includes('hoa')) {
        baseAmount *= 1.2; // Giai đoạn ra hoa cần nhiều nước hơn
      } else if (growthStage.stageName.toLowerCase().includes('quả')) {
        baseAmount *= 1.1;
      }
    }

    const nextSchedule = new Date(
      Date.now() + baseFrequency * 24 * 60 * 60 * 1000,
    );

    const frequencyText =
      baseFrequency === 1
        ? 'Hằng ngày'
        : baseFrequency <= 2
          ? 'Mỗi 1-2 ngày'
          : baseFrequency <= 3
            ? 'Mỗi 2-3 ngày'
            : 'Mỗi 3-4 ngày';

    const tips = [
      `💧 Tưới ${baseAmount.toFixed(1)} lít mỗi lần, chia thành nhiều lần nhỏ để nước thấm đều`,
      '🌅 Thời gian tốt nhất: Sáng sớm (6-7h) hoặc chiều mát (17-18h)',
      '👋 Kiểm tra độ ẩm bằng cách nhúng ngón tay xuống đất 3-5cm',
      '🍃 Tưới gốc cây, tránh tưới lên lá để giảm nguy cơ bệnh nấm',
    ];

    // Thêm tips dựa trên phân tích
    if (sensorAnalysis.soilMoisture.trend === 'fluctuating') {
      tips.push('📊 Độ ẩm đất đang dao động, hãy tưới ít và thường xuyên hơn');
    }

    if (careHistory.careConsistency < 60) {
      tips.push('⏰ Lập lịch tưới nước cố định để cây phát triển ổn định hơn');
    }

    if (weatherAnalysis.temperatureTrend === 'warming') {
      tips.push(
        '🌡️ Nhiệt độ đang tăng, cần theo dõi và tăng lượng nước nếu cần',
      );
    }

    return {
      nextSchedule: nextSchedule.toISOString(),
      frequency: frequencyText,
      amount: `${baseAmount.toFixed(1)} lít/lần`,
      bestTime: 'Sáng sớm (6-7h) hoặc chiều mát (17-18h)',
      tips,
    };
  }

  private generateIntelligentFertilizingAdvice(
    growthStage: any,
    garden: any,
    careHistory: any,
    sensorAnalysis: SensorAnalysis,
  ) {
    let fertilizerType = 'NPK cân bằng (10-10-10)';
    let amount = '25g cho mỗi cây';
    let frequencyDays = 21; // 3 tuần

    // Điều chỉnh theo giai đoạn phát triển
    if (growthStage) {
      if (
        growthStage.stageName.toLowerCase().includes('mầm') ||
        growthStage.stageName.toLowerCase().includes('lá')
      ) {
        fertilizerType = 'Phân giàu Nitrogen (15-5-10) - Thúc đẩy lá xanh';
        amount = '20g cho mỗi cây';
        frequencyDays = 14;
      } else if (growthStage.stageName.toLowerCase().includes('hoa')) {
        fertilizerType = 'Phân giàu Phosphorus (5-15-10) - Thúc đẩy ra hoa';
        amount = '30g cho mỗi cây';
        frequencyDays = 18;
      } else if (growthStage.stageName.toLowerCase().includes('quả')) {
        fertilizerType = 'Phân giàu Potassium (10-5-15) - Chắc quả ngọt';
        amount = '35g cho mỗi cây';
        frequencyDays = 16;
      }
    }

    // Điều chỉnh dựa trên pH đất
    if (sensorAnalysis.ph.current !== null) {
      if (sensorAnalysis.ph.current < 6.0) {
        fertilizerType += ' + Vôi bột để tăng pH';
      } else if (sensorAnalysis.ph.current > 7.5) {
        fertilizerType += ' + Lưu huỳnh để giảm pH';
      }
    }

    const nextSchedule = new Date(
      Date.now() + frequencyDays * 24 * 60 * 60 * 1000,
    );
    const frequencyText =
      frequencyDays <= 14
        ? 'Mỗi 2 tuần'
        : frequencyDays <= 21
          ? 'Mỗi 3 tuần'
          : 'Mỗi tháng';

    const tips = [
      `🌱 Sử dụng ${fertilizerType} để phù hợp với giai đoạn phát triển`,
      '💧 Bón phân sau khi tưới nước để tránh cháy rễ',
      '🔄 Trộn đều phân với đất xung quanh gốc cây, không bón sát thân',
      '⏰ Bón phân vào buổi chiều mát để cây hấp thụ tốt nhất',
    ];

    if (growthStage?.nutrientRequirement) {
      tips.push(
        `📋 Giai đoạn này cây đặc biệt cần: ${growthStage.nutrientRequirement}`,
      );
    }

    if (
      sensorAnalysis.ph.status === 'attention' ||
      sensorAnalysis.ph.status === 'critical'
    ) {
      tips.push('⚖️ Điều chỉnh pH đất để cây hấp thụ dinh dưỡng tốt hơn');
    }

    if (careHistory.fertilizingFrequency === 0) {
      tips.push('🆕 Bắt đầu bón phân từ từ, lượng nhỏ trước để cây quen dần');
    }

    return {
      nextSchedule: nextSchedule.toISOString(),
      type: fertilizerType,
      amount,
      frequency: frequencyText,
      tips,
    };
  }

  private generateSmartPestControlAdvice(
    sensorAnalysis: SensorAnalysis,
    weatherAnalysis: WeatherAnalysis,
    garden: any,
  ) {
    let riskLevel: 'LOW' | 'MEDIUM' | 'HIGH' = 'LOW';
    let riskFactors = 0;

    // Đánh giá rủi ro dựa trên điều kiện môi trường
    if (
      sensorAnalysis.humidity.current !== null &&
      sensorAnalysis.humidity.current > 85
    ) {
      riskFactors += 2;
    }

    if (
      sensorAnalysis.temperature.current !== null &&
      sensorAnalysis.temperature.current > 28 &&
      sensorAnalysis.humidity.current !== null &&
      sensorAnalysis.humidity.current > 75
    ) {
      riskFactors += 2; // Điều kiện thuận lợi cho sâu bệnh
    }

    if (weatherAnalysis.weeklyPattern?.rainyDays > 3) {
      riskFactors += 1; // Mưa nhiều tăng nguy cơ nấm
    }

    if (
      sensorAnalysis.soilMoisture.current !== null &&
      sensorAnalysis.soilMoisture.current > 85
    ) {
      riskFactors += 1; // Đất quá ướt
    }

    // Xác định mức độ rủi ro
    if (riskFactors >= 4) riskLevel = 'HIGH';
    else if (riskFactors >= 2) riskLevel = 'MEDIUM';

    let commonPests = ['Rệp xanh', 'Sâu cuốn lá', 'Bọ trĩ'];
    let prevention = [
      '👀 Kiểm tra lá và thân cây mỗi sáng',
      '🌬️ Đảm bảo thông thoáng quanh cây',
      '🧹 Vệ sinh vườn sạch sẽ, loại bỏ lá vàng chết',
    ];

    let organicSolutions = [
      '🧄 Nước tỏi pha loãng (1:10) xịt vào buổi chiều',
      '🧼 Dung dịch xà phòng sinh học (1 muỗng/lít nước)',
      '🌿 Dầu neem pha loãng theo hướng dẫn',
    ];

    // Điều chỉnh dựa trên mức độ rủi ro
    if (riskLevel === 'HIGH') {
      commonPests.push('Nấm phấn trắng', 'Bệnh đốm lá');
      prevention = [
        '🔍 Kiểm tra cây 2 lần/ngày (sáng và chiều)',
        '🌬️ Tăng cường thông gió, giảm độ ẩm',
        '✂️ Cắt tỉa lá dày để tăng lưu thông không khí',
        '🚫 Tránh tưới nước vào lá, chỉ tưới gốc',
        '🧹 Vệ sinh công cụ trước khi sử dụng',
      ];
      organicSolutions.push('🦠 Cân nhắc sử dụng thuốc sinh học phòng bệnh');
      organicSolutions.push(
        '🍄 Xịt dung dịch nấm Trichoderma để phòng bệnh đất',
      );
    } else if (riskLevel === 'MEDIUM') {
      prevention.push('⚠️ Tăng tần suất kiểm tra lên mỗi ngày');
      prevention.push('💨 Cải thiện thông gió xung quanh cây');
    }

    // Thêm lời khuyên dựa trên thời tiết
    if (weatherAnalysis.temperatureTrend === 'warming') {
      prevention.push(
        '🌡️ Nhiệt độ tăng có thể làm sâu bệnh phát triển nhanh hơn',
      );
    }

    if (weatherAnalysis.weeklyPattern?.rainyDays > 3) {
      organicSolutions.push('☔ Che mưa để giảm độ ẩm và nguy cơ nấm bệnh');
    }

    const riskMessages = {
      LOW: '✅ Rủi ro sâu bệnh thấp, tiếp tục phòng ngừa cơ bản',
      MEDIUM: '⚠️ Rủi ro sâu bệnh trung bình, cần theo dõi kỹ hơn',
      HIGH: '🚨 Rủi ro sâu bệnh cao, cần phòng ngừa tích cực',
    };

    return {
      riskLevel,
      riskAssessment: riskMessages[riskLevel],
      commonPests,
      prevention,
      organicSolutions,
    };
  }

  // Tiếp tục với các phương thức còn lại...
  private generateDetailedGrowthAdvice(
    growthStage: any,
    daysFromPlanting: number,
    plantData: any,
  ): GrowthStageAdviceDto {
    if (!growthStage) {
      const defaultKeyFocus: string[] = [
        'Theo dõi sự phát triển hàng ngày của cây',
        'Cung cấp chăm sóc cơ bản về nước và ánh sáng',
        'Ghi chép lại những thay đổi để xác định giai đoạn',
      ];
      const defaultPreparation: string[] = [
        'Tiếp tục quan sát và chăm sóc cây một cách tận tâm',
      ];
      return {
        currentStage: 'Chưa xác định giai đoạn',
        stageDescription:
          'Chúng tôi chưa có thông tin về giai đoạn phát triển hiện tại của cây. Hãy cập nhật thông tin để nhận được lời khuyên tốt nhất! 🌱',
        keyFocus: defaultKeyFocus,
        expectedDuration: 'Cần xác định giai đoạn hiện tại',
        nextStage: 'Sẽ cập nhật khi có thông tin',
        preparation: defaultPreparation,
      };
    }

    const stageStartDay = this.calculateStageStartDay(
      growthStage,
      plantData,
      daysFromPlanting,
    );
    const daysInStage = daysFromPlanting - stageStartDay;
    const remainingDays = Math.max(0, growthStage.duration - daysInStage);
    const progressPercent = Math.min(
      100,
      (daysInStage / (growthStage.duration || 1)) * 100, // Avoid division by zero if duration is 0 or undefined
    );

    const keyFocus: string[] = [];

    // Thêm focus về nhiệt độ
    if (
      growthStage.optimalTemperatureMin &&
      growthStage.optimalTemperatureMax
    ) {
      keyFocus.push(
        `🌡️ Duy trì nhiệt độ ${growthStage.optimalTemperatureMin}-${growthStage.optimalTemperatureMax}°C cho sự phát triển tối ưu`,
      );
    }

    // Thêm focus về độ ẩm đất
    if (
      growthStage.optimalSoilMoistureMin &&
      growthStage.optimalSoilMoistureMax
    ) {
      keyFocus.push(
        `💧 Giữ độ ẩm đất ở mức ${growthStage.optimalSoilMoistureMin}-${growthStage.optimalSoilMoistureMax}% để rễ phát triển tốt`,
      );
    }

    // Thêm focus về ánh sáng
    if (growthStage.lightRequirement) {
      keyFocus.push(
        `☀️ Đảm bảo ${growthStage.lightRequirement.toLowerCase()} cho quá trình quang hợp`,
      );
    }

    // Thêm focus về nước
    if (growthStage.waterRequirement) {
      keyFocus.push(
        `🌊 Chế độ tưới nước: ${growthStage.waterRequirement.toLowerCase()}`,
      );
    }

    // Thêm focus về dinh dưỡng
    if (growthStage.nutrientRequirement) {
      keyFocus.push(
        `🌿 Bổ sung dinh dưỡng: ${growthStage.nutrientRequirement}`,
      );
    }

    const nextStage = this.findNextGrowthStage(growthStage, plantData);
    const preparation: string[] = [];

    if (remainingDays <= 7 && remainingDays > 0) {
      preparation.push(
        '🔄 Chuẩn bị chuyển sang giai đoạn tiếp theo trong vài ngày tới',
      );
      if (nextStage) {
        preparation.push(
          `📋 Tìm hiểu về giai đoạn "${nextStage.stageName}" để chuẩn bị thay đổi chế độ chăm sóc`,
        );
      }
    }

    if (growthStage.careInstructions) {
      preparation.push(`📝 Lưu ý đặc biệt: ${growthStage.careInstructions}`);
    }

    if (growthStage.pestSusceptibility) {
      preparation.push(
        `🐛 Chú ý phòng chống: ${growthStage.pestSusceptibility}`,
      );
    }

    // Thêm lời khuyên dựa trên tiến độ giai đoạn
    if (progressPercent < 25) {
      preparation.push(
        '🌱 Giai đoạn đầu, tập trung vào việc tạo nền tảng vững chắc',
      );
    } else if (progressPercent < 75) {
      preparation.push(
        '💪 Giai đoạn phát triển, tăng cường chăm sóc để cây khỏe mạnh',
      );
    } else {
      preparation.push('🎯 Giai đoạn cuối, chuẩn bị cho bước tiếp theo');
    }

    return {
      currentStage: growthStage.stageName,
      stageDescription:
        growthStage.description ||
        `Cây đang trong giai đoạn ${growthStage.stageName} - một thời kỳ quan trọng trong chu kỳ phát triển. Hiện tại đã hoàn thành ${progressPercent.toFixed(1)}% giai đoạn này! 🌿`,
      keyFocus, // Assign the explicitly typed array
      expectedDuration:
        remainingDays > 0
          ? `${remainingDays} ngày nữa (${progressPercent.toFixed(1)}% hoàn thành)`
          : 'Đã hoàn thành giai đoạn',
      nextStage: nextStage
        ? nextStage.stageName
        : 'Đang xác định giai đoạn tiếp theo',
      preparation, // Assign the explicitly typed array
    };
  }

  private calculateStageStartDay(
    growthStage: any,
    plantData: any,
    daysFromPlanting: number,
  ): number {
    if (!plantData?.growthStages) return 0;

    const stages = plantData.growthStages.sort((a, b) => a.order - b.order);
    let totalDays = 0;

    for (const stage of stages) {
      if (stage.id === growthStage.id) {
        return totalDays;
      }
      totalDays += stage.duration;
    }

    return 0;
  }

  private findNextGrowthStage(currentStage: any, plantData: any) {
    if (!plantData?.growthStages) return null;

    const stages = plantData.growthStages.sort((a, b) => a.order - b.order);
    const currentIndex = stages.findIndex(
      (stage) => stage.id === currentStage.id,
    );

    return currentIndex >= 0 && currentIndex < stages.length - 1
      ? stages[currentIndex + 1]
      : null;
  }

  private generateSmartEnvironmentalAdvice(
    sensorAnalysis: SensorAnalysis,
    growthStage: any,
    weatherAnalysis: WeatherAnalysis,
  ): EnvironmentalAdviceDto {
    const advice: EnvironmentalAdviceDto = {
      // Initialize optional properties to undefined if not immediately set
      temperature: undefined,
      humidity: undefined,
      light: undefined,
      soilMoisture: undefined, // Added to ensure all DTO fields are covered
      soilPH: undefined, // Changed from ph to soilPH to match DTO
    };

    // Nhiệt độ với lời khuyên chi tiết
    if (sensorAnalysis.temperature.current !== null) {
      const temp = sensorAnalysis.temperature.current;
      const optimalMin = growthStage?.optimalTemperatureMin || 18;
      const optimalMax = growthStage?.optimalTemperatureMax || 32;
      const trend = sensorAnalysis.temperature.trend;

      let status: 'OPTIMAL' | 'NEEDS_ATTENTION' = 'OPTIMAL';
      let adviceText = `🌡️ Nhiệt độ hiện tại ${temp.toFixed(1)}°C rất phù hợp! Cây đang cảm thấy thoải mái.`;

      if (temp < optimalMin) {
        status = 'NEEDS_ATTENTION';
        const tempDiff = optimalMin - temp;
        adviceText = `🧊 Nhiệt độ hơi thấp (thiếu ${tempDiff.toFixed(1)}°C). `;

        if (tempDiff > 10) {
          adviceText +=
            'Hãy di chuyển cây vào trong nhà hoặc sử dụng đèn sưởi. ';
        } else {
          adviceText +=
            'Có thể che chắn gió lạnh hoặc di chuyển đến nơi ấm hơn. ';
        }

        if (trend === 'decreasing') {
          adviceText += 'Nhiệt độ đang giảm tiếp, cần hành động sớm!';
        }
      } else if (temp > optimalMax) {
        status = 'NEEDS_ATTENTION';
        const tempDiff = temp - optimalMax;
        adviceText = `🔥 Nhiệt độ hơi cao (vượt ${tempDiff.toFixed(1)}°C). `;

        if (tempDiff > 8) {
          adviceText += 'Cần che chắn ngay và tăng tưới nước để làm mát. ';
        } else {
          adviceText += 'Hãy tăng thông gió hoặc di chuyển đến nơi mát hơn. ';
        }

        if (trend === 'increasing') {
          adviceText += 'Nhiệt độ đang tăng tiếp, cần hành động ngay!';
        }
      }

      advice.temperature = {
        status,
        current: `${temp.toFixed(1)}°C`,
        optimalRange: `${optimalMin}-${optimalMax}°C`,
        advice: adviceText,
      };
    }

    // Độ ẩm không khí với phân tích chi tiết
    if (sensorAnalysis.humidity.current !== null) {
      const humidity = sensorAnalysis.humidity.current;
      const optimalMin = growthStage?.optimalHumidityMin || 60;
      const optimalMax = growthStage?.optimalHumidityMax || 80;
      const trend = sensorAnalysis.humidity.trend;

      let status: 'OPTIMAL' | 'NEEDS_ATTENTION' = 'OPTIMAL';
      let adviceText = `💨 Độ ẩm không khí ${humidity.toFixed(1)}% - tuyệt vời cho sự phát triển của cây!`;

      if (humidity < optimalMin) {
        status = 'NEEDS_ATTENTION';
        const humidityDiff = optimalMin - humidity;
        adviceText = `🏜️ Độ ẩm không khí thấp (thiếu ${humidityDiff.toFixed(1)}%). `;

        if (humidityDiff > 20) {
          adviceText +=
            'Hãy phun sương 2-3 lần/ngày và đặt khay nước xung quanh cây. ';
        } else {
          adviceText += 'Có thể phun sương nhẹ vào buổi sáng và chiều. ';
        }

        if (trend === 'decreasing') {
          adviceText += 'Độ ẩm đang giảm, cần tăng cường phun sương!';
        }
      } else if (humidity > optimalMax) {
        status = 'NEEDS_ATTENTION';
        const humidityDiff = humidity - optimalMax;
        adviceText = `🌊 Độ ẩm không khí cao (vượt ${humidityDiff.toFixed(1)}%). `;

        if (humidityDiff > 15) {
          adviceText +=
            'Cần tăng thông gió mạnh và cắt tỉa lá dày để tránh nấm mốc. ';
        } else {
          adviceText += 'Hãy tăng thông gió để giảm nguy cơ bệnh nấm. ';
        }

        if (trend === 'increasing') {
          adviceText += 'Độ ẩm đang tăng, nguy cơ nấm bệnh cao!';
        }
      }

      advice.humidity = {
        status,
        current: `${humidity.toFixed(1)}%`,
        optimal: `${optimalMin}-${optimalMax}%`,
        advice: adviceText,
      };
    }

    // Ánh sáng với đánh giá thông minh
    if (sensorAnalysis.light.current !== null) {
      const light = sensorAnalysis.light.current;
      const optimalMin = growthStage?.optimalLightMin || 20000;
      const optimalMax = growthStage?.optimalLightMax || 70000;
      const trend = sensorAnalysis.light.trend;

      let status: 'ADEQUATE' | 'NEEDS_ATTENTION' = 'ADEQUATE';
      let adviceText = `☀️ Ánh sáng ${light.toLocaleString()} lux - hoàn hảo cho quá trình quang hợp!`;

      if (light < optimalMin) {
        status = 'NEEDS_ATTENTION';
        const lightRatio = ((optimalMin - light) / optimalMin) * 100;
        adviceText = `🌙 Ánh sáng yếu (thiếu ${lightRatio.toFixed(1)}% so với mức tối ưu). `;

        if (lightRatio > 50) {
          adviceText += 'Cần bổ sung đèn LED phổ đầy đủ ngay lập tức. ';
        } else {
          adviceText +=
            'Hãy di chuyển cây ra gần cửa sổ hoặc bổ sung đèn LED. ';
        }

        if (trend === 'decreasing') {
          adviceText += 'Ánh sáng đang giảm, có thể do thời tiết u ám!';
        }
      } else if (light > optimalMax) {
        status = 'NEEDS_ATTENTION';
        const lightRatio = ((light - optimalMax) / optimalMax) * 100;
        adviceText = `🔆 Ánh sáng quá mạnh (vượt ${lightRatio.toFixed(1)}%). `;

        if (lightRatio > 30) {
          adviceText += 'Cần che chắn ngay để tránh cháy lá. ';
        } else {
          adviceText += 'Hãy che bớt ánh sáng trực tiếp vào buổi trưa. ';
        }

        if (trend === 'increasing') {
          adviceText += 'Ánh sáng đang tăng, nguy cơ cháy lá cao!';
        }
      }

      advice.light = {
        status,
        current: `${light.toLocaleString()} lux`,
        optimal: `${optimalMin.toLocaleString()}-${optimalMax.toLocaleString()} lux`,
        advice: adviceText,
      };
    }

    // Độ pH đất với lời khuyên cụ thể
    if (sensorAnalysis.ph.current !== null) {
      const ph = sensorAnalysis.ph.current;
      const optimalMin = growthStage?.optimalPHMin || 6.0;
      const optimalMax = growthStage?.optimalPHMax || 7.5;

      let status: 'OPTIMAL' | 'NEEDS_ATTENTION' = 'OPTIMAL';
      let adviceText = `⚖️ Độ pH đất ${ph.toFixed(1)} - lý tưởng cho cây hấp thụ dinh dưỡng!`;

      if (ph < optimalMin) {
        status = 'NEEDS_ATTENTION';
        const phDiff = optimalMin - ph;
        adviceText = `🍋 Đất hơi chua (pH thấp ${phDiff.toFixed(1)} đơn vị). `;

        if (phDiff > 1) {
          adviceText += 'Cần bổ sung vôi bột để tăng pH đất. ';
        } else {
          adviceText += 'Có thể bổ sung tro bếp hoặc vôi bột nhẹ. ';
        }

        adviceText += 'Đất chua làm cây khó hấp thụ canxi và magie.';
      } else if (ph > optimalMax) {
        status = 'NEEDS_ATTENTION';
        const phDiff = ph - optimalMax;
        adviceText = `🧪 Đất hơi kiềm (pH cao ${phDiff.toFixed(1)} đơn vị). `;

        if (phDiff > 1) {
          adviceText += 'Cần bổ sung lưu huỳnh hoặc phân chua để giảm pH. ';
        } else {
          adviceText += 'Có thể bổ sung mùn cưa hoặc phân hữu cơ. ';
        }

        adviceText += 'Đất kiềm làm cây khó hấp thụ sắt và kẽm.';
      }

      advice.soilPH = {
        // Changed from ph to soilPH
        status,
        current: `pH ${ph.toFixed(1)}`,
        optimal: `pH ${optimalMin.toFixed(1)}-${optimalMax.toFixed(1)}`,
        advice: adviceText,
      };
    }

    return advice;
  }

  private generateWeatherInsights(
    weatherAnalysis: WeatherAnalysis,
  ): WeatherConsiderationsDto {
    const considerations: WeatherConsiderationsDto = {
      // Ensure all required fields are initialized or make them optional in DTO
      // Initialize properties based on DTO definition, e.g.
      // todayForecast: undefined,
      // weekAhead: [],
      // weeklyTrend: undefined, // Add if it's part of DTO
    };

    // Dự báo hôm nay với lời khuyên chi tiết
    if (weatherAnalysis.current) {
      const current = weatherAnalysis.current;
      const condition = this.getWeatherConditionInVietnamese(
        current.weatherMain,
        current.weatherDesc,
      );

      considerations.todayForecast = {
        condition: `${condition} 🌤️`,
        temperature: `${current.temp.toFixed(1)}°C (cảm giác như ${current.feelsLike.toFixed(1)}°C)`,
        humidity: `${current.humidity}%`,
        rainfall: current.rain1h
          ? `${current.rain1h}mm trong giờ qua`
          : 'Không có mưa ☀️',
        advice: this.generateDetailedWeatherAdvice(current, weatherAnalysis),
      };
    }

    // Dự báo tuần với phân tích xu hướng
    if (weatherAnalysis.weeklyPattern) {
      const pattern = weatherAnalysis.weeklyPattern;
      considerations.weekAhead =
        this.generateWeeklyForecastAdvice(weatherAnalysis);

      // Thêm tóm tắt xu hướng tuần
      considerations.weeklyTrend = {
        summary: this.generateWeeklyTrendSummary(pattern),
        recommendations: this.generateWeeklyRecommendations(
          pattern,
          weatherAnalysis,
        ),
      };
    }

    return considerations;
  }

  private getWeatherConditionInVietnamese(
    main: string,
    description: string,
  ): string {
    const conditions = {
      CLEAR: 'Trời quang đãng',
      CLOUDS: 'Có mây',
      RAIN: 'Mưa',
      DRIZZLE: 'Mưa phùn',
      THUNDERSTORM: 'Dông bão',
      SNOW: 'Tuyết',
      ATMOSPHERE: 'Sương mù',
    };

    return conditions[main] || description || 'Thời tiết bình thường';
  }

  private generateDetailedWeatherAdvice(
    current: any,
    weatherAnalysis: WeatherAnalysis,
  ): string {
    const advices: string[] = [];

    // Lời khuyên dựa trên thời tiết hiện tại
    if (current.weatherMain === 'RAIN') {
      if (current.rain1h && current.rain1h > 5) {
        advices.push('🌧️ Mưa to - ngưng tưới nước và che chắn cây');
      } else {
        advices.push('🌦️ Mưa nhẹ - giảm lượng tưới nước hôm nay');
      }
    } else if (current.weatherMain === 'CLEAR' && current.temp > 32) {
      advices.push(
        '☀️ Nắng nóng - tăng tưới nước và che bớt ánh sáng buổi trưa',
      );
    } else if (current.weatherMain === 'CLOUDS') {
      advices.push('☁️ Trời nhiều mây - thời tiết lý tưởng để chăm sóc cây');
    }

    // Lời khuyên dựa trên nhiệt độ
    if (current.temp > 35) {
      advices.push('🔥 Nhiệt độ rất cao - che chắn và tưới nước thường xuyên');
    } else if (current.temp < 15) {
      advices.push('🧊 Nhiệt độ thấp - bảo vệ cây khỏi lạnh');
    }

    // Lời khuyên dựa trên độ ẩm
    if (current.humidity > 90) {
      advices.push('💨 Độ ẩm rất cao - tăng thông gió để tránh nấm bệnh');
    } else if (current.humidity < 40) {
      advices.push('🏜️ Độ ẩm thấp - phun sương để tăng độ ẩm xung quanh cây');
    }

    // Lời khuyên dựa trên gió
    if (current.windSpeed > 10) {
      advices.push('💨 Gió mạnh - cố định cây và kiểm tra sau gió');
    }

    // Lời khuyên dựa trên xu hướng
    if (weatherAnalysis.temperatureTrend === 'warming') {
      advices.push('📈 Nhiệt độ đang tăng dần - chuẩn bị tăng tưới nước');
    } else if (weatherAnalysis.temperatureTrend === 'cooling') {
      advices.push('📉 Nhiệt độ đang giảm - giảm tưới nước và chú ý giữ ấm');
    }

    return advices.length > 0
      ? advices.join('. ') + '.'
      : 'Thời tiết bình thường, tiếp tục chăm sóc như thường 🌱';
  }

  private generateWeeklyForecastAdvice(
    weatherAnalysis: WeatherAnalysis,
  ): DailyWeatherAdviceDto[] {
    // Return type changed to match DTO
    const forecasts = weatherAnalysis.dailyForecasts || []; // Changed from dailyForecast

    return forecasts.map(
      (forecast: any, index: number): DailyWeatherAdviceDto => {
        // Return type for map changed
        const date = new Date(forecast.forecastFor);
        const dayName = this.getDayNameInVietnamese(date.getDay());
        const dateStr = `${dayName}, ${date.getDate()}/${date.getMonth() + 1}`;

        const condition = this.getWeatherConditionInVietnamese(
          forecast.weatherMain,
          forecast.weatherDesc,
        );
        const advice = this.generateDailyForecastAdvice(forecast, index);

        return {
          date: dateStr,
          condition: `${condition} 🌤️`,
          temperature: `${forecast.tempMin}°C - ${forecast.tempMax}°C`,
          rainChance: `${Math.round(forecast.pop * 100)}%`,
          advice,
        };
      },
    );
  }

  private getDayNameInVietnamese(dayIndex: number): string {
    const days = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];
    return days[dayIndex];
  }

  private generateDailyForecastAdvice(forecast: any, dayIndex: number): string {
    const advices: string[] = [];

    // Lời khuyên dựa trên nhiệt độ
    if (forecast.tempMax > 35) {
      advices.push('🔥 Rất nóng - che chắn và tưới nhiều nước');
    } else if (forecast.tempMax > 30) {
      advices.push('☀️ Nóng - tưới nước sáng và chiều');
    } else if (forecast.tempMax < 20) {
      advices.push('🧊 Mát - giảm tưới nước');
    }

    // Lời khuyên dựa trên mưa
    if (forecast.pop > 0.8) {
      advices.push('🌧️ Mưa to - che chắn và ngưng tưới');
    } else if (forecast.pop > 0.5) {
      advices.push('🌦️ Có mưa - giảm tưới nước');
    } else if (forecast.pop < 0.1 && forecast.tempMax > 30) {
      advices.push('☀️ Khô nóng - tăng tưới nước');
    }

    // Lời khuyên dựa trên gió
    if (forecast.windSpeed > 12) {
      advices.push('💨 Gió mạnh - cố định cây');
    }

    return advices.length > 0 ? advices.join(', ') : 'Thời tiết ổn định';
  }

  private generateWeeklyTrendSummary(pattern: any): string {
    const summaries: string[] = [];

    if (pattern.rainyDays > 4) {
      summaries.push(`🌧️ Tuần mưa nhiều (${pattern.rainyDays} ngày)`);
    } else if (pattern.rainyDays === 0) {
      summaries.push('☀️ Tuần khô ráo hoàn toàn');
    }

    if (pattern.hotDays > 3) {
      summaries.push(`🔥 Nhiều ngày nóng (${pattern.hotDays} ngày)`);
    }

    if (pattern.coolDays > 2) {
      summaries.push(`🧊 Có ngày mát (${pattern.coolDays} ngày)`);
    }

    summaries.push(`Nhiệt độ trung bình: ${pattern.averageTemp.toFixed(1)}°C`);

    return summaries.join(', ');
  }

  private generateWeeklyRecommendations(
    pattern: any,
    weatherAnalysis: WeatherAnalysis,
  ): string[] {
    const recommendations: string[] = [];

    if (pattern.rainyDays > 4) {
      recommendations.push(
        '🌧️ Tuần mưa nhiều: Giảm tưới nước, tăng thông gió, chú ý nấm bệnh',
      );
      recommendations.push(
        '🏠 Cân nhắc di chuyển cây vào trong nhà nếu có thể',
      );
    } else if (pattern.rainyDays === 0 && pattern.hotDays > 3) {
      recommendations.push(
        '☀️ Tuần khô nóng: Tăng tưới nước, che chắn buổi trưa, phun sương',
      );
    }

    if (pattern.averageTemp > 32) {
      recommendations.push(
        '🌡️ Nhiệt độ cao: Tưới nước 2 lần/ngày, che chắn 11h-15h',
      );
    } else if (pattern.averageTemp < 20) {
      recommendations.push(
        '🧊 Nhiệt độ thấp: Giảm tưới nước, bảo vệ khỏi gió lạnh',
      );
    }

    if (weatherAnalysis.extremeWeather.length > 0) {
      recommendations.push(
        '⚠️ Có thời tiết khắc nghiệt: Chuẩn bị biện pháp bảo vệ đặc biệt',
      );
    }

    return recommendations;
  }

  private generateLocalSeasonalTips(
    garden: any,
    weatherAnalysis: WeatherAnalysis,
  ): SeasonalTipsDto {
    const now = new Date();
    const month = now.getMonth() + 1;

    // Xác định mùa dựa trên khí hậu Việt Nam
    let season = 'Mùa khô';
    let generalAdvice: string[] = [];

    if (month >= 5 && month <= 10) {
      season = 'Mùa mưa';
      generalAdvice = [
        '🌧️ Điều chỉnh tưới nước theo lượng mưa thực tế',
        '🏠 Đảm bảo thoát nước tốt để tránh úng rễ',
        '🦠 Tăng cường phòng chống nấm bệnh do độ ẩm cao',
        '💨 Cải thiện thông gió để giảm độ ẩm xung quanh cây',
        '🧹 Vệ sinh lá thường xuyên để tránh bệnh đốm lá',
      ];
    } else {
      season = 'Mùa khô';
      generalAdvice = [
        '💧 Tăng tần suất tưới nước do bay hơi mạnh',
        '☀️ Che chắn ánh nắng trực tiếp vào buổi trưa (11h-15h)',
        '🍃 Sử dụng mulch (lá khô, rơm) để giữ ẩm đất',
        '💨 Phun sương nhẹ để tăng độ ẩm không khí',
        '🌿 Bón phân để tăng sức đề kháng cho cây',
      ];
    }

    // Thêm lời khuyên dựa trên thời tiết tuần này
    if (weatherAnalysis.weeklyPattern) {
      const pattern = weatherAnalysis.weeklyPattern;

      if (season === 'Mùa mưa' && pattern.rainyDays < 2) {
        generalAdvice.push(
          '🌞 Mùa mưa nhưng ít mưa tuần này - tăng tưới nước bổ sung',
        );
      } else if (season === 'Mùa khô' && pattern.rainyDays > 3) {
        generalAdvice.push(
          '🌧️ Mùa khô nhưng có mưa - điều chỉnh giảm tưới nước',
        );
      }
    }

    const monthlyFocus = this.getDetailedMonthlyFocus(
      month,
      garden.plantGrowStage,
      weatherAnalysis,
    );

    return {
      season,
      generalAdvice,
      monthlyFocus,
    };
  }

  private getDetailedMonthlyFocus(
    month: number,
    growthStage: string,
    weatherAnalysis: WeatherAnalysis,
  ): string {
    const baseFocus = {
      1: '🎊 Tháng Giêng: Thời điểm lý tưởng để lên kế hoạch vườn mới và chuẩn bị đất trồng',
      2: '🌱 Tháng Hai: Gieo trồng các loại cây ngắn ngày và chăm sóc cây con',
      3: '🌸 Tháng Ba: Bón phân lót, chuẩn bị cho giai đoạn phát triển mạnh',
      4: '🌿 Tháng Tư: Kiểm tra hệ thống tưới và chuẩn bị cho mùa mưa',
      5: '🌧️ Tháng Năm: Bắt đầu mùa mưa - điều chỉnh chế độ chăm sóc',
      6: '💚 Tháng Sáu: Mùa mưa đỉnh điểm - tập trung phòng chống sâu bệnh',
      7: '🌿 Tháng Bảy: Tiếp tục chăm sóc trong mùa mưa, cắt tỉa nếu cần',
      8: '🍃 Tháng Tám: Chăm sóc và thu hoạch các loại cây ngắn ngày',
      9: '🌤️ Tháng Chín: Chuẩn bị chuyển sang mùa khô, điều chỉnh tưới nước',
      10: '☀️ Tháng Mười: Kết thúc mùa mưa - tăng cường tưới nước',
      11: '🌞 Tháng Mười một: Mùa khô bắt đầu - chăm sóc đặc biệt',
      12: '🎄 Tháng Mười hai: Mùa khô đỉnh điểm - bảo vệ cây khỏi nắng gắt',
    };

    let focus = baseFocus[month] || 'Chăm sóc cây theo mùa';

    // Thêm thông tin về giai đoạn phát triển
    if (growthStage && growthStage !== 'Chưa xác định') {
      focus += `. 🌱 Đặc biệt chú ý đến giai đoạn "${growthStage}" của cây`;
    }

    // Thêm lời khuyên dựa trên xu hướng thời tiết
    if (weatherAnalysis.temperatureTrend === 'warming') {
      focus += '. 📈 Nhiệt độ đang tăng - chuẩn bị biện pháp làm mát';
    } else if (weatherAnalysis.temperatureTrend === 'cooling') {
      focus += '. 📉 Nhiệt độ đang giảm - chú ý giữ ấm cho cây';
    }

    return focus;
  }

  private generateContextualIssues(
    sensorAnalysis: SensorAnalysis,
    plantData: any,
    growthStage: any,
    weatherAnalysis: WeatherAnalysis,
  ): CommonIssueDto[] {
    const issues: CommonIssueDto[] = [];

    // Vấn đề dựa trên dữ liệu sensor hiện tại
    if (sensorAnalysis.soilMoisture.current !== null) {
      const moisture = sensorAnalysis.soilMoisture.current;

      if (moisture < 30) {
        issues.push({
          issue: '🥀 Lá héo, cong quăn và vàng từ dưới lên',
          cause: 'Thiếu nước nghiêm trọng - đất quá khô',
          solution:
            'Tưới nước ngay lập tức nhưng từ từ, chia nhỏ nhiều lần trong ngày. Kiểm tra hệ thống tưới.',
          prevention:
            'Lắp đặt cảm biến độ ẩm đất và hệ thống tưới tự động. Kiểm tra đất hàng ngày.',
        });
      } else if (moisture > 90) {
        issues.push({
          issue: '🍂 Lá vàng từ dưới lên, rễ có mùi hôi thối',
          cause: 'Úng nước - rễ bị thối do quá nhiều nước',
          solution:
            'Ngưng tưới ngay, cải thiện thoát nước, cắt bỏ rễ thối và thay đất mới.',
          prevention:
            'Đảm bảo đất thoát nước tốt, tưới đúng liều lượng, không tưới khi đất còn ẩm.',
        });
      }
    }

    // Vấn đề dựa trên nhiệt độ
    if (sensorAnalysis.temperature.current !== null) {
      const temp = sensorAnalysis.temperature.current;

      if (temp > 38) {
        issues.push({
          issue: '🔥 Lá bị cháy nắng, mép lá khô và nâu',
          cause: 'Nhiệt độ quá cao và ánh nắng trực tiếp',
          solution:
            'Di chuyển cây đến nơi có bóng râm, phun sương làm mát, tăng tưới nước.',
          prevention:
            'Che chắn từ 10h-16h, đặt cây ở vị trí có ánh sáng gián tiếp.',
        });
      } else if (temp < 12) {
        issues.push({
          issue: '🧊 Lá đen, mềm và rụng bất thường',
          cause: 'Nhiệt độ quá thấp - cây bị tổn thương lạnh',
          solution:
            'Di chuyển vào trong nhà hoặc che chắn gió lạnh, sử dụng đèn sưởi nếu cần.',
          prevention:
            'Theo dõi dự báo thời tiết, chuẩn bị biện pháp giữ ấm khi có rét đậm.',
        });
      }
    }

    // Vấn đề dựa trên độ ẩm không khí
    if (
      sensorAnalysis.humidity.current !== null &&
      sensorAnalysis.humidity.current > 85
    ) {
      if (weatherAnalysis.weeklyPattern?.rainyDays > 3) {
        issues.push({
          issue: '🍄 Nấm trắng xuất hiện trên lá và thân cây',
          cause: 'Độ ẩm quá cao kết hợp với thông gió kém',
          solution:
            'Tăng thông gió, cắt tỉa lá dày, xịt thuốc chống nấm sinh học.',
          prevention:
            'Đảm bảo khoảng cách giữa các cây, tránh tưới nước lên lá.',
        });
      }
    }

    // Vấn đề dựa trên pH đất
    if (sensorAnalysis.ph.current !== null) {
      const ph = sensorAnalysis.ph.current;

      if (ph < 5.5) {
        issues.push({
          issue: '💛 Lá vàng, cây phát triển chậm dù có đủ nước',
          cause: 'Đất quá chua (pH thấp) - cây khó hấp thụ dinh dưỡng',
          solution:
            'Bổ sung vôi bột để tăng pH đất, bón phân có chứa canxi và magie.',
          prevention:
            'Kiểm tra pH đất định kỳ, sử dụng phân hữu cơ để ổn định pH.',
        });
      } else if (ph > 8.0) {
        issues.push({
          issue: '🟨 Lá vàng giữa, gân lá vẫn xanh (thiếu sắt)',
          cause: 'Đất quá kiềm - cây khó hấp thụ sắt và kẽm',
          solution:
            'Bổ sung lưu huỳnh để giảm pH, sử dụng phân có chứa sắt chelate.',
          prevention: 'Sử dụng phân hữu cơ, tránh dùng quá nhiều vôi.',
        });
      }
    }

    // Vấn đề dựa trên thời tiết
    if (weatherAnalysis.extremeWeather.length > 0) {
      issues.push({
        issue: '🌪️ Cây bị gãy cành hoặc nghiêng sau thời tiết xấu',
        cause: 'Gió mạnh, mưa to hoặc thời tiết khắc nghiệt',
        solution:
          'Cắt tỉa cành gãy, cố định lại cây, kiểm tra rễ có bị hỏng không.',
        prevention:
          'Theo dõi dự báo thời tiết, chuẩn bị biện pháp che chắn và cố định cây.',
      });
    }

    // Vấn đề dựa trên giai đoạn phát triển
    if (growthStage?.pestSusceptibility) {
      issues.push({
        issue: `🐛 Sâu bệnh tấn công trong giai đoạn ${growthStage.stageName}`,
        cause: `Giai đoạn này cây dễ bị ${growthStage.pestSusceptibility}`,
        solution:
          'Sử dụng thuốc sinh học phù hợp, tăng cường kiểm tra hàng ngày.',
        prevention: 'Phun thuốc phòng bệnh định kỳ, vệ sinh vườn sạch sẽ.',
      });
    }

    // Vấn đề chung thường gặp
    issues.push({
      issue: '🐜 Kiến và mối xuất hiện xung quanh gốc cây',
      cause: 'Đất quá ẩm hoặc có thức ăn thừa (phân bón)',
      solution:
        'Cải thiện thoát nước, dọn sạch thức ăn thừa, sử dụng bẫy tự nhiên.',
      prevention: 'Vệ sinh xung quanh cây sạch sẽ, bón phân đúng liều lượng.',
    });

    return issues.slice(0, 6); // Giới hạn 6 vấn đề để không quá dài
  }

  private generateCustomLearningResources(
    plantName: string,
    growthStage: string,
    healthStatus: string,
  ): LearningResourceDto[] {
    const resources: LearningResourceDto[] = [];

    // Tài nguyên cơ bản
    resources.push({
      title: `🌿 Hướng dẫn chăm sóc ${plantName || 'cây trồng'} từ A-Z`,
      type: 'VIDEO',
      duration: '15 phút',
      url: `/resources/plant-care/${encodeURIComponent(plantName || 'general')}`,
    });

    // Tài nguyên theo giai đoạn phát triển
    if (growthStage && growthStage !== 'Chưa xác định') {
      resources.push({
        title: `📈 Chăm sóc chuyên sâu cho giai đoạn "${growthStage}"`,
        type: 'GUIDE',
        duration: '8 phút đọc',
        url: `/resources/growth-stage/${encodeURIComponent(growthStage)}`,
      });
    }

    // Tài nguyên dựa trên tình trạng sức khỏe
    if (healthStatus === 'CRITICAL' || healthStatus === 'POOR') {
      resources.push({
        title: '🚨 Xử lý khẩn cấp khi cây gặp vấn đề',
        type: 'VIDEO',
        duration: '12 phút',
        url: '/resources/emergency-care',
      });

      resources.push({
        title: '💊 Thuốc và phân bón cứu cây hiệu quả',
        type: 'ARTICLE',
        duration: '6 phút đọc',
        url: '/resources/plant-medicine',
      });
    } else if (healthStatus === 'EXCELLENT') {
      resources.push({
        title: '🌟 Bí quyết duy trì cây khỏe mạnh lâu dài',
        type: 'GUIDE',
        duration: '10 phút đọc',
        url: '/resources/maintenance-tips',
      });
    }

    // Tài nguyên chuyên môn
    resources.push({
      title: '🔬 Nhận biết và xử lý sâu bệnh thường gặp',
      type: 'VIDEO',
      duration: '18 phút',
      url: '/resources/pest-disease-control',
    });

    resources.push({
      title: '🧪 Kiểm tra và điều chỉnh đất trồng',
      type: 'GUIDE',
      duration: '12 phút đọc',
      url: '/resources/soil-management',
    });

    resources.push({
      title: '💡 Hệ thống tưới tự động cho người bận rộn',
      type: 'VIDEO',
      duration: '20 phút',
      url: '/resources/automation-system',
    });

    // Tài nguyên theo mùa
    const currentMonth = new Date().getMonth() + 1;
    const seasonResource =
      currentMonth >= 5 && currentMonth <= 10
        ? '🌧️ Chăm sóc cây trong mùa mưa'
        : '☀️ Chăm sóc cây trong mùa khô';

    resources.push({
      title: seasonResource,
      type: 'ARTICLE',
      duration: '7 phút đọc',
      url: '/resources/seasonal-care',
    });

    return resources;
  }

  private async generateAdvancedGamification(
    gardenId: number,
    gardenerId: number,
  ): Promise<GamificationDto> {
    // Lấy thông tin người dùng và kinh nghiệm
    const gardener = await this.prisma.gardener.findUnique({
      where: { userId: gardenerId },
      include: {
        user: true,
        experienceLevel: true,
      },
    });

    // Lấy nhiệm vụ hôm nay
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    const todayTasks = await this.prisma.task.findMany({
      where: {
        gardenId,
        createdAt: {
          gte: today,
          lt: tomorrow,
        },
      },
      include: {
        photoEvaluations: true,
      },
    });

    // Lấy hoạt động gần đây
    const recentActivities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId,
        timestamp: {
          gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { timestamp: 'desc' },
    });

    // Tạo nhiệm vụ hôm nay với XP thông minh
    const gamificationTasks: GamificationTaskDto[] = [
      {
        task: '💧 Kiểm tra độ ẩm đất và tưới nước nếu cần',
        xpReward: 15,
        completed: recentActivities.some(
          (a) =>
            a.activityType === 'WATERING' && new Date(a.timestamp) >= today,
        ),
        description:
          'Cây cần nước để sống! Hãy kiểm tra và tưới nước đúng cách.',
      },
      {
        task: '📸 Chụp ảnh theo dõi sự phát triển của cây',
        xpReward: 20,
        completed: todayTasks.some((t) => t.photoEvaluations.length > 0),
        description: 'Ghi lại hành trình phát triển của cây qua từng ngày.',
      },
      {
        task: '🔍 Kiểm tra sâu bệnh trên lá và thân cây',
        xpReward: 12,
        completed: todayTasks.some(
          (t) => t.type === 'PEST_CHECK' && t.status === 'COMPLETED',
        ),
        description: 'Phát hiện sớm sâu bệnh giúp cây khỏe mạnh hơn.',
      },
      {
        task: '📊 Ghi nhận dữ liệu môi trường (nhiệt độ, độ ẩm)',
        xpReward: 10,
        completed: recentActivities.some(
          (a) =>
            a.timestamp >= today &&
            (a.temperature !== null || a.humidity !== null),
        ),
        description: 'Dữ liệu giúp hiểu rõ hơn về nhu cầu của cây.',
      },
      {
        task: '🌱 Bón phân hoặc chăm sóc đặc biệt',
        xpReward: 25,
        completed: recentActivities.some(
          (a) =>
            a.activityType === 'FERTILIZING' && new Date(a.timestamp) >= today,
        ),
        description: 'Cung cấp dinh dưỡng để cây phát triển mạnh mẽ.',
      },
    ];

    // Tính toán thành tựu dựa trên dữ liệu thực
    const wateringStreak =
      this.calculateAdvancedWateringStreak(recentActivities);
    const totalActivities = recentActivities.length;
    const careScore = this.calculateAdvancedCareScore(
      recentActivities,
      todayTasks,
    );
    const consistency = this.calculateCareConsistency(
      recentActivities.filter((a) => a.activityType === 'WATERING'),
    );

    const achievements: GamificationAchievementDto[] = [
      {
        name: '💧 Thạc sĩ tưới nước',
        description: 'Tưới nước đều đặn 7 ngày liên tiếp',
        progress: `${Math.min(wateringStreak, 7)}/7`,
        unlocked: wateringStreak >= 7,
        xpReward: 100,
        icon: '🏆',
      },
      {
        name: '📈 Người quan sát tài ba',
        description: 'Hoàn thành 20 hoạt động chăm sóc',
        progress: `${Math.min(totalActivities, 20)}/20`,
        unlocked: totalActivities >= 20,
        xpReward: 150,
        icon: '🔍',
      },
      {
        name: '🌟 Chuyên gia chăm sóc',
        description: 'Đạt điểm chăm sóc 85+ điểm',
        progress: `${careScore}/85`,
        unlocked: careScore >= 85,
        xpReward: 200,
        icon: '👨‍🌾',
      },
      {
        name: '⚡ Siêu nhất quán',
        description: 'Duy trì độ nhất quán chăm sóc trên 80%',
        progress: `${consistency.toFixed(1)}/80.0`,
        unlocked: consistency >= 80,
        xpReward: 250,
        icon: '⭐',
      },
      {
        name: '📸 Nhiếp ảnh gia vườn',
        description: 'Chụp và đánh giá 10 ảnh cây trồng',
        progress: `${Math.min(
          todayTasks.reduce((sum, t) => sum + t.photoEvaluations.length, 0),
          10,
        )}/10`,
        unlocked:
          todayTasks.reduce((sum, t) => sum + t.photoEvaluations.length, 0) >=
          10,
        xpReward: 180,
        icon: '📷',
      },
    ];

    // Thêm thông tin cấp độ và tiến trình
    const currentXP = gardener?.experiencePoints || 0;
    const currentLevel = gardener?.experienceLevel;
    const nextLevel = await this.getNextExperienceLevel(
      gardener?.experienceLevelId,
    );

    return {
      todayTasks: gamificationTasks,
      achievements,
      currentXP,
      currentLevel: currentLevel
        ? {
            level: currentLevel.level,
            title: currentLevel.title,
            icon: currentLevel.icon,
            description: currentLevel.description,
          }
        : undefined,
      nextLevel: nextLevel
        ? {
            level: nextLevel.level,
            title: nextLevel.title,
            xpRequired: nextLevel.minXP - currentXP,
            icon: nextLevel.icon,
          }
        : undefined,
      weeklyProgress: this.calculateWeeklyProgress(recentActivities),
      motivationalMessage: this.generateMotivationalMessage(
        gardener,
        wateringStreak,
        careScore,
      ),
    };
  }

  private calculateAdvancedWateringStreak(activities: any[]): number {
    const wateringActivities = activities
      .filter((a) => a.activityType === 'WATERING')
      .sort(
        (a, b) =>
          new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime(),
      );

    let streak = 0;
    let currentDate = new Date();
    currentDate.setHours(23, 59, 59, 999); // Cuối ngày

    for (let i = 0; i < 30; i++) {
      // Kiểm tra tối đa 30 ngày
      const dayStart = new Date(currentDate);
      dayStart.setHours(0, 0, 0, 0);

      const dayActivities = wateringActivities.filter((a) => {
        const activityDate = new Date(a.timestamp);
        return activityDate >= dayStart && activityDate <= currentDate;
      });

      if (dayActivities.length > 0) {
        streak++;
      } else if (streak > 0) {
        break; // Chuỗi bị gián đoạn
      }

      currentDate.setDate(currentDate.getDate() - 1);
      currentDate.setHours(23, 59, 59, 999);
    }

    return streak;
  }

  private calculateAdvancedCareScore(activities: any[], tasks: any[]): number {
    let score = 0;

    // Điểm cho hoạt động (tối đa 40 điểm)
    const activityScore = Math.min(40, activities.length * 2);
    score += activityScore;

    // Điểm cho nhiệm vụ hoàn thành (tối đa 30 điểm)
    const completedTasks = tasks.filter((t) => t.status === 'COMPLETED');
    const taskScore = Math.min(30, completedTasks.length * 5);
    score += taskScore;

    // Điểm cho tính đa dạng hoạt động (tối đa 15 điểm)
    const activityTypes = new Set(activities.map((a) => a.activityType));
    const diversityScore = Math.min(15, activityTypes.size * 3);
    score += diversityScore;

    // Điểm cho tính nhất quán (tối đa 15 điểm)
    const consistency = this.calculateCareConsistency(
      activities.filter((a) => a.activityType === 'WATERING'),
    );
    const consistencyScore = Math.min(15, consistency * 0.15);
    score += consistencyScore;

    return Math.round(score);
  }

  private async getNextExperienceLevel(currentLevelId: number | undefined) {
    if (!currentLevelId) return null;

    return await this.prisma.experienceLevel.findFirst({
      where: {
        level: {
          gt:
            (
              await this.prisma.experienceLevel.findUnique({
                where: { id: currentLevelId },
              })
            )?.level || 0,
        },
      },
      orderBy: { level: 'asc' },
    });
  }

  private calculateWeeklyProgress(activities: any[]): any {
    const daysOfWeek = [
      'Chủ nhật',
      'Thứ hai',
      'Thứ ba',
      'Thứ tư',
      'Thứ năm',
      'Thứ sáu',
      'Thứ bảy',
    ];
    const weekProgress = daysOfWeek.map((day, index) => {
      const dayActivities = activities.filter((a) => {
        const activityDay = new Date(a.timestamp).getDay();
        return activityDay === index;
      });

      return {
        day,
        activities: dayActivities.length,
        hasWatering: dayActivities.some((a) => a.activityType === 'WATERING'),
        score: Math.min(10, dayActivities.length * 2),
      };
    });

    return weekProgress;
  }

  private generateMotivationalMessage(
    gardener: any,
    wateringStreak: number,
    careScore: number,
  ): string {
    const firstName = gardener?.user?.firstName || 'Bạn';

    if (careScore >= 90) {
      return `🌟 Xuất sắc ${firstName}! Bạn đang chăm sóc cây tuyệt vời! Cây nhà bạn chắc chắn rất hạnh phúc! 🌱💚`;
    } else if (careScore >= 75) {
      return `👏 Làm tốt lắm ${firstName}! Bạn đang trên đường trở thành chuyên gia chăm sóc cây! 🌿`;
    } else if (wateringStreak >= 5) {
      return `💧 Tuyệt vời ${firstName}! ${wateringStreak} ngày tưới nước liên tiếp - cây rất biết ơn bạn! 🙏`;
    } else if (careScore >= 50) {
      return `🌱 Bạn đang làm rất tốt ${firstName}! Hãy tiếp tục duy trì và cây sẽ phát triển mạnh mẽ hơn! 💪`;
    } else {
      return `🌟 Chào ${firstName}! Hôm nay là một ngày tuyệt vời để chăm sóc cây. Bắt đầu với việc kiểm tra độ ẩm đất nhé! 🌱`;
    }
  }
}
