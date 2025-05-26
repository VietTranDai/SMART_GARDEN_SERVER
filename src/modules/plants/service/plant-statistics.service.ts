import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import {
  PlantStatisticsResponseDto,
  OptimalRangeDto,
  PlantHealthConditionDetailDto,
  SensorStatisticsDetailDto,
} from '../dto/plant-statistics.dto';
import {
  Garden,
  Sensor,
  SensorData,
  WeatherObservation,
  Task,
  Alert,
  Plant,
  GrowthStage,
  ActivityType,
  TaskStatus,
  AlertStatus,
  SensorType,
  WeatherMain,
  GardenStatus,
  GardenType,
  AlertType,
  Severity,
  GardenActivity,
  ActivityEvaluation,
  DailyForecast,
  HourlyForecast,
} from '@prisma/client';
import {
  subDays,
  differenceInDays,
  addDays,
  startOfDay,
  endOfDay,
  format,
} from 'date-fns';
import { vi } from 'date-fns/locale';

// Helper types
type SensorWithLatestData = Sensor & { sensorData: SensorData[] };
type PlantWithGrowthStages = Plant & { growthStages: GrowthStage[] };
type GardenWithFullData = Garden & {
  sensors: SensorWithLatestData[];
  weatherData: WeatherObservation[];
  gardener: {
    user: any;
    experienceLevel: any;
  };
};

// Interfaces for internal calculations
interface HealthMetrics {
  temperature: number;
  soilMoisture: number;
  humidity: number;
  soilPH: number;
  lightIntensity: number;
}

interface WeatherPattern {
  averageTemp: number;
  averageHumidity: number;
  totalRainfall: number;
  favorableDays: number;
  extremeWeatherDays: number;
}

interface ActivityInsights {
  totalActivities: number;
  activitiesByType: Record<string, number>;
  successRate: number;
  mostEffectiveTime: string;
  averageInterval: Record<ActivityType, number>;
}

@Injectable()
export class PlantStatisticsService {
  private readonly logger = new Logger(PlantStatisticsService.name);

  constructor(private readonly prisma: PrismaService) {}

  async getPlantStatistics(
    gardenId: number,
    userId: number,
  ): Promise<PlantStatisticsResponseDto> {
    this.logger.log(
      `Đang lấy thống kê cây trồng cho vườn ID: ${gardenId} bởi người dùng ID: ${userId}`,
    );

    const garden = await this.getGardenWithFullData(gardenId);

    if (!garden) {
      this.logger.warn(`Không tìm thấy vườn với ID ${gardenId}.`);
      throw new NotFoundException(`Không tìm thấy vườn với ID ${gardenId}`);
    }

    await this.validateUserAccess(garden, userId);

    let plantDetails: PlantWithGrowthStages | null = null;
    if (garden.plantName) {
      plantDetails = await this.getPlantDetails(garden.plantName);
      if (!plantDetails) {
        this.logger.warn(
          `Không tìm thấy thông tin cây '${garden.plantName}' cho vườn ${gardenId}. Tiếp tục mà không có dự đoán sức khỏe cây cụ thể.`,
        );
      }
    }

    // Generate comprehensive statistics
    const gardenInfo = this.mapGardenInfo(garden);
    const currentConditions = await this.getCurrentConditions(garden);
    const plantHealth = await this.calculatePlantHealth(
      garden,
      plantDetails,
      currentConditions,
    );
    const statistics = await this.getHistoricalStatistics(
      gardenId,
      garden,
      plantDetails,
      plantHealth.conditions,
    );
    const tasks = await this.getTaskSummary(gardenId);
    const alerts = await this.getAlertSummary(gardenId);
    const predictions = await this.getPredictions(
      garden,
      plantDetails,
      statistics,
      plantHealth.conditions,
    );

    this.logger.log(`Hoàn thành tạo thống kê cho vườn ${gardenId}`);

    return {
      gardenInfo,
      currentConditions,
      plantHealth,
      statistics,
      tasks,
      alerts,
      predictions,
    };
  }

  private async getGardenWithFullData(
    gardenId: number,
  ): Promise<GardenWithFullData | null> {
    return this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        sensors: {
          include: {
            sensorData: {
              orderBy: { timestamp: 'desc' },
              take: 10, // Lấy nhiều dữ liệu hơn để phân tích xu hướng
            },
          },
        },
        weatherData: {
          orderBy: { observedAt: 'desc' },
          take: 24, // Lấy dữ liệu 24 giờ gần nhất
        },
        gardener: {
          include: {
            user: {
              select: {
                id: true,
                firstName: true,
                lastName: true,
                email: true,
              },
            },
            experienceLevel: true,
          },
        },
      },
    });
  }

  private async validateUserAccess(
    garden: GardenWithFullData,
    userId: number,
  ): Promise<void> {
    if (garden.gardenerId !== userId) {
      this.logger.warn(
        `Người dùng ${userId} không sở hữu vườn ${garden.id}. Từ chối truy cập.`,
      );
      throw new ForbiddenException(
        'Bạn không có quyền truy cập thống kê của vườn này.',
      );
    }
  }

  private async getPlantDetails(
    plantName: string,
  ): Promise<PlantWithGrowthStages | null> {
    return this.prisma.plant.findUnique({
      where: { name: plantName },
      include: {
        growthStages: {
          orderBy: { order: 'asc' },
        },
        PlantType: true,
      },
    });
  }

  private mapGardenInfo(
    garden: GardenWithFullData,
  ): PlantStatisticsResponseDto['gardenInfo'] {
    let daysFromPlanting: number | undefined;
    let remainingDays: number | undefined;
    let progressPercentage: number | undefined;

    if (garden.plantStartDate && garden.plantDuration) {
      const startDate = new Date(garden.plantStartDate);
      const today = new Date();
      const startOfDayStartDate = startOfDay(startDate);
      const startOfToday = startOfDay(today);

      daysFromPlanting = differenceInDays(startOfToday, startOfDayStartDate);
      daysFromPlanting = Math.max(0, daysFromPlanting);

      remainingDays = garden.plantDuration - daysFromPlanting;
      remainingDays = Math.max(0, remainingDays);

      if (garden.plantDuration > 0) {
        progressPercentage = parseFloat(
          Math.min(
            100,
            Math.max(0, (daysFromPlanting / garden.plantDuration) * 100),
          ).toFixed(1),
        );
      } else {
        progressPercentage = 0;
      }
    }

    return {
      id: garden.id,
      name: garden.name,
      plantName: garden.plantName ?? undefined,
      plantGrowStage: garden.plantGrowStage ?? undefined,
      plantStartDate: garden.plantStartDate?.toISOString() ?? undefined,
      plantDuration: garden.plantDuration ?? undefined,
      daysFromPlanting,
      remainingDays,
      progressPercentage,
      type: garden.type as GardenType,
      status: garden.status as GardenStatus,
      location: {
        street: garden.street ?? undefined,
        ward: garden.ward ?? undefined,
        district: garden.district ?? undefined,
        city: garden.city ?? undefined,
        lat: garden.lat ?? undefined,
        lng: garden.lng ?? undefined,
      },
    };
  }

  private async getCurrentConditions(
    garden: GardenWithFullData,
  ): Promise<PlantStatisticsResponseDto['currentConditions']> {
    const mappedSensors = garden.sensors.map((sensor) => {
      const latestData = sensor.sensorData?.[0];
      let status = this.determineSensorStatus(sensor, latestData);

      return {
        id: sensor.id,
        type: sensor.type as SensorType,
        name: this.getSensorNameVietnamese(sensor.type),
        unit: sensor.unit,
        currentValue: latestData?.value ?? 0,
        timestamp:
          latestData?.timestamp.toISOString() ?? new Date(0).toISOString(),
        status,
      };
    });

    const latestWeatherObs = garden.weatherData?.[0];
    const weatherCurrent = latestWeatherObs
      ? {
          temp: latestWeatherObs.temp,
          humidity: latestWeatherObs.humidity,
          pressure: latestWeatherObs.pressure,
          weatherMain: latestWeatherObs.weatherMain,
          weatherDesc: this.getWeatherDescriptionVietnamese(
            latestWeatherObs.weatherMain,
          ),
          windSpeed: latestWeatherObs.windSpeed,
          observedAt: latestWeatherObs.observedAt.toISOString(),
        }
      : {
          temp: 0,
          humidity: 0,
          pressure: 0,
          weatherMain: WeatherMain.CLEAR,
          weatherDesc: 'Không có dữ liệu',
          windSpeed: 0,
          observedAt: new Date(0).toISOString(),
        };

    return {
      sensors: mappedSensors,
      weather: {
        current: weatherCurrent,
      },
    };
  }

  private determineSensorStatus(
    sensor: Sensor,
    latestData?: SensorData,
  ): string {
    if (!latestData) {
      return 'Không có dữ liệu';
    }

    const timeDiff = Date.now() - new Date(latestData.timestamp).getTime();
    const hoursDiff = timeDiff / (1000 * 60 * 60);

    if (hoursDiff > 48) {
      return 'Mất kết nối';
    } else if (hoursDiff > 24) {
      return 'Dữ liệu cũ';
    } else if (hoursDiff > 12) {
      return 'Cần cập nhật';
    } else if (hoursDiff > 6) {
      return 'Hoạt động bình thường';
    } else {
      return 'Hoạt động tốt';
    }
  }

  private getSensorNameVietnamese(sensorType: SensorType): string {
    const sensorNames = {
      [SensorType.HUMIDITY]: 'Độ ẩm không khí',
      [SensorType.TEMPERATURE]: 'Nhiệt độ',
      [SensorType.LIGHT]: 'Cường độ ánh sáng',
      [SensorType.WATER_LEVEL]: 'Mực nước',
      [SensorType.RAINFALL]: 'Lượng mưa',
      [SensorType.SOIL_MOISTURE]: 'Độ ẩm đất',
      [SensorType.SOIL_PH]: 'Độ pH đất',
    };
    return sensorNames[sensorType] || sensorType;
  }

  private getWeatherDescriptionVietnamese(weatherMain: WeatherMain): string {
    const weatherDescriptions = {
      [WeatherMain.THUNDERSTORM]: 'Có dông',
      [WeatherMain.DRIZZLE]: 'Mưa phùn',
      [WeatherMain.RAIN]: 'Có mưa',
      [WeatherMain.SNOW]: 'Có tuyết',
      [WeatherMain.ATMOSPHERE]: 'Sương mù',
      [WeatherMain.CLEAR]: 'Trời quang',
      [WeatherMain.CLOUDS]: 'Có mây',
    };
    return weatherDescriptions[weatherMain] || 'Không xác định';
  }

  private getSensorValue(
    currentConditions: PlantStatisticsResponseDto['currentConditions'],
    type: SensorType,
  ): number | undefined {
    return currentConditions.sensors.find((s) => s.type === type)?.currentValue;
  }

  private calculatePlantHealthCondition(
    currentValue: number | undefined,
    optimalRange: OptimalRangeDto | null | undefined,
    tolerancePercentage: number = 15, // Tăng tolerance để thực tế hơn
  ): PlantHealthConditionDetailDto {
    const defaultResponse: PlantHealthConditionDetailDto = {
      current: currentValue ?? 0,
      optimal: optimalRange ?? { min: 0, max: 0 },
      status: 'Không xác định',
      score: 0,
    };

    if (
      currentValue === undefined ||
      !optimalRange ||
      optimalRange.min === undefined ||
      optimalRange.max === undefined
    ) {
      return defaultResponse;
    }

    const { min, max } = optimalRange;
    let status = 'Tối ưu';
    let score = 0;

    const range = max - min;
    const midPoint = (min + max) / 2;
    const tolerance = range * (tolerancePercentage / 100);

    // Tính toán điểm số và trạng thái chi tiết hơn
    if (currentValue >= min && currentValue <= max) {
      status = 'Tối ưu';
      // Điểm cao nhất khi ở giữa khoảng tối ưu
      const distanceFromCenter = Math.abs(currentValue - midPoint);
      const maxDistanceInRange = range / 2;
      score = 100 - (distanceFromCenter / maxDistanceInRange) * 15; // Tối đa trừ 15 điểm
    } else {
      const lowerBoundAcceptable = min - tolerance;
      const upperBoundAcceptable = max + tolerance;

      if (currentValue >= lowerBoundAcceptable && currentValue < min) {
        status = 'Hơi thấp';
        const distanceFromMin = min - currentValue;
        score = 85 - (distanceFromMin / tolerance) * 25; // 60-85 điểm
      } else if (currentValue > max && currentValue <= upperBoundAcceptable) {
        status = 'Hơi cao';
        const distanceFromMax = currentValue - max;
        score = 85 - (distanceFromMax / tolerance) * 25; // 60-85 điểm
      } else {
        const lowerBoundPoor = min - tolerance * 2;
        const upperBoundPoor = max + tolerance * 2;

        if (
          currentValue >= lowerBoundPoor &&
          currentValue < lowerBoundAcceptable
        ) {
          status = 'Thấp';
          const distanceFromAcceptable = lowerBoundAcceptable - currentValue;
          score = 60 - (distanceFromAcceptable / tolerance) * 25; // 35-60 điểm
        } else if (
          currentValue > upperBoundAcceptable &&
          currentValue <= upperBoundPoor
        ) {
          status = 'Cao';
          const distanceFromAcceptable = currentValue - upperBoundAcceptable;
          score = 60 - (distanceFromAcceptable / tolerance) * 25; // 35-60 điểm
        } else if (currentValue < lowerBoundPoor) {
          status = 'Rất thấp';
          score = Math.max(
            0,
            35 - ((lowerBoundPoor - currentValue) / tolerance) * 10,
          );
        } else {
          status = 'Rất cao';
          score = Math.max(
            0,
            35 - ((currentValue - upperBoundPoor) / tolerance) * 10,
          );
        }
      }
    }

    score = Math.max(0, Math.min(100, Math.round(score)));

    return { current: currentValue, optimal: { min, max }, status, score };
  }

  private async calculatePlantHealth(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
    currentConditions: PlantStatisticsResponseDto['currentConditions'],
  ): Promise<PlantStatisticsResponseDto['plantHealth']> {
    this.logger.log(
      `Đang tính toán sức khỏe cây cho vườn ID: ${garden.id}. Cây: ${garden.plantName}, Giai đoạn: ${garden.plantGrowStage}`,
    );

    const defaultHealth: PlantStatisticsResponseDto['plantHealth'] = {
      overallScore: 0,
      healthStatus: 'Không xác định',
      conditions: {},
    };

    if (
      !garden.plantName ||
      !garden.plantGrowStage ||
      !plantDetails ||
      !plantDetails.growthStages ||
      !plantDetails.growthStages.length
    ) {
      this.logger.warn(
        `Thiếu thông tin tên cây, giai đoạn phát triển hoặc dữ liệu cây cụ thể cho vườn ${garden.id}. Không thể tính toán sức khỏe.`,
      );
      return {
        ...defaultHealth,
        healthStatus: 'Thiếu thông tin cây trồng',
      };
    }

    const currentGrowthStage = plantDetails.growthStages.find(
      (gs) => gs.stageName === garden.plantGrowStage,
    );

    if (!currentGrowthStage) {
      this.logger.warn(
        `Không tìm thấy giai đoạn phát triển hiện tại '${garden.plantGrowStage}' cho cây '${plantDetails.name}' trong vườn ${garden.id}.`,
      );
      return {
        ...defaultHealth,
        healthStatus: 'Giai đoạn không xác định',
      };
    }

    // Lấy dữ liệu từ sensors
    const tempValue = this.getSensorValue(
      currentConditions,
      SensorType.TEMPERATURE,
    );
    const soilMoistureValue = this.getSensorValue(
      currentConditions,
      SensorType.SOIL_MOISTURE,
    );
    const humiditySensorValue = this.getSensorValue(
      currentConditions,
      SensorType.HUMIDITY,
    );
    const humidityValue =
      humiditySensorValue !== undefined
        ? humiditySensorValue
        : currentConditions.weather.current.humidity;
    const soilPHValue = this.getSensorValue(
      currentConditions,
      SensorType.SOIL_PH,
    );
    const lightValue = this.getSensorValue(currentConditions, SensorType.LIGHT);

    const healthConditions: PlantStatisticsResponseDto['plantHealth']['conditions'] =
      {};
    let totalScore = 0;
    let numConditions = 0;
    const weights = {
      temperature: 1.2,
      soilMoisture: 1.5,
      humidity: 1.0,
      soilPH: 1.1,
      lightIntensity: 1.3,
    };

    const processCondition = (
      value: number | undefined,
      optimalMin: number | null,
      optimalMax: number | null,
      conditionName: keyof PlantStatisticsResponseDto['plantHealth']['conditions'],
      weight: number = 1.0,
    ) => {
      if (
        value !== undefined &&
        optimalMin !== null &&
        optimalMax !== null &&
        optimalMin !== undefined &&
        optimalMax !== undefined
      ) {
        const conditionResult = this.calculatePlantHealthCondition(value, {
          min: optimalMin,
          max: optimalMax,
        });
        healthConditions[conditionName] = conditionResult;
        totalScore += conditionResult.score * weight;
        numConditions += weight;
      }
    };

    // Tính toán từng điều kiện với trọng số khác nhau
    processCondition(
      tempValue,
      currentGrowthStage.optimalTemperatureMin,
      currentGrowthStage.optimalTemperatureMax,
      'temperature',
      weights.temperature,
    );
    processCondition(
      soilMoistureValue,
      currentGrowthStage.optimalSoilMoistureMin,
      currentGrowthStage.optimalSoilMoistureMax,
      'soilMoisture',
      weights.soilMoisture,
    );
    processCondition(
      humidityValue,
      currentGrowthStage.optimalHumidityMin,
      currentGrowthStage.optimalHumidityMax,
      'humidity',
      weights.humidity,
    );
    processCondition(
      soilPHValue,
      currentGrowthStage.optimalPHMin,
      currentGrowthStage.optimalPHMax,
      'soilPH',
      weights.soilPH,
    );
    processCondition(
      lightValue,
      currentGrowthStage.optimalLightMin,
      currentGrowthStage.optimalLightMax,
      'lightIntensity',
      weights.lightIntensity,
    );

    const overallScore =
      numConditions > 0 ? Math.round(totalScore / numConditions) : 0;
    let healthStatus = this.getHealthStatusVietnamese(
      overallScore,
      numConditions,
    );

    // Điều chỉnh trạng thái dựa trên số lượng cảm biến
    if (numConditions < 2) {
      healthStatus = 'Thiếu dữ liệu cảm biến';
    }

    return {
      overallScore,
      healthStatus,
      conditions: healthConditions,
    };
  }

  private getHealthStatusVietnamese(
    score: number,
    sensorCount: number,
  ): string {
    if (sensorCount === 0) return 'Thiếu dữ liệu cảm biến';
    if (score >= 95) return 'Xuất sắc';
    if (score >= 85) return 'Rất tốt';
    if (score >= 75) return 'Tốt';
    if (score >= 65) return 'Khá';
    if (score >= 50) return 'Trung bình';
    if (score >= 35) return 'Kém';
    return 'Nguy hiểm';
  }

  private async getHistoricalStatistics(
    gardenId: number,
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
    plantHealthConditions: PlantStatisticsResponseDto['plantHealth']['conditions'],
  ): Promise<PlantStatisticsResponseDto['statistics']> {
    const toDate = new Date();
    const fromDate = garden.plantStartDate
      ? new Date(garden.plantStartDate)
      : subDays(toDate, 30);
    const totalDays = Math.max(1, differenceInDays(toDate, fromDate) + 1);

    this.logger.log(
      `Tính toán thống kê lịch sử từ ${format(fromDate, 'dd/MM/yyyy')} đến ${format(toDate, 'dd/MM/yyyy')}`,
    );

    const [sensorDataStats, activitiesStats, weatherStats] = await Promise.all([
      this.calculateSensorDataStats(
        gardenId,
        fromDate,
        toDate,
        plantHealthConditions,
      ),
      this.calculateActivitiesStats(gardenId, fromDate, toDate),
      this.calculateWeatherStats(
        gardenId,
        fromDate,
        toDate,
        plantDetails,
        garden,
      ),
    ]);

    return {
      dataRange: {
        from: fromDate.toISOString(),
        to: toDate.toISOString(),
        totalDays,
      },
      sensorData: sensorDataStats,
      activities: activitiesStats,
      weather: weatherStats,
    };
  }

  private async calculateSensorDataStats(
    gardenId: number,
    fromDate: Date,
    toDate: Date,
    plantHealthConditions: PlantStatisticsResponseDto['plantHealth']['conditions'],
  ): Promise<PlantStatisticsResponseDto['statistics']['sensorData']> {
    const gardenSensors = await this.prisma.sensor.findMany({
      where: { gardenId },
    });

    const sensorDataStats: PlantStatisticsResponseDto['statistics']['sensorData'] =
      {};

    const calculateSensorTypeStats = async (
      sensorType: SensorType,
      optimalRange?: OptimalRangeDto | null,
    ): Promise<SensorStatisticsDetailDto | undefined> => {
      const sensor = gardenSensors.find((s) => s.type === sensorType);
      if (!sensor) return undefined;

      const data = await this.prisma.sensorData.findMany({
        where: {
          sensorId: sensor.id,
          timestamp: { gte: fromDate, lte: toDate },
        },
        orderBy: { timestamp: 'asc' },
      });

      if (!data.length) {
        return {
          average: 0,
          min: 0,
          max: 0,
          trend: 'Không có dữ liệu',
          optimalDaysCount: 0,
          optimalPercentage: 0,
        };
      }

      const values = data.map((d) => d.value);
      const sum = values.reduce((acc, val) => acc + val, 0);
      const average = parseFloat((sum / values.length).toFixed(1));
      const minVal = Math.min(...values);
      const maxVal = Math.max(...values);

      // Tính toán xu hướng với thuật toán linear regression đơn giản
      const trend = this.calculateTrend(data);

      // Tính toán số ngày tối ưu
      let optimalDaysCount = 0;
      if (
        optimalRange &&
        optimalRange.min !== undefined &&
        optimalRange.max !== undefined
      ) {
        const dailyAverages = this.groupDataByDay(data);
        Object.values(dailyAverages).forEach((dailyData) => {
          const avg =
            dailyData.reduce((sum, d) => sum + d.value, 0) / dailyData.length;
          if (avg >= optimalRange.min! && avg <= optimalRange.max!) {
            optimalDaysCount++;
          }
        });
      }

      const totalDays = Math.max(1, differenceInDays(toDate, fromDate) + 1);
      const optimalPercentage = parseFloat(
        ((optimalDaysCount / totalDays) * 100).toFixed(1),
      );

      return {
        average,
        min: minVal,
        max: maxVal,
        trend,
        optimalDaysCount,
        optimalPercentage,
      };
    };

    // Tính toán cho từng loại cảm biến
    const sensorPromises = [
      { type: SensorType.TEMPERATURE, key: 'temperature' },
      { type: SensorType.SOIL_MOISTURE, key: 'soilMoisture' },
      { type: SensorType.HUMIDITY, key: 'humidity' },
      { type: SensorType.SOIL_PH, key: 'soilPH' },
      { type: SensorType.LIGHT, key: 'lightIntensity' },
    ].map(async ({ type, key }) => {
      const optimalRange =
        plantHealthConditions[key as keyof typeof plantHealthConditions]
          ?.optimal;
      const stats = await calculateSensorTypeStats(type, optimalRange);
      return { key, stats };
    });

    const results = await Promise.all(sensorPromises);
    results.forEach(({ key, stats }) => {
      if (stats) {
        sensorDataStats[key as keyof typeof sensorDataStats] = stats;
      }
    });

    return sensorDataStats;
  }

  private calculateTrend(data: SensorData[]): string {
    if (data.length < 3) return 'Không đủ dữ liệu';

    // Simple linear regression để tính xu hướng
    const n = data.length;
    let sumX = 0,
      sumY = 0,
      sumXY = 0,
      sumXX = 0;

    data.forEach((point, index) => {
      const x = index;
      const y = point.value;
      sumX += x;
      sumY += y;
      sumXY += x * y;
      sumXX += x * x;
    });

    const slope = (n * sumXY - sumX * sumY) / (n * sumXX - sumX * sumX);
    const threshold = 0.01; // Ngưỡng để xác định xu hướng

    if (Math.abs(slope) < threshold) {
      return 'Ổn định';
    } else if (slope > threshold) {
      return slope > threshold * 3 ? 'Tăng mạnh' : 'Tăng';
    } else {
      return slope < -threshold * 3 ? 'Giảm mạnh' : 'Giảm';
    }
  }

  private groupDataByDay(data: SensorData[]): Record<string, SensorData[]> {
    const grouped: Record<string, SensorData[]> = {};
    data.forEach((d) => {
      const dayKey = format(d.timestamp, 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(d);
    });
    return grouped;
  }

  private async calculateActivitiesStats(
    gardenId: number,
    fromDate: Date,
    toDate: Date,
  ): Promise<PlantStatisticsResponseDto['statistics']['activities']> {
    const activitiesData = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId,
        timestamp: { gte: fromDate, lte: toDate },
      },
      orderBy: { timestamp: 'desc' },
      include: {
        evaluations: {
          orderBy: { evaluatedAt: 'desc' },
          take: 1,
        },
      },
    });

    const totalActivities = activitiesData.length;
    const activitiesByType: Partial<Record<ActivityType, number>> = {};

    // Đếm số lượng hoạt động theo loại và tính success rate
    let totalEvaluated = 0;
    let positiveEvaluations = 0;

    activitiesData.forEach((act) => {
      activitiesByType[act.activityType] =
        (activitiesByType[act.activityType] || 0) + 1;

      if (act.evaluations[0]) {
        totalEvaluated++;
        if (act.evaluations[0].rating && act.evaluations[0].rating >= 3) {
          positiveEvaluations++;
        }
      }
    });

    const successRate =
      totalEvaluated > 0
        ? parseFloat(((positiveEvaluations / totalEvaluated) * 100).toFixed(1))
        : 0;

    const recentActivities = activitiesData.slice(0, 10).map((act) => ({
      id: act.id,
      name: act.name,
      activityType: act.activityType,
      timestamp: act.timestamp.toISOString(),
      details: act.details ?? undefined,
      evaluation: act.evaluations[0]
        ? {
            rating: act.evaluations[0].rating ?? undefined,
            outcome: this.getEvaluationOutcomeVietnamese(
              act.evaluations[0].outcome,
            ),
            comments: act.evaluations[0].comments ?? undefined,
          }
        : undefined,
    }));

    return {
      totalActivities,
      activitiesByType,
      recentActivities,
      successRate,
    };
  }

  private async calculateWeatherStats(
    gardenId: number,
    fromDate: Date,
    toDate: Date,
    plantDetails: PlantWithGrowthStages | null,
    garden: GardenWithFullData,
  ): Promise<PlantStatisticsResponseDto['statistics']['weather']> {
    const weatherObservations = await this.prisma.weatherObservation.findMany({
      where: { gardenId, observedAt: { gte: fromDate, lte: toDate } },
      orderBy: { observedAt: 'asc' },
    });

    if (weatherObservations.length === 0) {
      return {
        favorableDays: 0,
        favorablePercentage: 0,
        averageConditions: {
          temperature: 0,
          humidity: 0,
          rainfall: 0,
        },
      };
    }

    // Nhóm dữ liệu theo ngày
    const dailyWeatherData = this.groupWeatherByDay(weatherObservations);
    const totalDays = Object.keys(dailyWeatherData).length;

    let favorableWeatherDaysCount = 0;
    let totalTemp = 0,
      totalHumidity = 0,
      totalRainfall = 0;

    Object.values(dailyWeatherData).forEach((dailyObs) => {
      const avgTemp =
        dailyObs.reduce((sum, wo) => sum + wo.temp, 0) / dailyObs.length;
      const avgHumidity =
        dailyObs.reduce((sum, wo) => sum + wo.humidity, 0) / dailyObs.length;
      const dailyRain = dailyObs.reduce((sum, wo) => sum + (wo.rain1h || 0), 0);

      totalTemp += avgTemp;
      totalHumidity += avgHumidity;
      totalRainfall += dailyRain;

      // Xác định ngày thuận lợi dựa trên điều kiện tối ưu của cây
      const isFavorable = this.isWeatherFavorable(
        avgTemp,
        avgHumidity,
        dailyRain,
        dailyObs[0].weatherMain,
        dailyObs[0].windSpeed,
        plantDetails,
        garden,
      );

      if (isFavorable) favorableWeatherDaysCount++;
    });

    const favorablePercentage =
      totalDays > 0
        ? parseFloat(((favorableWeatherDaysCount / totalDays) * 100).toFixed(1))
        : 0;

    return {
      favorableDays: favorableWeatherDaysCount,
      favorablePercentage,
      averageConditions: {
        temperature:
          totalDays > 0 ? parseFloat((totalTemp / totalDays).toFixed(1)) : 0,
        humidity: totalDays > 0 ? Math.round(totalHumidity / totalDays) : 0,
        rainfall:
          totalDays > 0
            ? parseFloat((totalRainfall / totalDays).toFixed(1))
            : 0,
      },
    };
  }

  private groupWeatherByDay(
    observations: WeatherObservation[],
  ): Record<string, WeatherObservation[]> {
    const grouped: Record<string, WeatherObservation[]> = {};
    observations.forEach((wo) => {
      const dayKey = format(wo.observedAt, 'yyyy-MM-dd');
      if (!grouped[dayKey]) grouped[dayKey] = [];
      grouped[dayKey].push(wo);
    });
    return grouped;
  }

  private isWeatherFavorable(
    temperature: number,
    humidity: number,
    rainfall: number,
    weatherMain: WeatherMain,
    windSpeed: number,
    plantDetails: PlantWithGrowthStages | null,
    garden: GardenWithFullData,
  ): boolean {
    // Điều kiện cơ bản cho thời tiết thuận lợi
    let tempMin = 15,
      tempMax = 35;
    let humidityMin = 40,
      humidityMax = 90;

    if (plantDetails && garden.plantGrowStage) {
      const currentStage = plantDetails.growthStages.find(
        (stage) => stage.stageName === garden.plantGrowStage,
      );
      if (currentStage) {
        tempMin = currentStage.optimalTemperatureMin ?? tempMin;
        tempMax = currentStage.optimalTemperatureMax ?? tempMax;
        humidityMin = currentStage.optimalHumidityMin ?? humidityMin;
        humidityMax = currentStage.optimalHumidityMax ?? humidityMax;
      }
    }

    const tempOk = temperature >= tempMin - 5 && temperature <= tempMax + 5;
    const humidityOk =
      humidity >= humidityMin - 10 && humidity <= humidityMax + 10;
    const rainOk = rainfall < 20; // Không quá mưa
    const weatherOk =
      weatherMain !== WeatherMain.THUNDERSTORM &&
      weatherMain !== WeatherMain.SNOW;
    const windOk = windSpeed < 15; // Gió không quá mạnh

    return tempOk && humidityOk && rainOk && weatherOk && windOk;
  }

  private getEvaluationOutcomeVietnamese(
    outcome: string | null,
  ): string | undefined {
    if (!outcome) return undefined;

    const outcomeTranslations: { [key: string]: string } = {
      Excellent: 'Xuất sắc',
      'Very Good': 'Rất tốt',
      Good: 'Tốt',
      Fair: 'Khá',
      Poor: 'Kém',
      Bad: 'Xấu',
      Ineffective: 'Không hiệu quả',
      Effective: 'Hiệu quả',
      Outstanding: 'Nổi bật',
      Average: 'Trung bình',
    };

    return outcomeTranslations[outcome] || outcome;
  }

  private async getTaskSummary(
    gardenId: number,
  ): Promise<PlantStatisticsResponseDto['tasks']> {
    const tasks = await this.prisma.task.findMany({
      where: { gardenId },
      orderBy: { dueDate: 'asc' },
      include: {
        photoEvaluations: {
          take: 1,
          orderBy: { createdAt: 'desc' },
        },
      },
    });

    const now = new Date();
    const completed = tasks.filter(
      (t) => t.status === TaskStatus.COMPLETED,
    ).length;
    const activeTasks = tasks.filter((t) => t.status === TaskStatus.PENDING);
    const pending = activeTasks.filter(
      (t) => new Date(t.dueDate) >= now,
    ).length;
    const overdue = activeTasks.filter((t) => new Date(t.dueDate) < now).length;
    const skipped = tasks.filter((t) => t.status === TaskStatus.SKIPPED).length;

    const totalReportableTasks = completed + pending + overdue;
    const completionRate =
      totalReportableTasks > 0
        ? parseFloat(((completed / totalReportableTasks) * 100).toFixed(1))
        : 0;

    const upcomingTasks = activeTasks
      .filter((t) => new Date(t.dueDate) >= now)
      .slice(0, 8)
      .map((task) => {
        const dueDate = new Date(task.dueDate);
        const timeDiff = dueDate.getTime() - now.getTime();
        const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

        let priority = 'Thấp';
        if (daysDiff <= 0) {
          priority = 'Khẩn cấp';
        } else if (daysDiff <= 1) {
          priority = 'Cao';
        } else if (daysDiff <= 3) {
          priority = 'Trung bình';
        }

        return {
          id: task.id,
          type: this.getTaskTypeVietnamese(task.type),
          description: task.description,
          dueDate: task.dueDate.toISOString(),
          priority,
          hasPhotoEvaluation: task.photoEvaluations.length > 0,
        };
      });

    return {
      completed,
      pending,
      overdue,
      completionRate,
      upcomingTasks,
      skipped,
    };
  }

  private getTaskTypeVietnamese(taskType: string): string {
    const taskTypeTranslations: { [key: string]: string } = {
      WATERING: 'Tưới nước',
      FERTILIZING: 'Bón phân',
      PRUNING: 'Cắt tỉa',
      PEST_CONTROL: 'Phòng trừ sâu bệnh',
      HARVESTING: 'Thu hoạch',
      PLANTING: 'Trồng cây',
      WEEDING: 'Nhổ cỏ',
      SOIL_TESTING: 'Kiểm tra đất',
      OBSERVATION: 'Quan sát',
      MAINTENANCE: 'Bảo dưỡng',
      OTHER: 'Khác',
    };

    return taskTypeTranslations[taskType] || taskType;
  }

  private async getAlertSummary(
    gardenId: number,
  ): Promise<PlantStatisticsResponseDto['alerts']> {
    const alerts = await this.prisma.alert.findMany({
      where: { gardenId },
      orderBy: { createdAt: 'desc' },
    });

    const activeAlerts = alerts.filter(
      (a) =>
        a.status === AlertStatus.PENDING ||
        a.status === AlertStatus.IN_PROGRESS ||
        a.status === AlertStatus.ESCALATED,
    );

    const resolved = alerts.filter(
      (a) => a.status === AlertStatus.RESOLVED,
    ).length;
    const ignored = alerts.filter(
      (a) => a.status === AlertStatus.IGNORED,
    ).length;

    // Phân loại alerts theo mức độ nghiêm trọng
    const criticalAlerts = activeAlerts.filter(
      (a) => a.severity === Severity.CRITICAL,
    );
    const highAlerts = activeAlerts.filter((a) => a.severity === Severity.HIGH);
    const mediumAlerts = activeAlerts.filter(
      (a) => a.severity === Severity.MEDIUM,
    );

    const currentAlerts = activeAlerts.slice(0, 8).map((alert) => ({
      id: alert.id,
      type: alert.type,
      message: alert.message,
      severity: alert.severity,
      createdAt: alert.createdAt.toISOString(),
      suggestion: alert.suggestion ?? undefined,
      daysSinceCreated: differenceInDays(new Date(), alert.createdAt),
    }));

    return {
      active: activeAlerts.length,
      resolved,
      ignored,
      currentAlerts,
      criticalCount: criticalAlerts.length,
      highCount: highAlerts.length,
      mediumCount: mediumAlerts.length,
    };
  }

  private async getPredictions(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
    statistics: PlantStatisticsResponseDto['statistics'],
    plantHealthConds: PlantStatisticsResponseDto['plantHealth']['conditions'],
  ): Promise<PlantStatisticsResponseDto['predictions']> {
    const [
      wateringPrediction,
      harvestPrediction,
      yieldPrediction,
      riskFactors,
    ] = await Promise.all([
      this.predictNextWatering(garden, statistics, plantHealthConds),
      this.predictHarvestDate(garden, plantDetails),
      this.predictYield(garden, plantDetails, statistics),
      this.analyzeRiskFactors(garden, plantDetails),
    ]);

    return {
      nextWateringSchedule: wateringPrediction,
      estimatedHarvestDate: harvestPrediction,
      expectedYield: yieldPrediction,
      riskFactors: riskFactors.slice(0, 6), // Lấy tối đa 6 rủi ro quan trọng nhất
    };
  }

  private async predictNextWatering(
    garden: GardenWithFullData,
    statistics: PlantStatisticsResponseDto['statistics'],
    plantHealthConds: PlantStatisticsResponseDto['plantHealth']['conditions'],
  ): Promise<string | undefined> {
    const soilMoistureStats = statistics.sensorData.soilMoisture;
    const currentSoilMoistureCond = plantHealthConds.soilMoisture;

    // Lấy hoạt động tưới nước gần nhất
    const lastWateringActivity = await this.prisma.gardenActivity.findFirst({
      where: { gardenId: garden.id, activityType: ActivityType.WATERING },
      orderBy: { timestamp: 'desc' },
    });

    // Tính toán interval tưới trung bình
    const averageInterval = await this.calculateAverageWateringInterval(
      garden.id,
    );

    // Logic dự đoán thông minh
    if (currentSoilMoistureCond && soilMoistureStats) {
      const currentMoisture = currentSoilMoistureCond.current;
      const optimalMin = currentSoilMoistureCond.optimal.min;

      // Nếu độ ẩm thấp và đang giảm -> cần tưới gấp
      if (
        currentMoisture < optimalMin * 0.8 &&
        soilMoistureStats.trend.includes('Giảm')
      ) {
        return addDays(new Date(), 0.25).toISOString(); // 6 tiếng nữa
      }

      // Nếu độ ẩm dưới mức tối ưu
      if (currentMoisture < optimalMin) {
        return addDays(new Date(), 0.5).toISOString(); // 12 tiếng nữa
      }
    }

    // Dựa trên lịch sử tưới nước
    if (lastWateringActivity) {
      const daysSinceLastWatering = differenceInDays(
        new Date(),
        new Date(lastWateringActivity.timestamp),
      );

      if (daysSinceLastWatering >= averageInterval) {
        return addDays(new Date(), 1).toISOString();
      } else {
        const nextWateringDays = Math.max(
          0.5,
          averageInterval - daysSinceLastWatering,
        );
        return addDays(new Date(), nextWateringDays).toISOString();
      }
    }

    // Mặc định
    return addDays(new Date(), averageInterval).toISOString();
  }

  private async predictHarvestDate(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
  ): Promise<string | undefined> {
    if (!garden.plantStartDate || !garden.plantDuration) {
      return undefined;
    }

    // Tính toán dự kiến ban đầu
    let estimatedDate = addDays(
      new Date(garden.plantStartDate),
      garden.plantDuration,
    );

    // Điều chỉnh dựa trên điều kiện thực tế
    if (plantDetails && garden.plantGrowStage) {
      const currentStage = plantDetails.growthStages.find(
        (stage) => stage.stageName === garden.plantGrowStage,
      );

      if (currentStage) {
        const expectedDaysByNow = this.calculateExpectedDaysByStage(
          garden,
          plantDetails,
        );
        const actualDays = differenceInDays(
          new Date(),
          new Date(garden.plantStartDate),
        );

        if (expectedDaysByNow > 0) {
          const growthRate = actualDays / expectedDaysByNow;
          if (growthRate < 0.8) {
            // Chậm phát triển, gia hạn thời gian
            const delay = garden.plantDuration * 0.2; // Gia hạn 20%
            estimatedDate = addDays(estimatedDate, delay);
          } else if (growthRate > 1.2) {
            // Phát triển nhanh, rút ngắn thời gian
            const advance = garden.plantDuration * 0.1; // Rút ngắn 10%
            estimatedDate = subDays(estimatedDate, advance);
          }
        }
      }
    }

    return estimatedDate.toISOString();
  }

  private calculateExpectedDaysByStage(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
  ): number {
    if (!plantDetails || !garden.plantGrowStage) return 0;

    const currentStageIndex = plantDetails.growthStages.findIndex(
      (stage) => stage.stageName === garden.plantGrowStage,
    );

    if (currentStageIndex === -1) return 0;

    // Tính tổng số ngày từ đầu đến giai đoạn hiện tại
    return plantDetails.growthStages
      .slice(0, currentStageIndex + 1)
      .reduce((total, stage) => total + stage.duration, 0);
  }

  private async predictYield(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
    statistics: PlantStatisticsResponseDto['statistics'],
  ): Promise<string | undefined> {
    if (!garden.plantName) return undefined;

    // Lấy năng suất cơ bản theo loại cây
    const baseYield = this.getBaseYieldEstimate(garden.plantName);
    if (!baseYield) return undefined;

    // Tính toán hệ số dựa trên sức khỏe cây
    let healthMultiplier = 1.0;

    // Dựa trên điều kiện môi trường
    const envScore = this.calculateEnvironmentalScore(statistics);
    healthMultiplier *= envScore / 100;

    // Dựa trên hoạt động chăm sóc
    const careScore = this.calculateCareScore(statistics);
    healthMultiplier *= careScore / 100;

    // Dựa trên thời tiết
    const weatherScore = statistics.weather.favorablePercentage / 100;
    healthMultiplier *= 0.7 + weatherScore * 0.3; // Weather ảnh hưởng 30%

    const estimatedYield = baseYield * healthMultiplier;
    const yieldRange = {
      min: Math.max(0, estimatedYield * 0.8),
      max: estimatedYield * 1.2,
    };

    return `${yieldRange.min.toFixed(1)} - ${yieldRange.max.toFixed(1)} kg (dự kiến dựa trên điều kiện hiện tại)`;
  }

  private calculateEnvironmentalScore(
    statistics: PlantStatisticsResponseDto['statistics'],
  ): number {
    const { sensorData } = statistics;
    let totalScore = 0;
    let conditionCount = 0;

    Object.values(sensorData).forEach((sensor) => {
      if (sensor) {
        // Điểm dựa trên % thời gian ở điều kiện tối ưu
        totalScore += sensor.optimalPercentage;
        conditionCount++;
      }
    });

    return conditionCount > 0 ? totalScore / conditionCount : 70;
  }

  private calculateCareScore(
    statistics: PlantStatisticsResponseDto['statistics'],
  ): number {
    const { activities } = statistics;

    // Tính điểm dựa trên tần suất và chất lượng chăm sóc
    const totalActivities = activities.totalActivities;
    const daysInPeriod = statistics.dataRange.totalDays;

    // Tần suất hoạt động (điểm tối đa nếu có hoạt động mỗi 3 ngày)
    const frequencyScore = Math.min(
      100,
      (totalActivities / (daysInPeriod / 3)) * 100,
    );

    // Đa dạng hoạt động
    const activityTypes = Object.keys(activities.activitiesByType).length;
    const diversityScore = Math.min(100, activityTypes * 20); // Tối đa 5 loại hoạt động

    // Success rate nếu có
    const successScore = (activities as any).successRate || 70;

    return frequencyScore * 0.4 + diversityScore * 0.3 + successScore * 0.3;
  }

  private getBaseYieldEstimate(plantName: string): number | null {
    const yieldEstimates: { [key: string]: number } = {
      'cà chua': 4.0,
      'ca chua': 4.0,
      tomato: 4.0,
      'rau muống': 1.5,
      'rau cải': 1.0,
      'dưa leo': 3.0,
      'dua leo': 3.0,
      cucumber: 3.0,
      ớt: 1.2,
      ot: 1.2,
      chili: 1.2,
      pepper: 1.2,
      'xà lách': 0.8,
      'xa lach': 0.8,
      lettuce: 0.8,
      'cải bắp': 2.0,
      'cai bap': 2.0,
      cabbage: 2.0,
    };

    const normalizedName = plantName.toLowerCase().trim();
    return yieldEstimates[normalizedName] || null;
  }

  private async analyzeRiskFactors(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
  ): Promise<
    Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }>
  > {
    const riskFactors: Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }> = [];

    // Phân tích dự báo thời tiết
    const weatherRisks = await this.analyzeWeatherRisks(garden, plantDetails);
    riskFactors.push(...weatherRisks);

    // Phân tích sức khỏe cây
    const plantHealthRisks = await this.analyzePlantHealthRisks(
      garden,
      plantDetails,
    );
    riskFactors.push(...plantHealthRisks);

    // Phân tích hoạt động chăm sóc
    const careRisks = await this.analyzeCareRisks(garden);
    riskFactors.push(...careRisks);

    // Phân tích cảm biến
    const sensorRisks = await this.analyzeSensorRisks(garden);
    riskFactors.push(...sensorRisks);

    // Sắp xếp theo mức độ ưu tiên
    return riskFactors.sort((a, b) => {
      const priorityOrder = { Cao: 3, 'Trung bình': 2, Thấp: 1 };
      return (
        (priorityOrder[b.impact as keyof typeof priorityOrder] || 0) -
        (priorityOrder[a.impact as keyof typeof priorityOrder] || 0)
      );
    });
  }

  private async analyzeWeatherRisks(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
  ): Promise<
    Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }>
  > {
    const risks: Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }> = [];

    const forecast = await this.prisma.dailyForecast.findMany({
      where: {
        gardenId: garden.id,
        forecastFor: {
          gte: new Date(),
          lte: addDays(new Date(), 7),
        },
      },
      orderBy: { forecastFor: 'asc' },
    });

    forecast.forEach((dayForecast) => {
      const forecastDate = format(
        new Date(dayForecast.forecastFor),
        'dd/MM/yyyy',
      );

      // Rủi ro mưa lớn
      if (dayForecast.pop > 0.8 && (dayForecast.rain ?? 0) > 20) {
        risks.push({
          type: 'Thời tiết',
          description: `Dự báo mưa rất lớn (${dayForecast.rain}mm) vào ngày ${forecastDate}`,
          impact: 'Cao',
          recommendation:
            'Đảm bảo hệ thống thoát nước tốt, che chắn cây và tạm dừng tưới nước.',
        });
      } else if (dayForecast.pop > 0.6 && (dayForecast.rain ?? 0) > 10) {
        risks.push({
          type: 'Thời tiết',
          description: `Dự báo mưa lớn (${dayForecast.rain}mm) vào ngày ${forecastDate}`,
          impact: 'Trung bình',
          recommendation:
            'Kiểm tra thoát nước và giảm lượng tưới nước trong ngày.',
        });
      }

      // Rủi ro nhiệt độ
      const optimalTempMax =
        plantDetails?.growthStages.find(
          (gs) => gs.stageName === garden.plantGrowStage,
        )?.optimalTemperatureMax ?? 35;

      const optimalTempMin =
        plantDetails?.growthStages.find(
          (gs) => gs.stageName === garden.plantGrowStage,
        )?.optimalTemperatureMin ?? 15;

      if (dayForecast.tempMax > optimalTempMax + 8) {
        risks.push({
          type: 'Thời tiết',
          description: `Nhiệt độ cực cao (${dayForecast.tempMax}°C) vào ngày ${forecastDate}`,
          impact: 'Cao',
          recommendation:
            'Tăng cường tưới nước, tạo bóng mát, theo dõi cây chặt chẽ và tưới vào sáng sớm/chiều muộn.',
        });
      } else if (dayForecast.tempMax > optimalTempMax + 3) {
        risks.push({
          type: 'Thời tiết',
          description: `Nhiệt độ cao (${dayForecast.tempMax}°C) vào ngày ${forecastDate}`,
          impact: 'Trung bình',
          recommendation:
            'Tăng cường tưới nước và theo dõi dấu hiệu stress nhiệt.',
        });
      }

      if (dayForecast.tempMin < optimalTempMin - 8) {
        risks.push({
          type: 'Thời tiết',
          description: `Nhiệt độ cực thấp (${dayForecast.tempMin}°C) vào ngày ${forecastDate}`,
          impact: 'Cao',
          recommendation:
            'Che chắn cây bằng vải hoặc nilon, di chuyển chậu vào trong nhà nếu có thể.',
        });
      } else if (dayForecast.tempMin < optimalTempMin - 3) {
        risks.push({
          type: 'Thời tiết',
          description: `Nhiệt độ thấp (${dayForecast.tempMin}°C) vào ngày ${forecastDate}`,
          impact: 'Trung bình',
          recommendation: 'Chuẩn bị biện pháp giữ ấm cho cây.',
        });
      }

      // Rủi ro gió mạnh
      if (dayForecast.windSpeed > 20) {
        risks.push({
          type: 'Thời tiết',
          description: `Gió rất mạnh (${dayForecast.windSpeed} m/s) vào ngày ${forecastDate}`,
          impact: 'Cao',
          recommendation:
            'Đặt giá đỡ chắc chắn cho cây cao, che chắn và kiểm tra lại toàn bộ cấu trúc vườn.',
        });
      } else if (dayForecast.windSpeed > 12) {
        risks.push({
          type: 'Thời tiết',
          description: `Gió rất mạnh (${dayForecast.windSpeed} m/s) vào ngày ${forecastDate}`,
          impact: 'Cao',
          recommendation:
            'Đặt giá đỡ chắc chắn cho cây cao, che chắn và kiểm tra lại toàn bộ cấu trúc vườn.',
        });
      } else if (dayForecast.windSpeed > 12) {
        risks.push({
          type: 'Thời tiết',
          description: `Gió mạnh (${dayForecast.windSpeed} m/s) vào ngày ${forecastDate}`,
          impact: 'Trung bình',
          recommendation:
            'Kiểm tra và gia cố giá đỡ cho cây, đặc biệt là cây cao.',
        });
      }

      // Rủi ro độ ẩm cao
      if (dayForecast.humidity > 90 && dayForecast.tempMax > 25) {
        risks.push({
          type: 'Thời tiết',
          description: `Độ ẩm rất cao (${dayForecast.humidity}%) kết hợp nhiệt độ cao vào ngày ${forecastDate}`,
          impact: 'Trung bình',
          recommendation:
            'Tăng cường thông gió, theo dõi dấu hiệu bệnh nấm và giảm tưới nước.',
        });
      }
    });

    return risks;
  }

  private async analyzePlantHealthRisks(
    garden: GardenWithFullData,
    plantDetails: PlantWithGrowthStages | null,
  ): Promise<
    Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }>
  > {
    const risks: Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }> = [];

    if (!plantDetails || !garden.plantGrowStage) {
      return risks;
    }

    // Kiểm tra cảm biến có dữ liệu bất thường
    const recentSensorData = await this.prisma.sensorData.findMany({
      where: {
        gardenId: garden.id,
        timestamp: { gte: subDays(new Date(), 3) },
      },
      include: { sensor: true },
      orderBy: { timestamp: 'desc' },
    });

    // Phân tích từng loại cảm biến
    const sensorGroups = this.groupSensorDataBySensorType(recentSensorData);

    // Rủi ro về độ ẩm đất
    const soilMoistureData = sensorGroups[SensorType.SOIL_MOISTURE];
    if (soilMoistureData && soilMoistureData.length > 0) {
      const currentStage = plantDetails.growthStages.find(
        (stage) => stage.stageName === garden.plantGrowStage,
      );

      if (currentStage) {
        const avgMoisture =
          soilMoistureData.reduce((sum, d) => sum + d.value, 0) /
          soilMoistureData.length;
        const optimalMin = currentStage.optimalSoilMoistureMin ?? 40;
        const optimalMax = currentStage.optimalSoilMoistureMax ?? 80;

        if (avgMoisture < optimalMin * 0.7) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `Độ ẩm đất trung bình thấp nghiêm trọng (${avgMoisture.toFixed(1)}% so với tối ưu ${optimalMin}-${optimalMax}%)`,
            impact: 'Cao',
            recommendation:
              'Tưới nước ngay lập tức và điều chỉnh lịch tưới. Kiểm tra hệ thống tưới và khả năng giữ nước của đất.',
          });
        } else if (avgMoisture > optimalMax * 1.3) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `Độ ẩm đất quá cao (${avgMoisture.toFixed(1)}% so với tối ưu ${optimalMin}-${optimalMax}%)`,
            impact: 'Cao',
            recommendation:
              'Cải thiện thoát nước, tạm dừng tưới và kiểm tra dấu hiệu thối rễ.',
          });
        }
      }
    }

    // Rủi ro về nhiệt độ
    const temperatureData = sensorGroups[SensorType.TEMPERATURE];
    if (temperatureData && temperatureData.length > 0) {
      const currentStage = plantDetails.growthStages.find(
        (stage) => stage.stageName === garden.plantGrowStage,
      );

      if (currentStage) {
        const avgTemp =
          temperatureData.reduce((sum, d) => sum + d.value, 0) /
          temperatureData.length;
        const maxTemp = Math.max(...temperatureData.map((d) => d.value));
        const minTemp = Math.min(...temperatureData.map((d) => d.value));

        const optimalMin = currentStage.optimalTemperatureMin ?? 15;
        const optimalMax = currentStage.optimalTemperatureMax ?? 35;

        if (maxTemp > optimalMax + 10) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `Nhiệt độ đạt mức nguy hiểm (${maxTemp.toFixed(1)}°C vượt quá ${optimalMax}°C)`,
            impact: 'Cao',
            recommendation:
              'Tạo bóng mát khẩn cấp, tăng tưới nước và theo dõi dấu hiệu héo.',
          });
        } else if (minTemp < optimalMin - 5) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `Nhiệt độ quá thấp (${minTemp.toFixed(1)}°C dưới ${optimalMin}°C)`,
            impact: 'Cao',
            recommendation:
              'Che chắn giữ ấm và di chuyển cây vào nơi ấm hơn nếu có thể.',
          });
        }
      }
    }

    // Rủi ro về pH đất
    const phData = sensorGroups[SensorType.SOIL_PH];
    if (phData && phData.length > 0) {
      const currentStage = plantDetails.growthStages.find(
        (stage) => stage.stageName === garden.plantGrowStage,
      );

      if (currentStage) {
        const avgPH =
          phData.reduce((sum, d) => sum + d.value, 0) / phData.length;
        const optimalMin = currentStage.optimalPHMin ?? 6.0;
        const optimalMax = currentStage.optimalPHMax ?? 7.0;

        if (avgPH < optimalMin - 1) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `pH đất quá chua (${avgPH.toFixed(1)} so với tối ưu ${optimalMin}-${optimalMax})`,
            impact: 'Trung bình',
            recommendation:
              'Bổ sung vôi bột để tăng pH đất và cải thiện khả năng hấp thụ dinh dưỡng.',
          });
        } else if (avgPH > optimalMax + 1) {
          risks.push({
            type: 'Sức khỏe cây',
            description: `pH đất quá kiềm (${avgPH.toFixed(1)} so với tối ưu ${optimalMin}-${optimalMax})`,
            impact: 'Trung bình',
            recommendation:
              'Bổ sung phân chua như phân bón NPK có lưu huỳnh để giảm pH đất.',
          });
        }
      }
    }

    return risks;
  }

  private groupSensorDataBySensorType(
    sensorData: (SensorData & { sensor: Sensor })[],
  ): Record<SensorType, SensorData[]> {
    const grouped: Record<SensorType, SensorData[]> = {} as Record<
      SensorType,
      SensorData[]
    >;

    sensorData.forEach((data) => {
      const sensorType = data.sensor.type;
      if (!grouped[sensorType]) {
        grouped[sensorType] = [];
      }
      grouped[sensorType].push(data);
    });

    return grouped;
  }

  private async analyzeCareRisks(garden: GardenWithFullData): Promise<
    Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }>
  > {
    const risks: Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }> = [];

    const sevenDaysAgo = subDays(new Date(), 7);
    const thirtyDaysAgo = subDays(new Date(), 30);

    // Kiểm tra hoạt động tưới nước
    const recentWatering = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId: garden.id,
        activityType: ActivityType.WATERING,
        timestamp: { gte: sevenDaysAgo },
      },
    });

    if (recentWatering.length === 0) {
      risks.push({
        type: 'Chăm sóc',
        description: 'Không có hoạt động tưới nước nào trong 7 ngày qua',
        impact: 'Cao',
        recommendation:
          'Kiểm tra ngay độ ẩm đất và tưới nước nếu cần thiết. Thiết lập lịch tưới đều đặn.',
      });
    } else if (recentWatering.length < 2) {
      risks.push({
        type: 'Chăm sóc',
        description: 'Tưới nước không đều đặn trong tuần qua',
        impact: 'Trung bình',
        recommendation: 'Cải thiện tần suất tưới nước theo nhu cầu của cây.',
      });
    }

    // Kiểm tra hoạt động bón phân
    const recentFertilizing = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId: garden.id,
        activityType: ActivityType.FERTILIZING,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    if (recentFertilizing.length === 0) {
      risks.push({
        type: 'Chăm sóc',
        description: 'Không có hoạt động bón phân nào trong 30 ngày qua',
        impact: 'Trung bình',
        recommendation:
          'Cân nhắc bón phân để bổ sung dinh dưỡng cho cây, đặc biệt là phân NPK cân bằng.',
      });
    }

    // Kiểm tra hoạt động phòng trừ sâu bệnh
    const recentPestControl = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId: garden.id,
        activityType: ActivityType.PEST_CONTROL,
        timestamp: { gte: thirtyDaysAgo },
      },
    });

    // Kiểm tra xem có cảnh báo về sâu bệnh không
    const pestAlerts = await this.prisma.alert.findMany({
      where: {
        gardenId: garden.id,
        type: AlertType.PLANT_CONDITION,
        status: { in: [AlertStatus.PENDING, AlertStatus.IN_PROGRESS] },
        message: { contains: 'sâu' },
      },
    });

    if (pestAlerts.length > 0 && recentPestControl.length === 0) {
      risks.push({
        type: 'Chăm sóc',
        description: 'Có cảnh báo về sâu bệnh nhưng chưa có biện pháp xử lý',
        impact: 'Cao',
        recommendation:
          'Kiểm tra cây ngay và áp dụng biện pháp phòng trừ phù hợp.',
      });
    }

    // Kiểm tra task bị quá hạn
    const overdueTasks = await this.prisma.task.findMany({
      where: {
        gardenId: garden.id,
        status: TaskStatus.PENDING,
        dueDate: { lt: new Date() },
      },
    });

    if (overdueTasks.length > 3) {
      risks.push({
        type: 'Chăm sóc',
        description: `Có ${overdueTasks.length} công việc bị quá hạn`,
        impact: 'Trung bình',
        recommendation:
          'Ưu tiên hoàn thành các công việc quan trọng và cập nhật lịch chăm sóc.',
      });
    }

    return risks;
  }

  private async analyzeSensorRisks(garden: GardenWithFullData): Promise<
    Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }>
  > {
    const risks: Array<{
      type: string;
      description: string;
      impact: string;
      recommendation: string;
    }> = [];

    const twentyFourHoursAgo = subDays(new Date(), 1);
    const fortyEightHoursAgo = subDays(new Date(), 2);

    // Kiểm tra cảm biến không hoạt động
    const inactiveSensors = garden.sensors.filter((sensor) => {
      const latestData = sensor.sensorData[0];
      return !latestData || new Date(latestData.timestamp) < twentyFourHoursAgo;
    });

    if (inactiveSensors.length > 0) {
      const sensorNames = inactiveSensors
        .map((s) => this.getSensorNameVietnamese(s.type))
        .join(', ');
      risks.push({
        type: 'Hệ thống',
        description: `Các cảm biến không hoạt động: ${sensorNames}`,
        impact: 'Trung bình',
        recommendation:
          'Kiểm tra kết nối, pin và vị trí đặt cảm biến. Có thể cần thay thế hoặc sửa chữa.',
      });
    }

    // Kiểm tra cảm biến có dữ liệu bất thường
    for (const sensor of garden.sensors) {
      const recentData = await this.prisma.sensorData.findMany({
        where: {
          sensorId: sensor.id,
          timestamp: { gte: fortyEightHoursAgo },
        },
        orderBy: { timestamp: 'desc' },
        take: 10,
      });

      if (recentData.length > 3) {
        const values = recentData.map((d) => d.value);
        const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
        const variance =
          values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
          values.length;
        const stdDev = Math.sqrt(variance);

        // Kiểm tra dữ liệu có quá biến động không
        const coefficientOfVariation = stdDev / avg;
        if (
          coefficientOfVariation > 0.5 &&
          sensor.type !== SensorType.RAINFALL
        ) {
          // Loại trừ cảm biến mưa vì tự nhiên biến động
          risks.push({
            type: 'Hệ thống',
            description: `Cảm biến ${this.getSensorNameVietnamese(sensor.type)} có dữ liệu không ổn định`,
            impact: 'Thấp',
            recommendation:
              'Kiểm tra vị trí và cách lắp đặt cảm biến. Có thể cần hiệu chỉnh lại.',
          });
        }

        // Kiểm tra giá trị bất thường
        const latestValue = values[0];
        const isOutlier = Math.abs(latestValue - avg) > 3 * stdDev;

        if (isOutlier) {
          risks.push({
            type: 'Hệ thống',
            description: `Cảm biến ${this.getSensorNameVietnamese(sensor.type)} đang đo giá trị bất thường (${latestValue.toFixed(1)})`,
            impact: 'Thấp',
            recommendation:
              'Xác minh lại số liệu bằng cách đo thủ công hoặc kiểm tra cảm biến.',
          });
        }
      }
    }

    // Kiểm tra thiếu cảm biến quan trọng
    const importantSensorTypes = [
      SensorType.SOIL_MOISTURE,
      SensorType.TEMPERATURE,
    ];
    const missingSensors = importantSensorTypes.filter(
      (type) => !garden.sensors.some((sensor) => sensor.type === type),
    );

    if (missingSensors.length > 0) {
      const missingNames = missingSensors
        .map((type) => this.getSensorNameVietnamese(type))
        .join(', ');
      risks.push({
        type: 'Hệ thống',
        description: `Thiếu các cảm biến quan trọng: ${missingNames}`,
        impact: 'Trung bình',
        recommendation:
          'Cân nhắc lắp đặt thêm cảm biến để theo dõi điều kiện cây trồng tốt hơn.',
      });
    }

    return risks;
  }

  // Helper method để tính toán interval tưới trung bình
  private async calculateAverageWateringInterval(
    gardenId: number,
  ): Promise<number> {
    const wateringActivities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId,
        activityType: ActivityType.WATERING,
      },
      orderBy: { timestamp: 'desc' },
      take: 15, // Lấy 15 lần tưới gần nhất để tính trung bình
    });

    if (wateringActivities.length < 2) return 3; // Mặc định 3 ngày

    const intervals: number[] = [];
    for (let i = 0; i < wateringActivities.length - 1; i++) {
      const interval = differenceInDays(
        new Date(wateringActivities[i].timestamp),
        new Date(wateringActivities[i + 1].timestamp),
      );
      if (interval > 0 && interval <= 14) {
        // Chỉ tính khoảng cách hợp lý (1-14 ngày)
        intervals.push(interval);
      }
    }

    if (intervals.length === 0) return 3;

    // Tính trung bình có trọng số (các lần gần đây có trọng số cao hơn)
    let weightedSum = 0;
    let totalWeight = 0;

    intervals.forEach((interval, index) => {
      const weight = Math.pow(0.9, index); // Trọng số giảm dần theo thời gian
      weightedSum += interval * weight;
      totalWeight += weight;
    });

    const weightedAverage = weightedSum / totalWeight;
    return Math.max(1, Math.min(7, Math.round(weightedAverage))); // Giới hạn từ 1-7 ngày
  }

  // Helper method để đánh giá điều kiện môi trường tổng thể
  private async evaluateOverallEnvironmentalConditions(
    gardenId: number,
    plantDetails: PlantWithGrowthStages | null,
    daysBack: number = 7,
  ): Promise<{
    score: number;
    status: string;
    recommendations: string[];
  }> {
    if (!plantDetails) {
      return {
        score: 50,
        status: 'Không đủ thông tin',
        recommendations: [
          'Cần cập nhật thông tin loại cây và giai đoạn phát triển',
        ],
      };
    }

    const fromDate = subDays(new Date(), daysBack);
    const toDate = new Date();

    // Lấy dữ liệu cảm biến gần đây
    const sensorData = await this.prisma.sensorData.findMany({
      where: {
        gardenId,
        timestamp: { gte: fromDate, lte: toDate },
      },
      include: { sensor: true },
      orderBy: { timestamp: 'desc' },
    });

    const scores: number[] = [];
    const recommendations: string[] = [];
    const sensorGroups = this.groupSensorDataBySensorType(sensorData);

    // Đánh giá từng yếu tố môi trường
    Object.entries(sensorGroups).forEach(([sensorType, data]) => {
      if (data.length === 0) return;

      const avgValue = data.reduce((sum, d) => sum + d.value, 0) / data.length;
      const sensorScore = this.evaluateSensorCondition(
        avgValue,
        sensorType as SensorType,
        plantDetails,
      );

      scores.push(sensorScore.score);
      if (sensorScore.recommendation) {
        recommendations.push(sensorScore.recommendation);
      }
    });

    const overallScore =
      scores.length > 0
        ? Math.round(
            scores.reduce((sum, score) => sum + score, 0) / scores.length,
          )
        : 50;

    let status = 'Không xác định';
    if (overallScore >= 90) status = 'Tuyệt vời';
    else if (overallScore >= 80) status = 'Rất tốt';
    else if (overallScore >= 70) status = 'Tốt';
    else if (overallScore >= 60) status = 'Khá';
    else if (overallScore >= 50) status = 'Trung bình';
    else if (overallScore >= 40) status = 'Kém';
    else status = 'Nguy hiểm';

    return {
      score: overallScore,
      status,
      recommendations: recommendations.slice(0, 5), // Lấy tối đa 5 khuyến nghị
    };
  }

  private evaluateSensorCondition(
    value: number,
    sensorType: SensorType,
    plantDetails: PlantWithGrowthStages,
  ): { score: number; recommendation?: string } {
    // Giả sử có giai đoạn hiện tại của cây
    const currentStage = plantDetails.growthStages[0]; // Sẽ cần logic để xác định giai đoạn hiện tại

    let optimalMin: number | null = null;
    let optimalMax: number | null = null;
    let recommendation: string | undefined;

    switch (sensorType) {
      case SensorType.TEMPERATURE:
        optimalMin = currentStage?.optimalTemperatureMin ?? 20;
        optimalMax = currentStage?.optimalTemperatureMax ?? 30;
        break;
      case SensorType.SOIL_MOISTURE:
        optimalMin = currentStage?.optimalSoilMoistureMin ?? 40;
        optimalMax = currentStage?.optimalSoilMoistureMax ?? 80;
        break;
      case SensorType.HUMIDITY:
        optimalMin = currentStage?.optimalHumidityMin ?? 50;
        optimalMax = currentStage?.optimalHumidityMax ?? 80;
        break;
      case SensorType.SOIL_PH:
        optimalMin = currentStage?.optimalPHMin ?? 6.0;
        optimalMax = currentStage?.optimalPHMax ?? 7.0;
        break;
      case SensorType.LIGHT:
        optimalMin = currentStage?.optimalLightMin ?? 20000;
        optimalMax = currentStage?.optimalLightMax ?? 50000;
        break;
      default:
        return { score: 70 }; // Điểm trung bình cho cảm biến không xác định
    }

    if (optimalMin === null || optimalMax === null) {
      return { score: 70 };
    }

    // Tính điểm dựa trên khoảng tối ưu
    if (value >= optimalMin && value <= optimalMax) {
      return { score: 100 };
    }

    const range = optimalMax - optimalMin;
    const tolerance = range * 0.2; // 20% tolerance

    if (value < optimalMin) {
      const deficit = optimalMin - value;
      if (deficit <= tolerance) {
        recommendation = `${this.getSensorNameVietnamese(sensorType)} hơi thấp, cần điều chỉnh`;
        return { score: 75, recommendation };
      } else {
        recommendation = `${this.getSensorNameVietnamese(sensorType)} quá thấp, cần hành động ngay`;
        return {
          score: Math.max(0, 50 - (deficit / tolerance) * 25),
          recommendation,
        };
      }
    } else {
      const excess = value - optimalMax;
      if (excess <= tolerance) {
        recommendation = `${this.getSensorNameVietnamese(sensorType)} hơi cao, cần điều chỉnh`;
        return { score: 75, recommendation };
      } else {
        recommendation = `${this.getSensorNameVietnamese(sensorType)} quá cao, cần hành động ngay`;
        return {
          score: Math.max(0, 50 - (excess / tolerance) * 25),
          recommendation,
        };
      }
    }
  }

  // Method để tạo thống kê chi tiết cho dashboard
  async getDetailedGardenInsights(
    gardenId: number,
    userId: number,
  ): Promise<{
    healthTrend: Array<{ date: string; score: number }>;
    activityEffectiveness: Array<{ activity: string; successRate: number }>;
    environmentalStability: { stable: boolean; fluctuations: string[] };
    seasonalRecommendations: string[];
  }> {
    await this.validateUserAccess({ gardenerId: userId } as any, userId);

    const thirtyDaysAgo = subDays(new Date(), 30);

    // Tính xu hướng sức khỏe theo ngày
    const healthTrend = await this.calculateDailyHealthTrend(
      gardenId,
      thirtyDaysAgo,
    );

    // Đánh giá hiệu quả hoạt động
    const activityEffectiveness = await this.calculateActivityEffectiveness(
      gardenId,
      thirtyDaysAgo,
    );

    // Đánh giá tính ổn định môi trường
    const environmentalStability = await this.assessEnvironmentalStability(
      gardenId,
      thirtyDaysAgo,
    );

    // Khuyến nghị theo mùa
    const seasonalRecommendations = this.getSeasonalRecommendations();

    return {
      healthTrend,
      activityEffectiveness,
      environmentalStability,
      seasonalRecommendations,
    };
  }

  private async calculateDailyHealthTrend(
    gardenId: number,
    fromDate: Date,
  ): Promise<Array<{ date: string; score: number }>> {
    const dailyScores: Array<{ date: string; score: number }> = [];
    const toDate = new Date();

    for (let d = new Date(fromDate); d <= toDate; d.setDate(d.getDate() + 1)) {
      const dayStart = startOfDay(d);
      const dayEnd = endOfDay(d);

      const dayData = await this.prisma.sensorData.findMany({
        where: {
          gardenId,
          timestamp: { gte: dayStart, lte: dayEnd },
        },
        include: { sensor: true },
      });

      if (dayData.length > 0) {
        const scores = this.calculateDayHealthScore(dayData);
        dailyScores.push({
          date: format(d, 'yyyy-MM-dd'),
          score: scores,
        });
      }
    }

    return dailyScores;
  }

  private calculateDayHealthScore(
    sensorData: (SensorData & { sensor: Sensor })[],
  ): number {
    if (sensorData.length === 0) return 50;

    const sensorGroups = this.groupSensorDataBySensorType(sensorData);
    const scores: number[] = [];

    Object.entries(sensorGroups).forEach(([type, data]) => {
      if (data.length > 0) {
        const avgValue =
          data.reduce((sum, d) => sum + d.value, 0) / data.length;
        // Đây cần logic đánh giá dựa trên thông tin cây trồng
        // Tạm thời trả về điểm trung bình
        scores.push(75);
      }
    });

    return scores.length > 0
      ? Math.round(scores.reduce((sum, s) => sum + s, 0) / scores.length)
      : 50;
  }

  private async calculateActivityEffectiveness(
    gardenId: number,
    fromDate: Date,
  ): Promise<Array<{ activity: string; successRate: number }>> {
    const activities = await this.prisma.gardenActivity.findMany({
      where: {
        gardenId,
        timestamp: { gte: fromDate },
      },
      include: {
        evaluations: true,
      },
    });

    const activityGroups: Record<
      string,
      { total: number; successful: number }
    > = {};

    activities.forEach((activity) => {
      const type = this.getActivityTypeVietnamese(activity.activityType);
      if (!activityGroups[type]) {
        activityGroups[type] = { total: 0, successful: 0 };
      }

      activityGroups[type].total++;

      // Đánh giá thành công dựa trên evaluation
      if (activity.evaluations.length > 0) {
        const latestEval = activity.evaluations[0];
        if (latestEval.rating && latestEval.rating >= 3) {
          activityGroups[type].successful++;
        }
      } else {
        // Nếu không có đánh giá, giả sử 70% thành công
        activityGroups[type].successful += 0.7;
      }
    });

    return Object.entries(activityGroups).map(([activity, data]) => ({
      activity,
      successRate: Math.round((data.successful / data.total) * 100),
    }));
  }

  private getActivityTypeVietnamese(activityType: ActivityType): string {
    const translations = {
      [ActivityType.WATERING]: 'Tưới nước',
      [ActivityType.FERTILIZING]: 'Bón phân',
      [ActivityType.PRUNING]: 'Cắt tỉa',
      [ActivityType.PEST_CONTROL]: 'Phòng trừ sâu bệnh',
      [ActivityType.HARVESTING]: 'Thu hoạch',
      [ActivityType.PLANTING]: 'Trồng cây',
      [ActivityType.WEEDING]: 'Nhổ cỏ',
      [ActivityType.SOIL_TESTING]: 'Kiểm tra đất',
      [ActivityType.OTHER]: 'Khác',
    };
    return translations[activityType] || activityType;
  }

  private async assessEnvironmentalStability(
    gardenId: number,
    fromDate: Date,
  ): Promise<{ stable: boolean; fluctuations: string[] }> {
    const sensorData = await this.prisma.sensorData.findMany({
      where: {
        gardenId,
        timestamp: { gte: fromDate },
      },
      include: { sensor: true },
    });

    const fluctuations: string[] = [];
    const sensorGroups = this.groupSensorDataBySensorType(sensorData);

    let stableCount = 0;
    let totalSensors = 0;

    Object.entries(sensorGroups).forEach(([type, data]) => {
      if (data.length < 3) return; // Cần ít nhất 3 điểm dữ liệu

      totalSensors++;
      const values = data.map((d) => d.value);
      const avg = values.reduce((sum, val) => sum + val, 0) / values.length;
      const variance =
        values.reduce((sum, val) => sum + Math.pow(val - avg, 2), 0) /
        values.length;
      const stdDev = Math.sqrt(variance);
      const coefficientOfVariation = stdDev / avg;

      if (coefficientOfVariation < 0.2) {
        // Ổn định nếu CV < 20%
        stableCount++;
      } else {
        fluctuations.push(
          `${this.getSensorNameVietnamese(type as SensorType)} có biến động lớn`,
        );
      }
    });

    const stable = totalSensors > 0 && stableCount / totalSensors >= 0.7; // 70% cảm biến ổn định

    return { stable, fluctuations };
  }

  private getSeasonalRecommendations(): string[] {
    const currentMonth = new Date().getMonth() + 1; // 1-12

    // Khuyến nghị theo mùa ở Việt Nam
    if (currentMonth >= 12 || currentMonth <= 2) {
      // Mùa đông
      return [
        'Giảm tần suất tưới nước do thời tiết mát mẻ',
        'Chú ý giữ ấm cho cây trong những ngày lạnh',
        'Tăng cường ánh sáng cho cây trồng trong nhà',
        'Chuẩn bị cho mùa trồng mới',
      ];
    } else if (currentMonth >= 3 && currentMonth <= 5) {
      // Mùa xuân
      return [
        'Thời điểm tốt để trồng mới và gieo hạt',
        'Tăng cường bón phân để hỗ trợ sinh trưởng',
        'Theo dõi sâu bệnh phát triển mạnh vào mùa này',
        'Cắt tỉa và tạo dáng cho cây',
      ];
    } else if (currentMonth >= 6 && currentMonth <= 8) {
      // Mùa hè
      return [
        'Tăng tần suất tưới nước do thời tiết nóng',
        'Tạo bóng mát cho cây trong những ngày nắng gắt',
        'Chú ý phòng chống sâu bệnh',
        'Thu hoạch những loại cây đã chín',
      ];
    } else {
      // Mùa thu (9-11)
      return [
        'Chuẩn bị cho mùa khô, tăng cường tưới nước',
        'Thu hoạch các loại cây mùa',
        'Chuẩn bị đất cho mùa trồng tiếp theo',
        'Tỉa bớt lá để cây tập trung dinh dưỡng vào quả',
      ];
    }
  }
}
