import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '../../prisma/prisma.service';
import { AdviceActionDto } from './dto/advice-action.dto';
import { WeatherAdviceService } from './weather-advice.service';

interface AdviceContext {
  garden: any;
  plant: any;
  growthStage: any;
  gardener: any;
  sensorData: Record<string, SensorReading>;
  weatherData: any;
  forecasts: ForecastData;
  activities: any[];
  tasks: any[];
  schedules: any[];
  alerts: any[];
  evaluations: any[];
}

interface SensorReading {
  value: number;
  timestamp: Date;
  unit: string;
  status: 'normal' | 'warning' | 'critical';
  trend: 'rising' | 'falling' | 'stable';
}

interface ForecastData {
  hourly: any[];
  daily: any[];
  weekly: any[];
}

interface RiskItem {
  type: string;
  severity: 'high' | 'medium' | 'low';
  source: string;
  description: string;
}

@Injectable()
export class GardenAdviceService {
  private readonly logger = new Logger(GardenAdviceService.name);

  constructor(
    private prisma: PrismaService,
    private weatherAdviceService: WeatherAdviceService,
  ) {}

  async getAdvice(gardenId: number): Promise<AdviceActionDto[]> {
    try {
      this.logger.log(`🌱 Bắt đầu tạo lời khuyên cho vườn ${gardenId}`);

      // 1. Thu thập toàn bộ dữ liệu ngữ cảnh
      const context = await this.buildAdviceContext(gardenId);

      // 2. Phân tích và đánh giá tình trạng hiện tại
      const analysis = await this.analyzeCurrentSituation(context);

      // 3. Tạo lời khuyên dựa trên AI và kinh nghiệm
      const advices = await this.generateIntelligentAdvice(context, analysis);

      // 4. Cá nhân hóa và tối ưu hóa lời khuyên
      const personalizedAdvices = this.personalizeAdvice(advices, context);

      // 5. Sắp xếp và định dạng cuối cùng
      const finalAdvices = this.prioritizeAndFormat(
        personalizedAdvices,
        context,
      );

      this.logger.log(
        `✅ Đã tạo ${finalAdvices.length} lời khuyên cho vườn ${gardenId}`,
      );
      return finalAdvices;
    } catch (error) {
      this.logger.error(`❌ Lỗi khi tạo lời khuyên: ${error.message}`);
      throw error;
    }
  }

  private async buildAdviceContext(gardenId: number): Promise<AdviceContext> {
    // Thu thập dữ liệu song song để tối ưu hiệu suất
    const [
      gardenData,
      sensorData,
      weatherData,
      forecasts,
      activities,
      tasks,
      schedules,
      alerts,
      evaluations,
    ] = await Promise.all([
      this.getGardenWithPlantDetails(gardenId),
      this.analyzeSensorData(gardenId),
      this.weatherAdviceService
        .getLatestWeatherObservation(gardenId)
        .catch(() => null),
      this.getComprehensiveForecasts(gardenId),
      this.getRecentActivities(gardenId),
      this.getPendingTasks(gardenId),
      this.getUpcomingSchedules(gardenId),
      this.getActiveAlerts(gardenId),
      this.getActivityEvaluations(gardenId),
    ]);

    return {
      garden: gardenData.garden,
      plant: gardenData.plant,
      growthStage: gardenData.growthStage,
      gardener: gardenData.gardener,
      sensorData,
      weatherData,
      forecasts,
      activities,
      tasks,
      schedules,
      alerts,
      evaluations,
    };
  }

  private async getGardenWithPlantDetails(gardenId: number) {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        gardener: {
          include: {
            experienceLevel: true,
            user: {
              select: {
                firstName: true,
                lastName: true,
              },
            },
            activityEvaluation: {
              take: 5,
              orderBy: { createdAt: 'desc' },
            },
          },
        },
      },
    });

    if (!garden) {
      throw new NotFoundException(
        `🚫 Không tìm thấy vườn với mã số ${gardenId}. Vui lòng kiểm tra lại!`,
      );
    }

    if (!garden.plantName || !garden.plantGrowStage) {
      throw new NotFoundException(
        `⚠️ Vườn "${garden.name}" chưa có đầy đủ thông tin về loại cây và giai đoạn phát triển. Hãy cập nhật thông tin này để nhận được lời khuyên chính xác nhất!`,
      );
    }

    // Lấy thông tin chi tiết về cây trồng
    const plant = await this.prisma.plant.findUnique({
      where: { name: garden.plantName },
      include: {
        growthStages: {
          where: { stageName: garden.plantGrowStage },
        },
        PlantType: true,
      },
    });

    if (!plant || plant.growthStages.length === 0) {
      throw new NotFoundException(
        `🌿 Không tìm thấy thông tin chi tiết cho cây "${garden.plantName}" ở giai đoạn "${garden.plantGrowStage}". Liên hệ hỗ trợ để bổ sung thông tin này!`,
      );
    }

    return {
      garden,
      plant,
      growthStage: plant.growthStages[0],
      gardener: garden.gardener,
    };
  }

  private async analyzeSensorData(
    gardenId: number,
  ): Promise<Record<string, SensorReading>> {
    const sensors = await this.prisma.sensor.findMany({
      where: { gardenId },
      include: {
        sensorData: {
          orderBy: { timestamp: 'desc' },
          take: 10, // Lấy 10 điểm dữ liệu gần nhất để phân tích xu hướng
        },
      },
    });

    const sensorAnalysis: Record<string, SensorReading> = {};

    for (const sensor of sensors) {
      if (sensor.sensorData.length === 0) continue;

      const latestReading = sensor.sensorData[0];
      const readings = sensor.sensorData.map((d) => d.value);

      // Phân tích xu hướng
      const trend = this.analyzeTrend(readings);

      // Đánh giá trạng thái
      const status = this.evaluateSensorStatus(
        sensor.type,
        latestReading.value,
      );

      sensorAnalysis[sensor.type.toLowerCase()] = {
        value: latestReading.value,
        timestamp: latestReading.timestamp,
        unit: sensor.unit,
        status,
        trend,
      };
    }

    return sensorAnalysis;
  }

  private analyzeTrend(values: number[]): 'rising' | 'falling' | 'stable' {
    if (values.length < 3) return 'stable';

    const recent = values.slice(0, 3);
    const older = values.slice(3, 6);

    const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
    const olderAvg = older.reduce((a, b) => a + b, 0) / older.length;

    const changePercent = Math.abs((recentAvg - olderAvg) / olderAvg) * 100;

    if (changePercent < 5) return 'stable';
    return recentAvg > olderAvg ? 'rising' : 'falling';
  }

  private evaluateSensorStatus(
    sensorType: string,
    value: number,
  ): 'normal' | 'warning' | 'critical' {
    // Định nghĩa ngưỡng cảnh báo cho từng loại cảm biến
    const thresholds = {
      SOIL_MOISTURE: { critical: [0, 10, 90, 100], warning: [10, 20, 80, 90] },
      TEMPERATURE: { critical: [0, 5, 40, 50], warning: [5, 10, 35, 40] },
      HUMIDITY: { critical: [0, 20, 90, 100], warning: [20, 30, 80, 90] },
      LIGHT: {
        critical: [0, 100, 80000, 100000],
        warning: [100, 500, 60000, 80000],
      },
      SOIL_PH: { critical: [0, 4, 9, 14], warning: [4, 5, 8, 9] },
    };

    const threshold = thresholds[sensorType];
    if (!threshold) return 'normal';

    const { critical, warning } = threshold;

    if (
      (value >= critical[0] && value <= critical[1]) ||
      (value >= critical[2] && value <= critical[3])
    ) {
      return 'critical';
    }

    if (
      (value >= warning[0] && value <= warning[1]) ||
      (value >= warning[2] && value <= warning[3])
    ) {
      return 'warning';
    }

    return 'normal';
  }

  private async getComprehensiveForecasts(
    gardenId: number,
  ): Promise<ForecastData> {
    const [hourly, daily] = await Promise.all([
      this.prisma.hourlyForecast.findMany({
        where: { gardenId },
        orderBy: { forecastFor: 'asc' },
        take: 24,
      }),
      this.prisma.dailyForecast.findMany({
        where: { gardenId },
        orderBy: { forecastFor: 'asc' },
        take: 7,
      }),
    ]);

    return {
      hourly,
      daily,
      weekly: daily, // Sử dụng daily cho weekly forecast
    };
  }

  private async getRecentActivities(gardenId: number) {
    return this.prisma.gardenActivity.findMany({
      where: { gardenId },
      orderBy: { timestamp: 'desc' },
      take: 20,
      include: {
        evaluations: {
          orderBy: { createdAt: 'desc' },
          take: 1,
        },
        weatherObservation: true,
      },
    });
  }

  private async getPendingTasks(gardenId: number) {
    return this.prisma.task.findMany({
      where: {
        gardenId,
        status: 'PENDING',
      },
      orderBy: { dueDate: 'asc' },
      take: 10,
      include: {
        photoEvaluations: true,
      },
    });
  }

  private async getUpcomingSchedules(gardenId: number) {
    const now = new Date();
    const next24Hours = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    return this.prisma.wateringSchedule.findMany({
      where: {
        gardenId,
        status: 'PENDING',
        scheduledAt: {
          gte: now,
          lte: next24Hours,
        },
      },
      orderBy: { scheduledAt: 'asc' },
      take: 5,
    });
  }

  private async getActiveAlerts(gardenId: number) {
    return this.prisma.alert.findMany({
      where: {
        gardenId,
        status: {
          in: ['PENDING', 'IN_PROGRESS'],
        },
      },
      orderBy: { createdAt: 'desc' },
      take: 10,
    });
  }

  private async getActivityEvaluations(gardenId: number) {
    return this.prisma.activityEvaluation.findMany({
      where: {
        gardenActivity: {
          gardenId,
        },
      },
      orderBy: { evaluatedAt: 'desc' },
      take: 10,
      include: {
        gardenActivity: true,
      },
    });
  }

  private async analyzeCurrentSituation(context: AdviceContext) {
    const now = new Date();
    const { garden, plant, growthStage, gardener, sensorData, weatherData } =
      context;

    // Tính toán thời gian trồng
    const daysSincePlanting = garden.plantStartDate
      ? Math.floor(
          (now.getTime() - garden.plantStartDate.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Phân tích điều kiện môi trường
    const environmentalStatus = this.analyzeEnvironmentalConditions(
      sensorData,
      growthStage,
    );

    // Đánh giá tiến độ phát triển
    const growthProgress = this.assessGrowthProgress(
      daysSincePlanting,
      growthStage,
      context.activities,
    );

    // Phân tích rủi ro
    const riskAssessment = this.assessRisks(context);

    // Đánh giá hiệu quả chăm sóc gần đây
    const careEffectiveness = this.evaluateCareEffectiveness(context);

    return {
      daysSincePlanting,
      environmentalStatus,
      growthProgress,
      riskAssessment,
      careEffectiveness,
      currentSeason: this.getCurrentSeason(),
      timeOfDay: this.getTimeOfDay(now.getHours()),
      weatherTrend: this.analyzeWeatherTrend(context.forecasts),
    };
  }

  private analyzeEnvironmentalConditions(
    sensorData: Record<string, SensorReading>,
    growthStage: any,
  ) {
    const conditions = {};

    for (const [sensorType, reading] of Object.entries(sensorData)) {
      const optimalRange = this.getOptimalRange(sensorType, growthStage);
      const deviation = this.calculateDeviation(reading.value, optimalRange);

      conditions[sensorType] = {
        current: reading.value,
        optimal: optimalRange,
        deviation,
        status: reading.status,
        trend: reading.trend,
        recommendation: this.getEnvironmentalRecommendation(
          sensorType,
          reading,
          optimalRange,
        ),
      };
    }

    return conditions;
  }

  private getOptimalRange(sensorType: string, growthStage: any) {
    const mapping = {
      soil_moisture: [
        growthStage.optimalSoilMoistureMin,
        growthStage.optimalSoilMoistureMax,
      ],
      temperature: [
        growthStage.optimalTemperatureMin,
        growthStage.optimalTemperatureMax,
      ],
      humidity: [
        growthStage.optimalHumidityMin,
        growthStage.optimalHumidityMax,
      ],
      light: [growthStage.optimalLightMin, growthStage.optimalLightMax],
      soil_ph: [growthStage.optimalPHMin, growthStage.optimalPHMax],
    };

    return mapping[sensorType] || [0, 100];
  }

  private calculateDeviation(value: number, [min, max]: number[]) {
    if (value < min)
      return { type: 'below', percentage: ((min - value) / min) * 100 };
    if (value > max)
      return { type: 'above', percentage: ((value - max) / max) * 100 };
    return { type: 'optimal', percentage: 0 };
  }

  private async generateIntelligentAdvice(
    context: AdviceContext,
    analysis: any,
  ): Promise<AdviceActionDto[]> {
    const advices: AdviceActionDto[] = [];
    let idCounter = 0;

    // 1. Lời khuyên chào hỏi và tổng quan
    advices.push(...this.generateWelcomeAdvice(context, ++idCounter));

    // 2. Lời khuyên khẩn cấp (alerts và critical conditions)
    advices.push(
      ...this.generateEmergencyAdvice(context, analysis, ++idCounter),
    );

    // 3. Lời khuyên về điều kiện môi trường
    advices.push(
      ...this.generateEnvironmentalAdvice(context, analysis, ++idCounter),
    );

    // 4. Lời khuyên về chăm sóc hàng ngày
    advices.push(
      ...this.generateDailyCareAdvice(context, analysis, ++idCounter),
    );

    // 5. Lời khuyên về thời tiết và dự báo
    advices.push(...this.generateWeatherAdvice(context, analysis, ++idCounter));

    // 6. Lời khuyên về giai đoạn phát triển
    advices.push(
      ...this.generateGrowthStageAdvice(context, analysis, ++idCounter),
    );

    // 7. Lời khuyên về dinh dưỡng và bón phân
    advices.push(
      ...this.generateNutritionAdvice(context, analysis, ++idCounter),
    );

    // 8. Lời khuyên về công việc và lịch trình
    advices.push(...this.generateTaskAdvice(context, analysis, ++idCounter));

    // 9. Lời khuyên theo mùa
    advices.push(
      ...this.generateSeasonalAdvice(context, analysis, ++idCounter),
    );

    // 10. Lời khuyên học tập và phát triển
    advices.push(
      ...this.generateLearningAdvice(context, analysis, ++idCounter),
    );

    // 11. Lời khuyên dài hạn
    advices.push(
      ...this.generateLongTermAdvice(context, analysis, ++idCounter),
    );

    return advices;
  }

  private generateWelcomeAdvice(
    context: AdviceContext,
    startId: number,
  ): AdviceActionDto[] {
    const { garden, gardener } = context;
    const userName = gardener.user.firstName || 'bạn';
    const plantDisplayName = garden.plantName;
    const levelTitle = gardener.experienceLevel.title;
    const now = new Date();
    const timeGreeting = this.getTimeGreeting(now.getHours());

    return [
      {
        id: startId,
        action: `${timeGreeting} ${userName}! 🌱`,
        description: `Chào ${userName}! Tôi là trợ lý AI chăm sóc vườn của bạn. Hôm nay tôi sẽ giúp bạn chăm sóc cây ${plantDisplayName} trong vườn "${garden.name}". 

Với kinh nghiệm ở cấp độ "${levelTitle}", tôi đã chuẩn bị những lời khuyên phù hợp nhất dành riêng cho bạn. Hãy cùng tôi đảm bảo cây ${plantDisplayName} của bạn phát triển tốt nhất có thể! 🌿✨

📍 Vị trí vườn: ${garden.city ? `${garden.ward}, ${garden.district}, ${garden.city}` : 'Chưa cập nhật'}
🏷️ Loại vườn: ${this.getGardenTypeDisplay(garden.type)}
📅 Giai đoạn hiện tại: ${garden.plantGrowStage}`,
        reason: `Bắt đầu ngày mới với tinh thần tích cực và kế hoạch chăm sóc cây rõ ràng.`,
        priority: 'MEDIUM',
        suggestedTime: 'morning',
        category: 'WELCOME',
      },
    ];
  }

  private generateEmergencyAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { alerts, sensorData } = context;
    const plantDisplayName = context.garden.plantName;

    // Xử lý alerts khẩn cấp
    const criticalAlerts = alerts.filter(
      (alert) => alert.severity === 'CRITICAL',
    );
    criticalAlerts.forEach((alert) => {
      advices.push({
        id: startId++,
        action: '🚨 XỬ LÝ KHẨN CẤP',
        description: `⚠️ CẢNH BÁO NGHIÊM TRỌNG: ${alert.message}

🔧 Hành động ngay lập tức:
${alert.suggestion || 'Cần kiểm tra và xử lý ngay để tránh thiệt hại cho cây.'}

📞 Nếu không chắc chắn, hãy liên hệ với chuyên gia hoặc cộng đồng làm vườn để được hỗ trợ kịp thời!

⏰ Thời gian xử lý: NGAY LẬP TỨC - không được trì hoãn!`,
        reason: `Cảnh báo mức độ nghiêm trọng cho ${plantDisplayName} - cần hành động khẩn cấp.`,
        priority: 'HIGH',
        suggestedTime: 'noon',
        category: 'EMERGENCY',
      });
    });

    // Kiểm tra điều kiện cảm biến nguy hiểm
    Object.entries(sensorData).forEach(([sensorType, reading]) => {
      if (reading.status === 'critical') {
        const emergencyAction = this.getEmergencyAction(
          sensorType,
          reading,
          plantDisplayName,
        );
        if (emergencyAction) {
          advices.push({
            id: startId++,
            action: emergencyAction.action,
            description: emergencyAction.description,
            reason: emergencyAction.reason,
            priority: 'HIGH',
            suggestedTime: 'noon',
            category: 'EMERGENCY',
          });
        }
      }
    });

    return advices;
  }

  private getEmergencyAction(
    sensorType: string,
    reading: SensorReading,
    plantName: string,
  ) {
    const emergencyActions = {
      soil_moisture: {
        action: '💧 TƯỚI NƯỚC KHẨN CẤP',
        description: `🚨 Đất cực kỳ khô: ${reading.value}% - ${plantName} đang trong tình trạng nguy hiểm!

Hành động ngay:
1. ✅ Tưới nước từ từ, chia nhiều lần nhỏ (200-300ml mỗi lần)
2. ✅ Kiểm tra xem nước có thấm đều không (đất quá khô có thể đẩy nước ra)
3. ✅ Che bóng mát ngay lập tức để giảm bay hơi
4. ✅ Phun sương nhẹ xung quanh cây (KHÔNG phun trực tiếp lên lá)

⚠️ Tránh: Tưới một lượng lớn cùng lúc - có thể gây sốc cho rễ!`,
        reason: `Độ ẩm đất ${reading.value}% ở mức nguy hiểm - cây có thể chết trong vài giờ tới.`,
      },
      temperature: {
        action: '🌡️ HẠ NHIỆT ĐỘ KHẨN CẤP',
        description: `🔥 Nhiệt độ cực cao: ${reading.value}°C - ${plantName} đang bị stress nhiệt nghiêm trọng!

Hành động ngay:
1. 🏃‍♂️ Di chuyển cây vào bóng mát ngay lập tức
2. 🌊 Tưới nước làm mát đất xung quanh (không tưới lên lá)
3. 🧊 Đặt khay nước đá xung quanh chậu (cách 20-30cm)
4. 💨 Tạo thông gió bằng quạt hoặc mở cửa sổ
5. 🏖️ Che lưới 70-80% ngay lập tức

⚠️ Dấu hiệu nguy hiểm: Lá héo, cuộn lại, cháy rìa lá`,
        reason: `Nhiệt độ ${reading.value}°C có thể gây chết cây trong vài giờ.`,
      },
      soil_ph: {
        action: '⚗️ ĐIỀU CHỈNH PH KHẨN CẤP',
        description: `🧪 pH đất bất thường: ${reading.value} - Rễ ${plantName} không thể hấp thụ dinh dưỡng!

Hành động ngay:
${
  reading.value < 4
    ? `
📈 pH quá chua - Cần tăng pH:
- Rắc vôi bột mịn (1-2g/lít đất) và tưới đều
- Pha dung dịch baking soda loãng (1g/1L nước) tưới gốc
- Thêm tro gỗ (nếu có) trộn đều với đất`
    : `
📉 pH quá kiềm - Cần giảm pH:
- Tưới dung dịch giấm loãng (5ml/1L nước)
- Thêm bã cà phê khô trộn đều với đất
- Sử dụng phân compost có tính acid`
}

⏰ Kiểm tra lại sau 2-3 giờ để đảm bảo pH đã ổn định.`,
        reason: `pH ${reading.value} ngăn cản hấp thụ dinh dưỡng - cây có thể bị suy dinh dưỡng nặng.`,
      },
    };

    return emergencyActions[sensorType];
  }

  private generateEnvironmentalAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { sensorData, growthStage } = context;
    const plantDisplayName = context.garden.plantName;

    Object.entries(analysis.environmentalStatus).forEach(
      ([sensorType, condition]: [string, any]) => {
        if (
          condition.status === 'normal' &&
          condition.deviation.type === 'optimal'
        )
          return;

        const advice = this.generateEnvironmentalAdviceForSensor(
          sensorType,
          condition,
          plantDisplayName,
          growthStage,
          startId++,
        );

        if (advice) advices.push(advice);
      },
    );

    return advices;
  }

  private generateEnvironmentalAdviceForSensor(
    sensorType: string,
    condition: any,
    plantName: string,
    growthStage: any,
    id: number,
  ): AdviceActionDto | null {
    const { current, optimal, deviation, trend } = condition;
    const [optimalMin, optimalMax] = optimal;

    const adviceTemplates = {
      soil_moisture: {
        below: {
          action: '💧 Tưới nước cho cây',
          description: `Độ ẩm đất hiện tại ${current}% thấp hơn mức tối ưu cho ${plantName} (${optimalMin}-${optimalMax}%).

🎯 Hướng dẫn tưới nước đúng cách:
• Thời điểm: Tưới vào sáng sớm (6-8h) hoặc chiều mát (17-19h)
• Cách tưới: Từ từ, đều tay, tưới ở gốc cây
• Lượng nước: Tưới đến khi thấy nước thấm xuống 5-10cm
• Kiểm tra: Dùng tay ấn nhẹ đất để cảm nhận độ ẩm

${trend === 'falling' ? '📉 Xu hướng giảm - Cần tăng tần suất tưới!' : ''}
${trend === 'rising' ? '📈 Xu hướng tăng - Có thể giảm nhẹ lượng nước.' : ''}

💡 Mẹo: Đặt đĩa nhỏ dưới chậu để tích nước, cây sẽ tự hút khi cần.`,
          priority: deviation.percentage > 30 ? 'HIGH' : 'MEDIUM',
          category: 'WATERING',
        },
        above: {
          action: '⏸️ Giảm tưới nước',
          description: `Độ ẩm đất ${current}% cao hơn mức tối ưu (${optimalMin}-${optimalMax}%). Đất quá ẩm có thể gây thối rễ!

🛑 Hành động cần thiết:
• Dừng tưới cho đến khi độ ẩm giảm xuống ${optimalMax}%
• Kiểm tra thoát nước: Đảm bảo có lỗ thoát nước ở đáy chậu
• Tăng thông gió: Đặt cây ở nơi có gió nhẹ
• Quan sát: Kiểm tra lá có dấu hiệu vàng úa bất thường

⚠️ Dấu hiệu thối rễ: Lá vàng, héo mặc dù đất ẩm, mùi hôi từ gốc cây.
${trend === 'rising' ? '📈 Cảnh báo: Độ ẩm đang tăng - cần hành động ngay!' : ''}`,
          priority: deviation.percentage > 20 ? 'HIGH' : 'MEDIUM',
          category: 'WATERING',
        },
      },
      temperature: {
        below: {
          action: '🔥 Giữ ấm cho cây',
          description: `Nhiệt độ ${current}°C thấp hơn mức tối ưu cho ${plantName} (${optimalMin}-${optimalMax}°C).

🌡️ Cách giữ ấm hiệu quả:
• Ban ngày: Di chuyển cây ra nơi có nhiều nắng
• Ban đêm: Che phủ bằng vải không dệt hoặc bao nylon có lỗ thông khí
• Trong nhà: Đặt gần cửa sổ hướng nam, tránh điều hòa lạnh
• Ngoài trời: Che chắn gió lạnh, sử dụng màng phủ

💡 Mẹo: Đặt chai nước ấm bên cạnh chậu cây vào đêm lạnh.
${trend === 'falling' ? '❄️ Cảnh báo: Nhiệt độ đang giảm - cần bảo vệ ngay!' : ''}

🚨 Dấu hiệu lạnh: Lá có màu tím, đen, tăng trưởng chậm lại.`,
          priority: current < optimalMin - 5 ? 'HIGH' : 'MEDIUM',
          category: 'TEMPERATURE',
        },
        above: {
          action: '🌤️ Hạ nhiệt độ',
          description: `Nhiệt độ ${current}°C cao hơn mức tối ưu cho ${plantName} (${optimalMin}-${optimalMax}°C).

❄️ Cách làm mát hiệu quả:
• Che nắng: Sử dụng lưới che 50-70% từ 10h-16h
• Tăng độ ẩm: Phun sương xung quanh cây (không phun lên lá)
• Di chuyển: Chuyển cây vào bóng râm vào giữa trưa
• Tưới mát: Tưới nước vào đất xung quanh để hạ nhiệt

${trend === 'rising' ? '🔥 Cảnh báo: Nhiệt độ đang tăng - cần hành động ngay!' : ''}

🌿 Dấu hiệu stress nhiệt: Lá cuộn, héo, rìa lá cháy nâu.`,
          priority: current > optimalMax + 5 ? 'HIGH' : 'MEDIUM',
          category: 'TEMPERATURE',
        },
      },
      light: {
        below: {
          action: '💡 Tăng ánh sáng',
          description: `Ánh sáng hiện tại ${current} lux thấp hơn nhu cầu của ${plantName} (${optimalMin}-${optimalMax} lux).

☀️ Cách tăng ánh sáng:
• Di chuyển vị trí: Đặt cây gần cửa sổ hướng đông hoặc nam
• Cắt tỉa: Loại bỏ cành lá che khuất ánh sáng
• Đèn LED: Sử dụng đèn trồng cây 12-14 tiếng/ngày
• Phản xạ: Đặt gương hoặc giấy bạc phía sau cây

💡 Mẹo: Đèn LED trắng ấm (3000-4000K) tốt cho hầu hết cây gia vị.
${trend === 'falling' ? '📉 Chú ý: Ánh sáng đang giảm - có thể do thời tiết âm u.' : ''}

🌱 Dấu hiệu thiếu sáng: Lá vàng, thân cây cao ốm, ít ra hoa.`,
          priority: current < optimalMin * 0.7 ? 'HIGH' : 'MEDIUM',
          category: 'LIGHT',
        },
        above: {
          action: '🏖️ Che chắn ánh sáng',
          description: `Ánh sáng ${current} lux quá mạnh cho ${plantName} (tối đa ${optimalMax} lux).

🌂 Cách che chắn:
• Lưới che: Sử dụng lưới che 30-50% vào giữa trưa
• Di chuyển: Chuyển cây vào bóng râm từ 11h-15h
• Che tự nhiên: Trồng cây cao bên cạnh để tạo bóng
• Rèm cửa: Dùng rèm mỏng che cửa sổ vào trưa

${trend === 'rising' ? '☀️ Cảnh báo: Ánh sáng đang tăng mạnh!' : ''}

🍃 Dấu hiệu quá sáng: Lá bị cháy, có đốm nâu, cuộn lại.`,
          priority: current > optimalMax * 1.3 ? 'HIGH' : 'MEDIUM',
          category: 'LIGHT',
        },
      },
      humidity: {
        below: {
          action: '💨 Tăng độ ẩm không khí',
          description: `Độ ẩm không khí ${current}% thấp hơn mức tối ưu cho ${plantName} (${optimalMin}-${optimalMax}%).

💧 Cách tăng độ ẩm:
• Khay nước: Đặt khay nước xung quanh cây (cách chậu 10-15cm)
• Phun sương: Phun sương nhẹ 2-3 lần/ngày (tránh phun lên lá)
• Nhóm cây: Đặt nhiều cây gần nhau
• Máy phun sương: Sử dụng máy tạo ẩm nếu có thể

🌿 Lưu ý: Không phun nước trực tiếp lên lá ${plantName} vào buổi tối.
${trend === 'falling' ? '📉 Chú ý: Độ ẩm đang giảm - có thể do thời tiết khô.' : ''}`,
          priority: 'MEDIUM',
          category: 'HUMIDITY',
        },
        above: {
          action: '🌬️ Giảm độ ẩm không khí',
          description: `Độ ẩm không khí ${current}% cao hơn mức tối ưu (${optimalMin}-${optimalMax}%). Có thể gây nấm mốc!

🌪️ Cách giảm độ ẩm:
• Tăng thông gió: Mở cửa sổ, sử dụng quạt
• Giảm tưới: Chỉ tưới khi đất thực sự khô
• Tách cây: Không để cây quá gần nhau
• Hút ẩm: Sử dụng máy hút ẩm nếu có

⚠️ Dấu hiệu nấm mốc: Đốm trắng, xám trên lá, mùi ẩm mốc.
${trend === 'rising' ? '📈 Cảnh báo: Độ ẩm đang tăng cao!' : ''}`,
          priority: current > optimalMax + 15 ? 'HIGH' : 'MEDIUM',
          category: 'HUMIDITY',
        },
      },
      soil_ph: {
        below: {
          action: '📈 Tăng pH đất (giảm tính acid)',
          description: `pH đất ${current} quá acid cho ${plantName} (tối ưu ${optimalMin}-${optimalMax}).

⚗️ Cách tăng pH (giảm acid):
• Vôi bột: Rắc 1-2g vôi bột mịn/1kg đất, trộn đều
• Baking soda: Pha 1g/1L nước, tưới 1 tuần/lần
• Tro gỗ: Trộn tro gỗ (1 muỗng cà phê/chậu nhỏ)
• Phân compost: Sử dụng compost có tính kiềm nhẹ

⏰ Kiểm tra: Đo lại pH sau 3-5 ngày để điều chỉnh.
🧪 Mục tiêu: Tăng từ từ 0.2-0.5 đơn vị/tuần.`,
          priority: current < optimalMin - 0.5 ? 'HIGH' : 'MEDIUM',
          category: 'SOIL_TREATMENT',
        },
        above: {
          action: '📉 Giảm pH đất (tăng tính acid)',
          description: `pH đất ${current} quá kiềm cho ${plantName} (tối ưu ${optimalMin}-${optimalMax}).

🍋 Cách giảm pH (tăng acid):
• Giấm: Pha 5ml giấm trắng/1L nước, tưới 1 tuần/lần
• Bã cà phê: Trộn bã cà phê khô vào đất
• Phân compost acid: Sử dụng compost từ lá thông, vỏ cam
• Lưu huỳnh: Rắc bột lưu huỳnh (0.5g/1kg đất)

⏰ Kiểm tra: Đo lại pH sau 3-5 ngày để điều chỉnh.
🎯 Mục tiêu: Giảm từ từ 0.2-0.5 đơn vị/tuần.`,
          priority: current > optimalMax + 0.5 ? 'HIGH' : 'MEDIUM',
          category: 'SOIL_TREATMENT',
        },
      },
    };

    const template = adviceTemplates[sensorType];
    if (!template) return null;

    const advice = template[deviation.type];
    if (!advice) return null;

    return {
      id,
      action: advice.action,
      description: advice.description,
      reason: `${sensorType.toUpperCase()}: ${current} (mục tiêu: ${optimalMin}-${optimalMax}) - ${deviation.type === 'below' ? 'thấp' : 'cao'} ${Math.round(deviation.percentage)}%.`,
      priority: advice.priority,
      suggestedTime: this.getSuggestedTimeForAction(advice.category),
      category: advice.category,
    };
  }

  private generateDailyCareAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { activities } = context;
    const plantDisplayName = context.garden.plantName;
    const now = new Date();

    // Phân tích hoạt động gần đây
    const lastWatering = activities.find((a) => a.activityType === 'WATERING');
    const lastFertilizing = activities.find(
      (a) => a.activityType === 'FERTILIZING',
    );
    const lastPruning = activities.find((a) => a.activityType === 'PRUNING');

    // Lời khuyên về tưới nước
    if (lastWatering) {
      const hoursAgo = Math.floor(
        (now.getTime() - lastWatering.timestamp.getTime()) / (1000 * 60 * 60),
      );

      if (hoursAgo > 48) {
        advices.push({
          id: startId++,
          action: '💧 Kiểm tra nhu cầu tưới nước',
          description: `Lần tưới nước gần nhất cho ${plantDisplayName} là ${Math.floor(hoursAgo / 24)} ngày trước. 

🔍 Cách kiểm tra:
• Test ngón tay: Đặt ngón tay sâu 2-3cm vào đất
• Quan sát: Đất nứt nẻ hoặc co rút khỏi thành chậu
• Cảm nhận: Chậu cây nhẹ hơn bình thường
• Lá cây: Hơi héo vào buổi chiều

💡 Nguyên tắc vàng: "Tưới khi cần, không tưới theo lịch!"
⏰ Thời điểm tốt nhất: 6-8h sáng hoặc 17-19h chiều.`,
          reason: `Đã ${Math.floor(hoursAgo / 24)} ngày từ lần tưới cuối - cần kiểm tra độ ẩm đất.`,
          priority: hoursAgo > 72 ? 'HIGH' : 'MEDIUM',
          suggestedTime: 'morning',
          category: 'WATERING',
        });
      }
    } else {
      advices.push({
        id: startId++,
        action: '📝 Bắt đầu ghi nhật ký tưới nước',
        description: `Tôi chưa thấy bạn ghi lại hoạt động tưới nước cho ${plantDisplayName}. Việc ghi chép sẽ giúp bạn:

📊 Lợi ích:
• Theo dõi: Biết được tần suất tưới phù hợp
• Phát hiện vấn đề: Sớm nhận ra bất thường
• Cải thiện: Điều chỉnh cách chăm sóc hiệu quả
• Học hỏi: Tích lũy kinh nghiệm quý báu

📱 Ghi chép nên bao gồm:
- Thời gian tưới
- Lượng nước đã dùng
- Tình trạng đất trước khi tưới
- Phản ứng của cây sau khi tưới`,
        reason:
          'Ghi nhật ký giúp tối ưu hóa việc chăm sóc và phát triển kỹ năng.',
        priority: 'LOW',
        suggestedTime: 'evening',
        category: 'ACTIVITY',
      });
    }

    // Lời khuyên về quan sát hàng ngày
    advices.push({
      id: startId++,
      action: '👀 Quan sát sức khỏe cây hàng ngày',
      description: `Dành 5-10 phút mỗi sáng để quan sát ${plantDisplayName} của bạn:

🔍 Checklist hàng ngày:
✅ Lá: Màu sắc, hình dáng, có đốm bệnh không?
✅ Thân cây: Vững chắc, có dấu hiệu côn trùng không?
✅ Đất: Độ ẩm, màu sắc, mùi
✅ Hoa/quả: Phát triển bình thường không?
✅ Môi trường: Ánh sáng, nhiệt độ có phù hợp?

🌟 Thời điểm tốt nhất: Sáng sớm khi cây "tỉnh giấc" - bạn sẽ thấy được trạng thái tự nhiên nhất.

📷 Mẹo: Chụp ảnh để so sánh sự phát triển qua từng ngày!`,
      reason: `Quan sát hàng ngày giúp phát hiện sớm vấn đề và theo dõi sự phát triển.`,
      priority: 'MEDIUM',
      suggestedTime: 'morning',
      category: 'MONITORING',
    });

    return advices;
  }

  private generateWeatherAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { weatherData, forecasts } = context;
    const plantDisplayName = context.garden.plantName;

    // Dự báo mưa trong 24h tới
    const rainForecast = forecasts.hourly
      .filter((h) => h.pop > 0.3)
      .slice(0, 6);
    if (rainForecast.length > 0) {
      const avgPop =
        rainForecast.reduce((sum, h) => sum + h.pop, 0) / rainForecast.length;
      const nextRainHours = Math.floor(
        (rainForecast[0].forecastFor.getTime() - new Date().getTime()) /
          (1000 * 60 * 60),
      );

      if (avgPop > 0.7) {
        advices.push({
          id: startId++,
          action: '☔ Chuẩn bị cho mưa lớn',
          description: `Dự báo mưa lớn trong ${nextRainHours}h tới với xác suất ${Math.round(avgPop * 100)}%!

🛡️ Chuẩn bị ngay:
• Che chắn: Di chuyển ${plantDisplayName} vào nơi có mái che
• Thoát nước: Kiểm tra lỗ thoát nước ở đáy chậu
• Chống đỡ: Cố định cây cao bằng cọc tre
• Thu hoạch: Hái những quả/lá đã chín để tránh hư hỏng

💧 Sau mưa: Kiểm tra tình trạng úng ngập và thoát nước kịp thời.
🌈 Lợi ích: Nước mưa tự nhiên rất tốt cho cây - chứa ít chất hóa học!`,
          reason: `Mưa lớn ${Math.round(avgPop * 100)}% trong ${nextRainHours}h - cần bảo vệ cây.`,
          priority: 'HIGH',
          suggestedTime: 'morning',
          category: 'WEATHER_FORECAST',
        });
      } else if (avgPop > 0.4) {
        advices.push({
          id: startId++,
          action: '🌦️ Tận dụng nước mưa',
          description: `Có ${Math.round(avgPop * 100)}% khả năng mưa vừa trong ${nextRainHours}h tới - cơ hội tuyệt vời!

🌧️ Tận dụng nước mưa:
• Hoãn tưới: Có thể bỏ qua việc tưới nước sáng nay
• Thu nước: Đặt thau/chậu để hứng nước mưa
• Quan sát: Xem ${plantDisplayName} phản ứng với nước mưa tự nhiên
• Bón phân: Có thể bón phân lỏng loãng trước mưa để dinh dưỡng thấm sâu

💡 Nước mưa vs nước máy: Nước mưa có pH trung tính, ít chlorine - tốt hơn cho cây!`,
          reason: `Mưa vừa ${Math.round(avgPop * 100)}% - cơ hội tiết kiệm nước và cung cấp nước tự nhiên.`,
          priority: 'MEDIUM',
          suggestedTime: 'morning',
          category: 'WEATHER_FORECAST',
        });
      }
    }

    // Cảnh báo thời tiết cực đoan
    if (weatherData) {
      const { temp, windSpeed } = weatherData;

      if (temp > 35) {
        advices.push({
          id: startId++,
          action: '🔥 Bảo vệ khỏi nắng nóng cực đoan',
          description: `Nhiệt độ hiện tại ${temp}°C - mức nguy hiểm cho hầu hết cây trồng!

🚨 Hành động khẩn cấp:
• Di chuyển ngay: Chuyển ${plantDisplayName} vào bóng mát
• Che nắng 80%: Sử dụng lưới che đậm hoặc tấm bạt
• Tưới làm mát: Tưới đất xung quanh (KHÔNG tưới lên lá)
• Tạo vi khí hậu: Đặt khay nước đá xung quanh chậu

❄️ Mẹo hạ nhiệt nhanh:
- Quấn khăn ướt quanh chậu
- Đặt cây trong khay nước sâu 2-3cm
- Sử dụng quạt tạo gió nhẹ

⚠️ Dấu hiệu cây bị nóng: Lá cuộn, héo, rìa lá cháy nâu.`,
          reason: `Nhiệt độ ${temp}°C có thể gây chết cây trong vài giờ.`,
          priority: 'HIGH',
          suggestedTime: 'noon',
          category: 'EMERGENCY',
        });
      }

      if (windSpeed > 15) {
        advices.push({
          id: startId++,
          action: '💨 Bảo vệ khỏi gió mạnh',
          description: `Gió mạnh ${windSpeed} m/s có thể làm tổn hại ${plantDisplayName}!

🌪️ Bảo vệ ngay:
• Cố định: Buộc cây vào cọc chắc chắn bằng dây mềm
• Di chuyển: Chuyển chậu nhỏ vào nơi kín gió
• Che chắn: Dựng tấm chắn gió bằng vật liệu có sẵn
• Kiểm tra: Đảm bảo các tấm che nắng được buộc chặt

🔧 Sau gió lớn:
- Kiểm tra cành gãy, lá rách
- Tỉa bỏ phần hư hỏng
- Kiểm tra hệ thống cố định
- Quan sát dấu hiệu stress của cây`,
          reason: `Gió ${windSpeed} m/s có thể gây gãy cành và đổ cây.`,
          priority: 'HIGH',
          suggestedTime: 'noon',
          category: 'WEATHER_FORECAST',
        });
      }
    }

    return advices;
  }

  private generateGrowthStageAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { garden, growthStage } = context;
    const plantDisplayName = garden.plantName;
    const stageName = garden.plantGrowStage;
    const { daysSincePlanting } = analysis;

    // Lời khuyên chi tiết theo giai đoạn
    const stageAdvice = this.getDetailedStageAdvice(
      stageName,
      plantDisplayName,
      daysSincePlanting,
    );
    if (stageAdvice) {
      advices.push({
        id: startId++,
        action: stageAdvice.action,
        description: stageAdvice.description,
        reason: stageAdvice.reason,
        priority: 'MEDIUM',
        suggestedTime: 'morning',
        category: 'GROWTH_STAGE',
      });
    }

    // Lời khuyên về thời gian dự kiến chuyển giai đoạn
    if (growthStage.duration && daysSincePlanting > 0) {
      const progressPercent = Math.min(
        (daysSincePlanting / growthStage.duration) * 100,
        100,
      );
      const daysRemaining = Math.max(
        growthStage.duration - daysSincePlanting,
        0,
      );

      if (progressPercent > 80) {
        advices.push({
          id: startId++,
          action: '🔄 Chuẩn bị chuyển giai đoạn',
          description: `${plantDisplayName} đã hoàn thành ${Math.round(progressPercent)}% giai đoạn ${stageName}!

⏳ Thời gian còn lại: Khoảng ${daysRemaining} ngày nữa
🔍 Dấu hiệu cần quan sát: ${this.getStageTransitionSigns(stageName)}

📋 Chuẩn bị cho giai đoạn tiếp theo:
${this.getNextStagePreparation(stageName, plantDisplayName)}

💡 Lưu ý: Thời gian chuyển giai đoạn có thể thay đổi tùy thuộc vào điều kiện chăm sóc và thời tiết.`,
          reason: `Giai đoạn ${stageName} sắp kết thúc - cần chuẩn bị chuyển đổi.`,
          priority: 'MEDIUM',
          suggestedTime: 'morning',
          category: 'GROWTH_STAGE',
        });
      }
    }

    return advices;
  }

  private getDetailedStageAdvice(
    stageName: string,
    plantName: string,
    days: number,
  ) {
    const stageAdviceMap = {
      Seeding: {
        action: '🌱 Chăm sóc cây con',
        description: `Giai đoạn nảy mầm của ${plantName} rất quan trọng và nhạy cảm!

🎯 Mục tiêu: Giúp cây con phát triển rễ và lá đầu tiên khỏe mạnh

🌿 Chăm sóc đặc biệt:
• Độ ẩm: Giữ đất ẩm nhẹ, không để khô hoặc úng nước
• Ánh sáng: Ánh sáng gián tiếp, tránh nắng trực tiếp
• Nhiệt độ: Ổn định 20-25°C, tránh thay đổi đột ngột
• Không bón phân: Hạt đã có đủ dinh dưỡng ban đầu

⚠️ Tránh làm:
- Tưới nước quá mạnh (dùng bình xịt)
- Di chuyển cây quá nhiều
- Bón phân sớm
- Để gió lạnh thổi trực tiếp

💡 Mẹo: Che phủ bằng màng bọc thực phẩm để tạo hiệu ứng nhà kính mini!`,
        reason: `Giai đoạn nảy mầm (${days} ngày) - thời kỳ quan trọng nhất quyết định thành công.`,
      },
      Vegetative: {
        action: '🌿 Thúc đẩy sinh trưởng xanh',
        description: `Giai đoạn sinh trưởng của ${plantName} - thời điểm phát triển mạnh mẽ nhất!

🎯 Mục tiêu: Xây dựng hệ thống lá và thân chắc khỏe

🌱 Chăm sóc tích cực:
• Bón phân đạm: NPK 20-10-10 hoặc phân đạm cao, 1-2 tuần/lần
• Tưới nước đầy đủ: Đất luôn ẩm nhưng không úng
• Ánh sáng: Tối thiểu 6-8 tiếng ánh sáng trực tiếp/ngày
• Tỉa cành: Loại bỏ lá già, cành yếu để tập trung dinh dưỡng

🔧 Kỹ thuật chăm sóc:
- Tỉa ngọn: Với cây thảo mộc để khuyến khích phân cành
- Bấm hoa: Loại bỏ nụ hoa sớm để tập trung vào lá
- Xới đất: Nhẹ nhàng để tăng oxy cho rễ
- Kiểm soát sâu bệnh: Phun thuốc phòng trừ sinh học

💪 Dấu hiệu phát triển tốt: Lá xanh đậm, thân cứng, nhiều chồi mới.`,
        reason: `Giai đoạn sinh trưởng (${days} ngày) - tối ưu hóa phát triển thân lá.`,
      },
      Flowering: {
        action: '🌸 Kích thích ra hoa',
        description: `${plantName} bước vào giai đoạn ra hoa - thời điểm quyết định năng suất!

🎯 Mục tiêu: Tạo điều kiện tối ưu cho việc ra hoa và thụ phấn

🌺 Chăm sóc đặc biệt:
• Thay đổi dinh dưỡng: Giảm đạm, tăng lân-kali (NPK 5-20-20)
• Kiểm soát nước: Giảm nhẹ lượng nước để tạo stress nhẹ kích thích ra hoa
• Ánh sáng đầy đủ: Đảm bảo 8-10 tiếng ánh sáng/ngày
• Ổn định nhiệt độ: Tránh biến động nhiệt độ đột ngột

🐝 Hỗ trợ thụ phấn:
- Tự nhiên: Thu hút ong bướm bằng cây hoa khác
- Nhân tạo: Dùng cọ vẽ chuyển phấn hoa (cho cà chua, ớt)
- Rung nhẹ: Rung nhẹ cây vào buổi sáng để phấn bay

⚠️ Tránh:
- Bón phân đạm cao (làm cây ra lá thay vì hoa)
- Tưới nước lên hoa
- Di chuyển cây khi đang có hoa`,
        reason: `Giai đoạn ra hoa (${days} ngày) - quyết định khả năng đậu quả.`,
      },
      Fruiting: {
        action: '🍅 Chăm sóc quả phát triển',
        description: `${plantName} đang ra quả - giai đoạn thu hoạch thành quả!

🎯 Mục tiêu: Đảm bảo quả phát triển đầy đặn và chất lượng cao

🍃 Chăm sóc chuyên sâu:
• Dinh dưỡng kali cao: NPK 10-10-30 hoặc phân kali chuyên dụng
• Tưới đều đặn: Không để đất khô đột ngột (gây nứt quả)
• Chống đỡ: Dựng giàn hoặc cọc cho cành nặng quả
• Tỉa lá: Loại bỏ lá che khuất quả để tăng ánh sáng

📏 Quản lý quả:
- Tỉa quả: Loại bỏ quả nhỏ, dị dạng để tập trung dinh dưỡng
- Che nắng: Dùng lưới 30% nếu quá nắng gắt
- Thu hoạch đúng lúc: ${this.getHarvestTiming(plantName)}

🔍 Quan sát hàng ngày:
- Màu sắc quả thay đổi
- Kích thước và độ chắc
- Dấu hiệu sâu bệnh trên quả`,
        reason: `Giai đoạn ra quả (${days} ngày) - tối ưu hóa chất lượng và năng suất.`,
      },
      Maturity: {
        action: '🏆 Thu hoạch và duy trì',
        description: `${plantName} đã trưởng thành - thời điểm thu hoạch và lập kế hoạch tiếp theo!

🎯 Mục tiêu: Thu hoạch tối đa và chuẩn bị chu kỳ mới

🌾 Quản lý thu hoạch:
• Thu hoạch đúng lúc: ${this.getMaturityHarvestGuide(plantName)}
• Bảo quản sau thu hoạch: Kỹ thuật lưu trữ thích hợp
• Thu thập hạt giống: Nếu muốn nhân giống
• Chuẩn bị đất: Cho chu kỳ trồng tiếp theo

🔄 Lập kế hoạch tiếp theo:
- Phân tích: Đánh giá thành công/thất bại của chu kỳ
- Cải thiện đất: Bổ sung phân compost, vi sinh
- Luân canh: Thay đổi loại cây để đất không bị cạn kiệt
- Ghi chép: Tổng kết kinh nghiệm để áp dụng lần sau

💡 Kinh nghiệm: Chu kỳ thành công là nền tảng cho những vụ mùa tốt hơn!`,
        reason: `Giai đoạn trưởng thành (${days} ngày) - tận dụng tối đa và chuẩn bị tương lai.`,
      },
    };

    return stageAdviceMap[stageName] || null;
  }

  private getStageTransitionSigns(stageName: string): string {
    const transitionSigns = {
      Seeding:
        'Lá thật đầu tiên xuất hiện, chiều cao 3-5cm, rễ phát triển vững chắc',
      Vegetative: 'Cây đạt 15-20cm, có 6-8 lá thật, thân cứng cáp',
      Flowering: 'Xuất hiện nụ hoa đầu tiên, cây ngừng phát triển chiều cao',
      Fruiting: 'Hoa đã thụ phấn, quả non bắt đầu hình thành',
      Maturity: 'Quả có màu sắc đặc trưng, dễ tách khỏi cành khi chạm nhẹ',
    };

    return (
      transitionSigns[stageName] ||
      'Quan sát sự thay đổi trong phát triển của cây'
    );
  }

  private getNextStagePreparation(
    stageName: string,
    plantName: string,
  ): string {
    const preparations = {
      Seeding: `• Chuẩn bị phân NPK cân bằng cho giai đoạn sinh trưởng
• Tăng cường ánh sáng dần dần
• Chuẩn bị chậu lớn hơn nếu cần`,
      Vegetative: `• Chuyển sang phân có ít đạm hơn (NPK 5-20-20)
• Chuẩn bị giàn đỡ cho khi ra hoa
• Giảm tần suất tưới nhẹ để kích thích ra hoa`,
      Flowering: `• Chuẩn bị phân kali cao cho giai đoạn ra quả
• Lắp đặt hệ thống chống đỡ cho cành nặng quả
• Chuẩn bị dụng cụ hỗ trợ thụ phấn`,
      Fruiting: `• Chuẩn bị dụng cụ thu hoạch sạch sẽ
• Tìm hiểu cách bảo quản ${plantName} sau thu hoạch
• Lên kế hoạch cho chu kỳ trồng tiếp theo`,
      Maturity: `• Chuẩn bị đất mới cho chu kỳ tiếp theo
• Chọn giống mới hoặc thu thập hạt giống
• Vệ sinh dụng cụ và không gian trồng trọt`,
    };

    return (
      preparations[stageName] || 'Chuẩn bị cho giai đoạn phát triển tiếp theo'
    );
  }

  private getHarvestTiming(plantName: string): string {
    const harvestGuide = {
      'cà chua': 'Thu khi quả chuyển màu hồng, sẽ tiếp tục chín sau khi hái',
      ớt: 'Thu khi quả đạt kích thước đầy đặn, màu sắc tươi sáng',
      'dưa chuột': 'Thu khi quả dài 15-20cm, màu xanh đều',
      'xà lách':
        'Thu lá ngoài khi dài 10-15cm, để lá trong tiếp tục phát triển',
      'húng quế': 'Hái lá trước khi ra hoa, vào buổi sáng sớm',
      'bạc hà': 'Thu hoạch thường xuyên để kích thích ra lá mới',
    };

    return (
      harvestGuide[plantName.toLowerCase()] ||
      'Thu hoạch khi quả/lá đạt kích thước và màu sắc tối ưu'
    );
  }

  private getMaturityHarvestGuide(plantName: string): string {
    const maturityGuide = {
      'cà chua': 'Thu vào buổi sáng mát, để cuống 1-2cm, bảo quản nơi khô ráo',
      ớt: 'Thu khi quả đã chín đỏ hoàn toàn, có thể phơi khô bảo quản',
      'dưa chuột': 'Thu hàng ngày vào sáng sớm, ngâm nước lạnh để giữ độ giòn',
      'xà lách': 'Thu cả cây vào sáng sớm, rửa sạch và để tủ lạnh',
      'húng quế': 'Thu lá thường xuyên, có thể sấy khô hoặc đông lạnh bảo quản',
      'bạc hà': 'Thu cắt cành, cắm nước hoặc sấy khô làm trà',
    };

    return (
      maturityGuide[plantName.toLowerCase()] ||
      'Thu hoạch đúng thời điểm và bảo quản phù hợp'
    );
  }

  private generateNutritionAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { activities, growthStage } = context;
    const plantDisplayName = context.garden.plantName;
    const now = new Date();

    // Phân tích lần bón phân gần nhất
    const lastFertilizing = activities.find(
      (a) => a.activityType === 'FERTILIZING',
    );
    const daysSinceLastFertilizing = lastFertilizing
      ? Math.floor(
          (now.getTime() - lastFertilizing.timestamp.getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : null;

    // Lời khuyên về dinh dưỡng theo giai đoạn
    const nutritionAdvice = this.getNutritionAdviceByStage(
      context.garden.plantGrowStage,
      plantDisplayName,
    );
    if (nutritionAdvice) {
      advices.push({
        id: startId++,
        action: nutritionAdvice.action,
        description: nutritionAdvice.description,
        reason: nutritionAdvice.reason,
        priority: 'MEDIUM',
        suggestedTime: 'evening',
        category: 'FERTILIZING',
      });
    }

    // Kiểm tra chu kỳ bón phân
    if (daysSinceLastFertilizing === null) {
      advices.push({
        id: startId++,
        action: '🧪 Bắt đầu chế độ dinh dưỡng',
        description: `Tôi chưa thấy bạn ghi lại hoạt động bón phân cho ${plantDisplayName}. Việc cung cấp dinh dưỡng đúng cách rất quan trọng!

📊 Lợi ích của việc bón phân đúng cách:
• Tăng trưởng: Cây phát triển nhanh và khỏe mạnh
• Chống bệnh: Cây khỏe ít bị sâu bệnh tấn công
• Năng suất: Nhiều hoa, quả chất lượng cao
• Màu sắc: Lá xanh đậm, hoa quả đẹp mắt

🌱 Phân bón cơ bản cho ${plantDisplayName}:
${this.getBasicFertilizerGuide(context.garden.plantGrowStage)}

⏰ Tần suất: 2-3 tuần/lần, tùy theo loại phân và giai đoạn phát triển.`,
        reason: 'Chưa có hoạt động bón phân - cần thiết lập chế độ dinh dưỡng.',
        priority: 'MEDIUM',
        suggestedTime: 'evening',
        category: 'FERTILIZING',
      });
    } else if (daysSinceLastFertilizing > 21) {
      advices.push({
        id: startId++,
        action: '🌿 Đã đến lúc bón phân',
        description: `Lần bón phân gần nhất cho ${plantDisplayName} là ${daysSinceLastFertilizing} ngày trước. Đã đến lúc bổ sung dinh dưỡng!

🔍 Dấu hiệu cần bón phân:
• Lá: Màu vàng nhạt, kích thước nhỏ hơn bình thường
• Tăng trưởng: Chậm lại đáng kể
• Hoa/quả: Ít hơn, kích thước nhỏ
• Sức đề kháng: Dễ bị sâu bệnh

💊 Gợi ý bón phân:
${this.getFertilizerRecommendation(context.garden.plantGrowStage, plantDisplayName)}

⚠️ Lưu ý: Bón phân vào chiều mát, sau khi tưới nước, tránh bón khi đất khô.`,
        reason: `Đã ${daysSinceLastFertilizing} ngày từ lần bón phân cuối - cây cần dinh dưỡng.`,
        priority: daysSinceLastFertilizing > 30 ? 'HIGH' : 'MEDIUM',
        suggestedTime: 'evening',
        category: 'FERTILIZING',
      });
    }

    // Lời khuyên về phân compost tự làm
    advices.push({
      id: startId++,
      action: '♻️ Tự làm phân compost',
      description: `Phân compost tự làm là nguồn dinh dưỡng tuyệt vời và thân thiện môi trường cho ${plantDisplayName}!

🗑️ Nguyên liệu từ nhà bếp:
• Xanh: Vỏ rau củ, bã cà phê, lá cây
• Nâu: Giấy báo, lá khô, mùn cưa
• Tránh: Thịt, cá, sữa, dầu mỡ

🔄 Cách làm đơn giản:
1. Lớp đáy: Cành khô, lá khô để thoát nước
2. Xen kẽ: 1 lớp xanh + 1 lớp nâu
3. Độ ẩm: Ẩm như miếng bọt biển vắt ráo
4. Đảo trộn: 1 tuần/lần để cung cấp oxy
5. Hoàn thành: 2-3 tháng có phân đen, thơm đất

💰 Lợi ích: Tiết kiệm tiền, giảm rác thải, cung cấp dinh dưỡng toàn diện!`,
      reason: 'Phân compost tự làm cung cấp dinh dưỡng bền vững và an toàn.',
      priority: 'LOW',
      suggestedTime: 'evening',
      category: 'FERTILIZING',
    });

    return advices;
  }

  private getNutritionAdviceByStage(stageName: string, plantName: string) {
    const nutritionAdviceMap = {
      Seeding: {
        action: '🌱 Dinh dưỡng cho cây con',
        description: `Giai đoạn nảy mầm - ${plantName} chủ yếu sử dụng dinh dưỡng từ hạt!

🚫 KHÔNG BÓN PHÂN trong 2-3 tuần đầu:
• Hạt đã chứa đủ dinh dưỡng cho giai đoạn này
• Bón phân sớm có thể "đốt" rễ non
• Nồng độ muối cao gây stress cho cây con

🌿 Nếu thực sự cần (sau 3 tuần):
• Phân lỏng pha loãng gấp đôi hướng dẫn
• Phun lên lá với nồng độ 0.1%
• Ưu tiên phân hữu cơ như dịch giun quế

💡 Dấu hiệu thiếu dinh dưỡng: Lá vàng hoàn toàn, tăng trưởng dừng hẳn sau 4 tuần.`,
        reason:
          'Giai đoạn nảy mầm - hạt cung cấp đủ dinh dưỡng, tránh bón phân sớm.',
      },
      Vegetative: {
        action: '💪 Bón phân thúc đẩy sinh trưởng',
        description: `Giai đoạn sinh trưởng - ${plantName} cần nhiều đạm để phát triển lá!

🧪 Công thức dinh dưỡng:
• NPK 20-10-10 hoặc 16-16-16 - cân bằng cao đạm
• Tần suất: 2 tuần/lần
• Liều lượng: 1-2g/1L nước (theo hướng dẫn nhà sản xuất)

🌿 Phân hữu cơ bổ sung:
• Dịch giun quế: 1 tuần/lần, pha 1:10 với nước
• Phân cá: 2 tuần/lần cho dinh dưỡng toàn diện
• Bã cà phê: Rắc trực tiếp lên đất, bổ sung đạm từ từ

⏰ Thời điểm tốt nhất: Chiều mát (17-19h), sau khi tưới nước.`,
        reason:
          'Giai đoạn sinh trưởng - cần đạm cao để phát triển thân lá mạnh mẽ.',
      },
      Flowering: {
        action: '🌸 Bón phân kích thích ra hoa',
        description: `Giai đoạn ra hoa - chuyển đổi dinh dưỡng để ${plantName} tập trung ra hoa!

🧪 Thay đổi công thức:
• NPK 5-20-20 hoặc 10-30-20 - giảm đạm, tăng lân
• Tần suất: 10-14 ngày/lần
• Lân bổ sung: Phân xương cá, phân dơi

🌺 Chất kích thích ra hoa:
• Kali dihydrogen phosphate (KH2PO4): 1g/1L, phun lá 1 tuần/lần
• Vitamin B1: Pha loãng phun lá để giảm stress
• Canxi: Bổ sung từ vỏ trứng nghiền hoặc canxi chloride

⚠️ Tránh: Bón phân đạm cao sẽ làm cây ra lá thay vì hoa!`,
        reason:
          'Giai đoạn ra hoa - cần lân cao để kích thích hoa và chuẩn bị đậu quả.',
      },
      Fruiting: {
        action: '🍅 Bón phân cho quả phát triển',
        description: `Giai đoạn ra quả - ${plantName} cần kali để quả to và ngọt!

🧪 Công thức cho quả:
• NPK 10-10-30 hoặc 15-15-30 - kali cao
• Tần suất: 1-2 tuần/lần tùy tốc độ phát triển quả
• Canxi bổ sung: Ngăn chặn nứt quả và thối đỉnh

🍃 Dinh dưỡng chuyên biệt:
• Kali sulfate: Tăng độ ngọt của quả
• Magie sulfate: Chống vàng lá, tăng chất lượng quả
• Vi lượng: Sắt, kẽm để quả phát triển đầy đặn

💧 Lưu ý quan trọng: Tưới đều đặn để dinh dưỡng được hấp thu tốt!`,
        reason:
          'Giai đoạn ra quả - cần kali cao để quả phát triển to, chắc và ngọt.',
      },
      Maturity: {
        action: '🏆 Duy trì dinh dưỡng cuối mùa',
        description: `Giai đoạn trưởng thành - duy trì sức khỏe cây để thu hoạch tối đa!

🧪 Dinh dưỡng duy trì:
• NPK cân bằng 15-15-15 - duy trì hoạt động sống
• Tần suất giảm: 3-4 tuần/lần
• Tập trung: Kali + vi lượng cho chất lượng quả

🌿 Chăm sóc đặc biệt:
• Amino acid: Tăng sức đề kháng cuối mùa
• Canxi: Củng cố thành tế bào, kéo dài thời gian thu hoạch
• Enzyme: Hỗ trợ tiêu hóa dinh dưỡng hiệu quả

📝 Chuẩn bị: Bắt đầu chuẩn bị đất cho chu kỳ tiếp theo với phân compost!`,
        reason:
          'Giai đoạn trưởng thành - duy trì sức khỏe cây để thu hoạch kéo dài.',
      },
    };

    return nutritionAdviceMap[stageName] || null;
  }

  private getBasicFertilizerGuide(stageName: string): string {
    const guides = {
      Seeding:
        '• Chưa cần bón phân (hạt có đủ dinh dưỡng)\n• Nếu cần: dịch giun quế pha loãng gấp đôi',
      Vegetative:
        '• NPK 20-10-10: 1-2g/1L nước, 2 tuần/lần\n• Dịch giun quế: 1 tuần/lần\n• Bã cà phê: rắc trực tiếp',
      Flowering:
        '• NPK 5-20-20: 1-2g/1L nước, 2 tuần/lần\n• Phân xương cá cho lân tự nhiên\n• Tránh phân đạm cao',
      Fruiting:
        '• NPK 10-10-30: 1-2g/1L nước, 1-2 tuần/lần\n• Kali sulfate cho độ ngọt\n• Canxi chống nứt quả',
      Maturity:
        '• NPK 15-15-15: 2-3g/1L nước, 3-4 tuần/lần\n• Vi lượng bổ sung\n• Chuẩn bị phân compost',
    };

    return (
      guides[stageName] ||
      '• NPK cân bằng theo hướng dẫn\n• Phân hữu cơ 2-3 tuần/lần'
    );
  }

  private getFertilizerRecommendation(
    stageName: string,
    plantName: string,
  ): string {
    const recommendations = {
      Seeding: `• Dịch giun quế pha loãng (1:20 với nước) - nhẹ nhàng, an toàn
• Vitamin B1 - giúp rễ phát triển khỏe mạnh
• Tần suất: 3-4 tuần/lần, rất ít`,
      Vegetative: `• NPK 20-10-10 hoặc Phân NPK cao đạm - 1.5g/1L nước
• Dịch cá - bổ sung protein và amino acid tự nhiên
• Phun lá: NPK 0.5g/1L, sáng sớm 1 tuần/lần`,
      Flowering: `• NPK 5-20-20 - 1.5-2g/1L nước cho lân cao
• Phân xương cá nghiền - lân tự nhiên tác dụng lâu
• KH2PO4: 1g/1L phun lá kích thích ra hoa`,
      Fruiting: `• NPK 10-10-30 - 2g/1L nước cho kali cao
• Kali sulfate - 1g/1L tăng độ ngọt quả
• Canxi chloride: 0.5g/1L chống rụng quả`,
      Maturity: `• NPK 15-15-15 cân bằng - 1g/1L nước duy trì
• Amino acid tổng hợp - tăng sức đề kháng
• Vi lượng B, Zn, Fe - chất lượng quả tốt hơn`,
    };

    return (
      recommendations[stageName] ||
      `• NPK cân bằng theo giai đoạn phát triển\n• Phân hữu cơ bổ sung dinh dưỡng tự nhiên`
    );
  }

  private generateTaskAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { tasks, schedules } = context;
    const plantDisplayName = context.garden.plantName;
    const now = new Date();

    // Xử lý công việc quá hạn
    const overdueTasks = tasks.filter((task) => new Date(task.dueDate) < now);
    if (overdueTasks.length > 0) {
      const criticalTasks = overdueTasks.filter((task) =>
        ['WATERING', 'FERTILIZING'].includes(task.type.toUpperCase()),
      );

      advices.push({
        id: startId++,
        action: `⚠️ Xử lý ${overdueTasks.length} công việc quá hạn`,
        description: `Bạn có ${overdueTasks.length} công việc đã quá hạn cho ${plantDisplayName}!

🚨 Ưu tiên cao (${criticalTasks.length} việc):
${criticalTasks.map((task) => `• ${task.type}: ${task.description} (quá hạn ${Math.floor((now.getTime() - new Date(task.dueDate).getTime()) / (1000 * 60 * 60 * 24))} ngày)`).join('\n')}

📋 Các việc khác:
${overdueTasks
  .filter((t) => !criticalTasks.includes(t))
  .map((task) => `• ${task.type}: ${task.description}`)
  .join('\n')}

💡 Đề xuất: Hoàn thành công việc quan trọng trước, sau đó làm các việc còn lại theo thứ tự ưu tiên.

✅ Sau khi hoàn thành: Đánh dấu "Hoàn thành" để hệ thống cập nhật tiến độ!`,
        reason: `${overdueTasks.length} công việc quá hạn có thể ảnh hưởng đến sức khỏe cây.`,
        priority: criticalTasks.length > 0 ? 'HIGH' : 'MEDIUM',
        suggestedTime: 'morning',
        category: 'TASK_MANAGEMENT',
      });
    }

    // Công việc hôm nay
    const todayTasks = tasks.filter((task) => {
      const taskDate = new Date(task.dueDate);
      return taskDate.toDateString() === now.toDateString();
    });

    if (todayTasks.length > 0) {
      advices.push({
        id: startId++,
        action: `📅 Kế hoạch hôm nay (${todayTasks.length} việc)`,
        description: `Hôm nay bạn có ${todayTasks.length} công việc cần làm cho ${plantDisplayName}:

📝 Danh sách công việc:
${todayTasks
  .map((task, index) => {
    const timeString = new Date(task.dueDate).toLocaleTimeString('vi-VN', {
      hour: '2-digit',
      minute: '2-digit',
    });
    return `${index + 1}. ${task.type} (${timeString}): ${task.description}`;
  })
  .join('\n')}

⏰ Gợi ý thời gian:
• Sáng sớm (6-8h): Quan sát, tưới nước, kiểm tra sâu bệnh
• Buổi chiều (16-18h): Bón phân, tỉa cành, chăm sóc đặc biệt
• Buổi tối (19-20h): Ghi chép, lập kế hoạch ngày mai

💪 Động viên: Hoàn thành đúng lịch sẽ giúp ${plantDisplayName} phát triển tốt nhất!`,
        reason: `${todayTasks.length} công việc đã lên lịch cho hôm nay cần được thực hiện.`,
        priority: 'MEDIUM',
        suggestedTime: 'morning',
        category: 'TASK_MANAGEMENT',
      });
    }

    // Lịch tưới nước sắp tới
    if (schedules.length > 0) {
      const nextSchedule = schedules[0];
      const hoursUntil = Math.floor(
        (nextSchedule.scheduledAt.getTime() - now.getTime()) / (1000 * 60 * 60),
      );

      if (hoursUntil <= 6 && hoursUntil > 0) {
        advices.push({
          id: startId++,
          action: '💧 Chuẩn bị lịch tưới sắp tới',
          description: `Lịch tưới tiếp theo cho ${plantDisplayName} là trong ${hoursUntil} giờ nữa!

🛠️ Chuẩn bị:
• Kiểm tra dụng cụ: Vòi tưới, bình xịt, thùng nước
• Chất lượng nước: Để nước máy thoáng khí ít nhất 2-4 tiếng
• Nhiệt độ nước: Nước ở nhiệt độ phòng (không quá lạnh/nóng)
• Kiểm tra đất: Độ ẩm hiện tại để điều chỉnh lượng nước

${nextSchedule.amount ? `💧 Lượng nước đề xuất: ${nextSchedule.amount} lít` : ''}

${nextSchedule.notes ? `📝 Ghi chú: ${nextSchedule.notes}` : ''}

⏰ Thời điểm: ${nextSchedule.scheduledAt.toLocaleString('vi-VN')}`,
          reason: `Lịch tưới được lên kế hoạch trong ${hoursUntil} giờ - chuẩn bị trước để hiệu quả hơn.`,
          priority: 'MEDIUM',
          suggestedTime: hoursUntil <= 2 ? 'noon' : 'morning',
          category: 'WATERING',
        });
      }
    }

    // Gợi ý tạo lịch trình nếu chưa có
    if (tasks.length === 0 && schedules.length === 0) {
      advices.push({
        id: startId++,
        action: '📋 Tạo lịch trình chăm sóc',
        description: `Tôi thấy bạn chưa có lịch trình chăm sóc cho ${plantDisplayName}. Hãy tạo một kế hoạch để chăm sóc hiệu quả!

📅 Lịch trình cơ bản đề xuất:

🌅 Hàng ngày:
• Sáng: Quan sát tổng thể (5 phút)
• Chiều: Kiểm tra độ ẩm đất
• Tối: Ghi chép tình trạng cây

📅 Hàng tuần:
• Thứ 2: Kiểm tra sâu bệnh kỹ lưỡng
• Thứ 4: Tỉa lá già, cành yếu
• Thứ 6: Đánh giá tiến độ phát triển

📅 Định kỳ:
• 2 tuần: Bón phân (tùy giai đoạn)
• 1 tháng: Kiểm tra và bổ sung đất
• Theo mùa: Điều chỉnh chế độ chăm sóc

💡 Lợi ích: Lịch trình giúp không bỏ sót việc quan trọng và tối ưu hóa sự phát triển!`,
        reason:
          'Chưa có lịch trình chăm sóc - cần thiết lập để đảm bảo chăm sóc đều đặn.',
        priority: 'LOW',
        suggestedTime: 'evening',
        category: 'TASK_MANAGEMENT',
      });
    }

    return advices;
  }

  private generateSeasonalAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const plantDisplayName = context.garden.plantName;
    const { currentSeason } = analysis;
    const now = new Date();
    const month = now.getMonth() + 1;

    // Lời khuyên theo mùa
    const seasonalAdvice = this.getDetailedSeasonalAdvice(
      currentSeason,
      plantDisplayName,
      month,
    );
    if (seasonalAdvice) {
      advices.push({
        id: startId++,
        action: seasonalAdvice.action,
        description: seasonalAdvice.description,
        reason: seasonalAdvice.reason,
        priority: 'LOW',
        suggestedTime: 'morning',
        category: 'SEASONAL',
      });
    }

    // Chuẩn bị chuyển mùa
    const seasonTransition = this.getSeasonTransitionAdvice(
      month,
      plantDisplayName,
    );
    if (seasonTransition) {
      advices.push({
        id: startId++,
        action: seasonTransition.action,
        description: seasonTransition.description,
        reason: seasonTransition.reason,
        priority: 'MEDIUM',
        suggestedTime: 'morning',
        category: 'SEASONAL',
      });
    }

    return advices;
  }

  private getDetailedSeasonalAdvice(
    season: string,
    plantName: string,
    month: number,
  ) {
    const seasonAdviceMap = {
      xuân: {
        action: '🌸 Chăm sóc mùa xuân',
        description: `Mùa xuân - thời điểm vàng để ${plantName} phát triển mạnh mẽ!

🌱 Đặc điểm mùa xuân:
• Nhiệt độ dần ấm lên, thuận lợi cho sinh trưởng
• Độ ẩm cao, ít cần tưới nước
• Sâu bệnh bắt đầu hoạt động mạnh
• Thời tiết thay đổi, cần theo dõi kỹ

🎯 Công việc trọng tâm:
• Tăng cường bón phân để kích thích sinh trưởng
• Kiểm soát sâu bệnh phòng ngừa từ sớm
• Tăng ánh sáng cho cây phát triển tốt
• Chuẩn bị mùa mưa kiểm tra hệ thống thoát nước

🐛 Phòng trừ sâu bệnh xuân:
- Phun thuốc sinh học 1 tuần/lần
- Kiểm tra mặt dưới lá có trứng sâu
- Loại bỏ lá bệnh ngay khi phát hiện
- Tăng cường thông gió`,
        reason: `Mùa xuân - thời điểm lý tưởng cho ${plantName} phát triển và chuẩn bị cho cả năm.`,
      },
      hè: {
        action: '☀️ Chăm sóc mùa hè',
        description: `Mùa hè - thử thách lớn với nắng nóng và thiếu nước cho ${plantName}!

🌡️ Thách thức mùa hè:
• Nhiệt độ cao, dễ stress nhiệt
• Bay hơi nước mạnh, cần tưới nhiều
• Ánh sáng quá mạnh có thể gây cháy lá
• Sâu bệnh phát triển nhanh trong điều kiện nóng ẩm

🛡️ Chiến lược chăm sóc:
• Che nắng 50-70% từ 10h-16h
• Tưới 2 lần/ngày: sáng sớm và chiều mát
• Tăng độ ẩm bằng cách phun sương xung quanh
• Mulch để giữ ẩm và hạ nhiệt độ đất

💧 Kỹ thuật tưới mùa hè:
- Tưới sâu nhưng ít tần suất hơn
- Dùng nước đã để qua đêm (mát hơn)
- Tưới gốc, tránh làm ướt lá
- Kiểm tra độ ẩm đất 2 lần/ngày`,
        reason: `Mùa hè - cần bảo vệ ${plantName} khỏi stress nhiệt và đảm bảo cung cấp nước đầy đủ.`,
      },
      thu: {
        action: '🍂 Chăm sóc mùa thu',
        description: `Mùa thu - thời điểm thu hoạch và chuẩn bị cho mùa đông!

🍂 Đặc điểm mùa thu:
• Nhiệt độ dần giảm, thuận lợi cho một số cây
• Độ ẩm không khí tăng
• Ánh sáng giảm dần
• Thời tiết bắt đầu khô hanh

🎯 Công việc trọng tâm:
• Thu hoạch đúng lúc để đảm bảo chất lượng tốt nhất
• Giảm dần tưới nước theo nhu cầu thực tế
• Chuẩn bị cho mùa đông với các biện pháp bảo vệ
• Dọn dẹp vườn loại bỏ lá rụng, cành khô

🌾 Thu hoạch và bảo quản:
- Thu vào buổi sáng mát khi cây tươi nhất
- Sử dụng dụng cụ sạch sẽ, sắc bén
- Bảo quản đúng cách để kéo dài thời gian sử dụng
- Thu thập hạt giống cho vụ mùa tới`,
        reason: `Mùa thu - tận dụng tối đa thành quả và chuẩn bị cho ${plantName} qua mùa đông.`,
      },
      đông: {
        action: '❄️ Chăm sóc mùa đông',
        description: `Mùa đông - thời kỳ nghỉ ngơi và bảo tồn sức khỏe cho ${plantName}!

❄️ Thách thức mùa đông:
• Nhiệt độ thấp, có thể gây sốc lạnh
• Ánh sáng yếu, ảnh hưởng quang hợp
• Không khí khô do gió mùa
• Tăng trưởng chậm lại hoặc dừng hẳn

🏠 Chiến lược bảo vệ:
• Che chắn gió lạnh bằng vật liệu trong suốt
• Di chuyển vào trong nếu có thể
• Giảm tưới nước vì bay hơi chậm
• Bổ sung ánh sáng bằng đèn LED nếu cần

🌿 Chăm sóc đặc biệt:
- Tưới nước ấm (nhiệt độ phòng) vào trưa
- Kiểm tra sâu bệnh ẩn náu trong đất, gốc cây
- Tỉa bỏ phần chết, yếu để tiết kiệm năng lượng
- Chuẩn bị kế hoạch cho mùa xuân tới`,
        reason: `Mùa đông - giúp ${plantName} vượt qua thời kỳ khó khăn và chuẩn bị cho năm mới.`,
      },
    };

    return seasonAdviceMap[season];
  }

  private getSeasonTransitionAdvice(month: number, plantName: string) {
    // Chuẩn bị chuyển mùa (1 tháng trước)
    const transitionAdvice = {
      2: {
        // Chuẩn bị xuân
        action: '🌸 Chuẩn bị mùa xuân',
        description: `Còn 1 tháng nữa là mùa xuân - hãy chuẩn bị để ${plantName} bùng nổ sinh trưởng!

🛠️ Chuẩn bị cần thiết:
• Kiểm tra dụng cụ: Vòi tưới, bình xịt, dao tỉa
• Chuẩn bị phân bón: NPK cao đạm cho giai đoạn sinh trưởng
• Làm đất: Xới tơi, bổ sung compost
• Kiểm tra hạt giống: Chuẩn bị giống mới nếu cần

📋 Kế hoạch xuân:
- Lập lịch bón phân định kỳ
- Chuẩn bị biện pháp phòng trừ sâu bệnh
- Lên kế hoạch mở rộng vườn (nếu có)
- Tìm hiểu giống mới phù hợp với khí hậu`,
        reason:
          'Chuẩn bị trước 1 tháng giúp tận dụng tối đa mùa xuân cho phát triển.',
      },
      5: {
        // Chuẩn bị hè
        action: '☀️ Chuẩn bị mùa hè',
        description: `Mùa hè sắp đến - chuẩn bị hệ thống bảo vệ ${plantName} khỏi nắng nóng!

🌂 Hệ thống che chắn:
• Lưới che nắng 50-70%: Kích thước phù hợp với vườn
• Hệ thống tưới tự động: Phun sương hoặc nhỏ giọt
• Mulch: Rơm, vỏ trấu để phủ gốc
• Quạt gió: Tạo thông gió cho vườn trong nhà

💧 Chuẩn bị nước:
- Thùng chứa nước lớn để dự trữ
- Hệ thống ống dẫn nước hiệu quả
- Bình xịt phun sương làm mát
- Lên lịch tưới 2 lần/ngày`,
        reason: 'Chuẩn bị hệ thống bảo vệ trước khi nắng nóng đỉnh điểm.',
      },
      8: {
        // Chuẩn bị thu
        action: '🍂 Chuẩn bị mùa thu',
        description: `Mùa thu đang đến - thời điểm vàng để thu hoạch và lập kế hoạch!

🌾 Chuẩn bị thu hoạch:
• Dụng cụ thu hoạch: Dao, kéo sắc bén và sạch sẽ
• Phương tiện bảo quản: Túi, hộp, kho lạnh
• Kế hoạch chế biến: Cách sử dụng và bảo quản lâu dài
• Thu thập hạt giống: Chọn quả tốt nhất để lấy hạt

📋 Lập kế hoạch:
- Đánh giá thành công/thất bại của vụ mùa
- Lên kế hoạch luân canh cho vụ tới
- Chuẩn bị cải tạo đất sau thu hoạch
- Nghiên cứu giống mới phù hợp`,
        reason:
          'Chuẩn bị thu hoạch và kế hoạch dài hạn cho sự phát triển bền vững.',
      },
      11: {
        // Chuẩn bị đông
        action: '❄️ Chuẩn bị mùa đông',
        description: `Mùa đông sắp đến - bảo vệ ${plantName} an toàn qua mùa lạnh!

🏠 Biện pháp bảo vệ:
• Vật liệu che phủ: Vải không dệt, màng nhựa có lỗ
• Hệ thống sưởi ấm: Đèn sưởi, thảm sưởi (nếu cần)
• Khu vực trong nhà: Chuẩn bị chỗ di chuyển cây nhạy cảm
• Đèn LED: Bổ sung ánh sáng cho cây trong nhà

🌿 Chăm sóc cuối mùa:
- Tỉa bỏ phần yếu, bệnh để cây tập trung sức khỏe
- Giảm dần tưới nước và bón phân
- Dọn dẹp lá rụng, cành khô
- Kiểm tra và xử lý sâu bệnh ẩn náu`,
        reason:
          'Chuẩn bị bảo vệ cây trước khi thời tiết lạnh ảnh hưởng nghiêm trọng.',
      },
    };

    return transitionAdvice[month];
  }

  private generateLearningAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { gardener } = context;
    const plantDisplayName = context.garden.plantName;
    const experienceLevel = gardener.experienceLevel.level;

    // Lời khuyên học tập theo level kinh nghiệm
    if (experienceLevel <= 2) {
      advices.push({
        id: startId++,
        action: '📚 Khóa học cơ bản cho người mới',
        description: `Chào mừng bạn đến với thế giới trồng trọt! Với cấp độ "${gardener.experienceLevel.title}", đây là những kiến thức nền tảng cần thiết:

📖 Kiến thức cơ bản cần học:
• Sinh học cây trồng: Hiểu cách cây hoạt động, quang hợp, hô hấp
• Đất và dinh dưỡng: pH, NPK, vi lượng và cách sử dụng
• Nước và tưới: Nhu cầu nước, dấu hiệu thiếu/thừa nước
• Ánh sáng: Loại ánh sáng, cường độ, thời gian chiếu

🎯 Mục tiêu 30 ngày đầu:
1. Tuần 1: Học cách quan sát cây hàng ngày
2. Tuần 2: Hiểu chu kỳ tưới nước phù hợp
3. Tuần 3: Nhận biết dấu hiệu cơ bản của cây
4. Tuần 4: Thực hành bón phân đơn giản

💡 Mẹo học tập: Ghi chép hàng ngày, tham gia cộng đồng, đặt câu hỏi!`,
        reason:
          'Cấp độ mới bắt đầu - cần xây dựng nền tảng kiến thức vững chắc.',
        priority: 'MEDIUM',
        suggestedTime: 'evening',
        category: 'EDUCATION',
      });
    } else if (experienceLevel >= 3 && experienceLevel <= 5) {
      advices.push({
        id: startId++,
        action: '🧪 Nâng cao kỹ năng trung cấp',
        description: `Tuyệt vời! Bạn đã có kinh nghiệm cơ bản. Hãy nâng cao kỹ năng với ${plantDisplayName}:

🔬 Kỹ năng nâng cao:
• Chẩn đoán bệnh: Nhận biết sâu bệnh qua triệu chứng
• Dinh dưỡng chuyên sâu: Pha chế phân bón tùy chỉnh
• Kỹ thuật tỉa cành: Tạo hình, tăng năng suất
• Quản lý vi khí hậu: Điều chỉnh môi trường micro

📊 Thử nghiệm và so sánh:
- So sánh hiệu quả các loại phân bón
- Thử nghiệm kỹ thuật tưới khác nhau
- Ghi chép và phân tích dữ liệu
- Áp dụng các kỹ thuật mới từ cộng đồng

🎓 Học từ thất bại: Mỗi vấn đề là cơ hội học hỏi quý báu!`,
        reason: 'Cấp độ trung cấp - sẵn sàng học hỏi kỹ thuật phức tạp hơn.',
        priority: 'LOW',
        suggestedTime: 'evening',
        category: 'EDUCATION',
      });
    } else {
      advices.push({
        id: startId++,
        action: '🏆 Chia sẻ và hướng dẫn',
        description: `Xuất sắc! Với kinh nghiệm cấp độ "${gardener.experienceLevel.title}", bạn đã là chuyên gia!

👨‍🏫 Vai trò của bạn:
• Mentor: Hướng dẫn người mới bắt đầu
• Innovator: Thử nghiệm kỹ thuật tiên tiến
• Leader: Dẫn dắt cộng đồng trồng trọt
• Researcher: Nghiên cứu và phát triển

🌟 Đóng góp cho cộng đồng:
- Viết bài chia sẻ kinh nghiệm với ${plantDisplayName}
- Tạo video hướng dẫn kỹ thuật chuyên sâu
- Tham gia nghiên cứu về cây trồng
- Tổ chức workshop cho người mới

🔬 Thử thách mới:
- Lai tạo giống mới
- Kỹ thuật trồng thủy canh/khí canh
- Hệ thống tự động hóa hoàn toàn
- Nghiên cứu sinh học phân tử`,
        reason:
          'Cấp độ cao - thời điểm chia sẻ kiến thức và dẫn dắt cộng đồng.',
        priority: 'LOW',
        suggestedTime: 'evening',
        category: 'COMMUNITY',
      });
    }

    // Lời khuyên về tham gia cộng đồng
    advices.push({
      id: startId++,
      action: '🤝 Tham gia cộng đồng làm vườn',
      description: `Cộng đồng là nguồn kiến thức vô tận cho việc trồng ${plantDisplayName}!

🌐 Kênh học hỏi trực tuyến:
• Diễn đàn: Tham gia thảo luận, đặt câu hỏi
• YouTube: Theo dõi các kênh chuyên về trồng trọt
• Facebook Groups: Chia sẻ hình ảnh, nhận phản hồi
• Apps: Sử dụng ứng dụng nhận diện bệnh cây

🏘️ Cộng đồng địa phương:
- Tham gia câu lạc bộ làm vườn
- Trao đổđổi hạt giống với hàng xóm
- Tham quan vườn mẫu trong khu vực
- Tham gia hội chợ nông sản địa phương

📚 Nguồn học liệu đáng tin cậy:
- Sách chuyên ngành từ nhà xuất bản uy tín
- Khóa học online có chứng chỉ
- Hội thảo, workshop do chuyên gia tổ chức
- Trạm khuyến nông địa phương

💡 Lưu ý: Luôn kiểm chứng thông tin từ nhiều nguồn khác nhau!`,
      reason: 'Cộng đồng cung cấp kinh nghiệm thực tế và hỗ trợ kịp thời.',
      priority: 'LOW',
      suggestedTime: 'evening',
      category: 'COMMUNITY',
    });

    return advices;
  }

  private generateLongTermAdvice(
    context: AdviceContext,
    analysis: any,
    startId: number,
  ): AdviceActionDto[] {
    const advices: AdviceActionDto[] = [];
    const { garden, plant } = context;
    const plantDisplayName = garden.plantName;
    const { daysSincePlanting } = analysis;

    // Kế hoạch dài hạn cho chu kỳ trồng
    if (plant.growthDuration && daysSincePlanting > 0) {
      const completionPercent = Math.min(
        (daysSincePlanting / plant.growthDuration) * 100,
        100,
      );
      const daysRemaining = Math.max(
        plant.growthDuration - daysSincePlanting,
        0,
      );

      if (completionPercent > 60) {
        advices.push({
          id: startId++,
          action: '📅 Lập kế hoạch chu kỳ tiếp theo',
          description: `Chu kỳ trồng ${plantDisplayName} đã hoàn thành ${Math.round(completionPercent)}% (còn ${daysRemaining} ngày). Đã đến lúc lập kế hoạch cho tương lai!

🔄 Chiến lược luân canh:
• Không trồng lại ${plantDisplayName} ngay lập tức ở cùng vị trí
• Cây họ đậu: Đậu, đỗ để bổ sung đạm tự nhiên cho đất
• Cây lá xanh: Rau cải, xà lách để nghỉ đất
• Cây cải tạo đất: Cỏ linh lăng, lúa mạch để cải thiện cấu trúc

🌱 Lựa chọn cây trồng tiếp theo:
${this.getRotationSuggestions(garden.plantName)}

📋 Chuẩn bị trước:
- Thu thập hạt giống chất lượng cao
- Cải tạo đất với phân compost
- Vệ sinh dụng cụ và khu vực trồng
- Lên lịch thời gian gieo trồng phù hợp

⏰ Timeline đề xuất: Bắt đầu chuẩn bị 2-3 tuần trước khi thu hoạch xong.`,
          reason: `Chu kỳ ${plantDisplayName} sắp hoàn thành - cần kế hoạch cho tương lai.`,
          priority: 'MEDIUM',
          suggestedTime: 'evening',
          category: 'PLANNING',
        });
      }
    }

    // Lời khuyên về cải thiện vườn dài hạn
    advices.push({
      id: startId++,
      action: '🏗️ Nâng cấp hệ thống vườn',
      description: `Hãy đầu tư cải thiện vườn ${garden.name} để chăm sóc ${plantDisplayName} hiệu quả hơn!

🔧 Nâng cấp cơ sở hạ tầng:
• Hệ thống tưới tự động: Timer, cảm biến độ ẩm
• Monitoring thông minh: Cảm biến nhiệt độ, pH, EC
• Che chắn thông minh: Lưới cuốn tự động theo thời tiết
• Chiếu sáng LED: Đèn grow light với timer

💰 Đầu tư theo giai đoạn:
Giai đoạn 1 (0-6 tháng):
- Hệ thống tưới nhỏ giọt cơ bản
- Cảm biến độ ẩm đất đơn giản
- Lưới che nắng cố định

Giai đoạn 2 (6-12 tháng):
- Timer tưới tự động
- Cảm biến nhiệt độ/độ ẩm không khí
- Hệ thống thông gió

Giai đoạn 3 (1-2 năm):
- Hệ thống IoT hoàn chỉnh
- App điều khiển từ xa
- AI phân tích và đưa ra lời khuyên

📊 ROI dự kiến: Tiết kiệm 40-60% thời gian chăm sóc, tăng 30-50% năng suất!`,
      reason:
        'Đầu tư dài hạn giúp tối ưu hóa hiệu quả trồng trọt và tiết kiệm thời gian.',
      priority: 'LOW',
      suggestedTime: 'evening',
      category: 'IMPROVEMENT',
    });

    // Mục tiêu và thành tựu
    const achievementAdvice = this.generateAchievementAdvice(
      context,
      startId++,
    );
    if (achievementAdvice) {
      advices.push(achievementAdvice);
    }

    return advices;
  }

  private generateAchievementAdvice(
    context: AdviceContext,
    id: number,
  ): AdviceActionDto | null {
    const { gardener, activities } = context;
    const plantDisplayName = context.garden.plantName;
    const experiencePoints = gardener.experiencePoints;
    const activitiesCount = activities.length;

    // Tính toán thành tựu hiện tại
    const achievements: string[] = [];

    if (experiencePoints >= 1000) achievements.push('🏆 Chuyên gia 1000 XP');
    if (activitiesCount >= 50) achievements.push('📈 50+ hoạt động');
    if (context.garden.plantStartDate) {
      const days = Math.floor(
        (new Date().getTime() - context.garden.plantStartDate.getTime()) /
          (1000 * 60 * 60 * 24),
      );
      if (days >= 100) achievements.push('⏰ 100+ ngày chăm sóc');
    }

    // Mục tiêu tiếp theo
    const nextGoals: string[] = [];
    const nextLevelXP = (gardener.experienceLevel.level + 1) * 200; // Giả định mỗi level cần 200 XP
    const xpNeeded = nextLevelXP - experiencePoints;

    if (xpNeeded > 0 && xpNeeded <= 500) {
      nextGoals.push(
        `🎯 Còn ${xpNeeded} XP để lên cấp độ ${gardener.experienceLevel.level + 1}`,
      );
    }

    if (activitiesCount < 100) {
      nextGoals.push(
        `📊 Còn ${100 - activitiesCount} hoạt động để đạt mốc 100 hoạt động`,
      );
    }

    if (achievements.length === 0 && nextGoals.length === 0) return null;

    return {
      id,
      action: '🏅 Thành tựu và mục tiêu',
      description: `Hãy cùng nhìn lại những thành tựu và đặt mục tiêu mới cho việc trồng ${plantDisplayName}!

${
  achievements.length > 0
    ? `🎉 Thành tựu hiện tại:
${achievements.map((a) => `• ${a}`).join('\n')}

`
    : ''
}${
        nextGoals.length > 0
          ? `🎯 Mục tiêu sắp tới:
${nextGoals.map((g) => `• ${g}`).join('\n')}

`
          : ''
      }🌟 Cách tích lũy XP nhanh:
• Ghi nhật ký đầy đủ: +5 XP/hoạt động
• Chụp ảnh tiến độ: +10 XP/ảnh chất lượng
• Chia sẻ kinh nghiệm: +20 XP/bài viết
• Giúp đỡ người mới: +50 XP/lần mentor

💪 Thử thách bản thân:
- Thử nghiệm kỹ thuật mới
- Trồng giống khó hơn
- Đạt năng suất cao hơn
- Chia sẻ kiến thức với cộng đồng

🎊 Phần thưởng cho bản thân: Mỗi mục tiêu đạt được, hãy thưởng cho mình một điều gì đó đặc biệt!`,
      reason:
        'Theo dõi tiến độ và đặt mục tiêu giúp duy trì động lực trồng trọt.',
      priority: 'LOW',
      suggestedTime: 'evening',
      category: 'ACHIEVEMENT',
    };
  }

  private getGardenTypeDisplay(type: string): string {
    const typeMapping = {
      INDOOR: 'Trong nhà',
      OUTDOOR: 'Ngoài trời',
      BALCONY: 'Ban công',
      ROOFTOP: 'Sân thượng',
      WINDOW_SILL: 'Bệ cửa sổ',
    };
    return typeMapping[type] || type;
  }

  private getTimeGreeting(hour: number): string {
    if (hour < 6) return 'Chào bạn';
    if (hour < 12) return 'Chào buổi sáng';
    if (hour < 18) return 'Chào buổi chiều';
    if (hour < 22) return 'Chào buổi tối';
    return 'Chào bạn';
  }

  private getCurrentSeason(): string {
    const month = new Date().getMonth() + 1;
    if (month >= 3 && month <= 5) return 'xuân';
    if (month >= 6 && month <= 8) return 'hè';
    if (month >= 9 && month <= 11) return 'thu';
    return 'đông';
  }

  private getTimeOfDay(hour: number): 'morning' | 'noon' | 'evening' {
    if (hour < 12) return 'morning';
    if (hour < 18) return 'noon';
    return 'evening';
  }

  private analyzeWeatherTrend(forecasts: ForecastData): string {
    if (forecasts.daily.length < 3) return 'stable';

    const temps = forecasts.daily.slice(0, 3).map((f) => f.tempDay);
    const avgFirst = temps[0];
    const avgLast = temps[temps.length - 1];

    if (avgLast > avgFirst + 3) return 'warming';
    if (avgLast < avgFirst - 3) return 'cooling';
    return 'stable';
  }

  private assessGrowthProgress(
    days: number,
    growthStage: any,
    activities: any[],
  ): any {
    const expectedDuration = growthStage.duration || 30;
    const progressPercent = (days / expectedDuration) * 100;

    // Đánh giá hoạt động chăm sóc
    const recentActivities = activities.filter((a) => {
      const daysSince = Math.floor(
        (new Date().getTime() - a.timestamp.getTime()) / (1000 * 60 * 60 * 24),
      );
      return daysSince <= 7;
    });

    return {
      progressPercent: Math.min(progressPercent, 100),
      isOnTrack: progressPercent <= 120, // Cho phép trễ 20%
      careFrequency: recentActivities.length,
      careQuality: recentActivities.filter((a) => a.evaluations?.length > 0)
        .length,
    };
  }

  private assessRisks(context: AdviceContext): any {
    const risks: RiskItem[] = [];
    const { sensorData, alerts, weatherData } = context;

    // Rủi ro từ cảm biến
    Object.entries(sensorData).forEach(([type, reading]) => {
      if (reading.status === 'critical') {
        risks.push({
          type: 'sensor',
          severity: 'high', // 'critical' sensor status maps to 'high' risk
          source: type,
          description: `${type} ở mức nguy hiểm: ${reading.value}`,
        });
      }
      // Add other sensor statuses if they constitute a risk
      // e.g., if reading.status === 'warning'
      else if (reading.status === 'warning') {
        risks.push({
          type: 'sensor',
          severity: 'medium', // 'warning' sensor status maps to 'medium' risk
          source: type,
          description: `${type} ở mức cảnh báo: ${reading.value}`,
        });
      }
    });

    // Rủi ro từ thời tiết
    if (weatherData) {
      if (weatherData.temp > 40) {
        risks.push({
          type: 'weather',
          severity: 'high',
          source: 'temperature',
          description: `Nhiệt độ cực cao: ${weatherData.temp}°C`,
        });
      }
      if (weatherData.windSpeed > 20) {
        risks.push({
          type: 'weather',
          severity: 'medium',
          source: 'wind',
          description: `Gió mạnh: ${weatherData.windSpeed} m/s`,
        });
      }
      // Add other weather conditions if they constitute a risk
    }

    // Rủi ro từ alerts
    alerts.forEach((alert) => {
      let riskSeverity: 'high' | 'medium' | 'low';
      switch (alert.severity.toUpperCase()) {
        case 'CRITICAL':
          riskSeverity = 'high';
          break;
        case 'HIGH':
          riskSeverity = 'high';
          break;
        case 'MEDIUM':
          riskSeverity = 'medium';
          break;
        case 'LOW':
          riskSeverity = 'low';
          break;
        default:
          // Default to 'low' or handle unknown severities as needed
          // This case should ideally not be hit if AlertSeverity is a well-defined enum
          this.logger.warn(`Unknown alert severity: ${alert.severity}`);
          riskSeverity = 'low';
      }
      risks.push({
        type: 'alert',
        severity: riskSeverity,
        source: alert.type,
        description: alert.message,
      });
    });

    return {
      totalRisks: risks.length,
      highSeverity: risks.filter((r) => r.severity === 'high').length,
      risks,
    };
  }

  private evaluateCareEffectiveness(context: AdviceContext): any {
    const { evaluations, activities } = context;

    if (evaluations.length === 0) {
      return {
        score: null,
        trend: 'unknown',
        recommendations: ['Bắt đầu đánh giá hiệu quả chăm sóc'],
      };
    }

    const recentEvaluations = evaluations.slice(0, 5);
    const avgRating =
      recentEvaluations.reduce((sum, e) => sum + (e.rating || 3), 0) /
      recentEvaluations.length;

    const recommendations: string[] = [];
    if (avgRating < 3) {
      recommendations.push('Cần cải thiện phương pháp chăm sóc');
    }
    if (activities.length < 10) {
      recommendations.push('Tăng tần suất hoạt động chăm sóc');
    }

    return {
      score: avgRating,
      trend:
        avgRating >= 3.5
          ? 'improving'
          : avgRating >= 2.5
            ? 'stable'
            : 'declining',
      recommendations,
    };
  }

  private getSuggestedTimeForAction(
    category: string,
  ): 'morning' | 'noon' | 'evening' {
    const timeMapping = {
      WATERING: 'morning',
      FERTILIZING: 'evening',
      MONITORING: 'morning',
      TEMPERATURE: 'noon',
      LIGHT: 'morning',
      HUMIDITY: 'noon',
      EMERGENCY: 'noon',
      EDUCATION: 'evening',
      PLANNING: 'evening',
    };

    return timeMapping[category] || 'morning';
  }

  private getEnvironmentalRecommendation(
    sensorType: string,
    reading: SensorReading,
    optimalRange: number[],
  ): string {
    const [min, max] = optimalRange;
    const { value, status } = reading;

    if (status === 'normal') return 'Điều kiện tốt';

    const actionMap = {
      soil_moisture: value < min ? 'Cần tưới nước' : 'Giảm tưới nước',
      temperature: value < min ? 'Cần giữ ấm' : 'Cần làm mát',
      humidity: value < min ? 'Tăng độ ẩm' : 'Giảm độ ẩm',
      light: value < min ? 'Tăng ánh sáng' : 'Che nắng',
      soil_ph: value < min ? 'Tăng pH (giảm acid)' : 'Giảm pH (tăng acid)',
    };

    return actionMap[sensorType] || 'Cần điều chỉnh';
  }

  private personalizeAdvice(
    advices: AdviceActionDto[],
    context: AdviceContext,
  ): AdviceActionDto[] {
    const { gardener } = context;
    const experienceLevel = gardener.experienceLevel.level;

    return advices.map((advice) => {
      // Điều chỉnh độ chi tiết theo kinh nghiệm
      if (experienceLevel <= 2) {
        // Người mới: thêm giải thích cơ bản
        if (!advice.description.includes('💡 Giải thích:')) {
          advice.description +=
            '\n\n💡 Giải thích: ' + this.getBasicExplanation(advice.category);
        }
      } else if (experienceLevel >= 5) {
        // Người có kinh nghiệm: thêm tips nâng cao
        if (!advice.description.includes('🔬 Tips chuyên sâu:')) {
          advice.description +=
            '\n\n🔬 Tips chuyên sâu: ' + this.getAdvancedTips(advice.category);
        }
      }

      return advice;
    });
  }

  private getBasicExplanation(category: string): string {
    const explanations = {
      WATERING:
        'Cây cần nước để vận chuyển dinh dưỡng và duy trì sự sống. Quá ít sẽ héo, quá nhiều sẽ thối rễ.',
      FERTILIZING:
        'Phân bón cung cấp dinh dưỡng giúp cây phát triển. NPK là 3 chất chính: Đạm (N) cho lá, Lân (P) cho rễ và hoa, Kali (K) cho quả.',
      TEMPERATURE:
        'Nhiệt độ ảnh hưởng đến tốc độ sinh trưởng. Quá lạnh cây ngủ đông, quá nóng cây stress và có thể chết.',
      LIGHT:
        'Ánh sáng cần thiết cho quang hợp - quá trình tạo thức ăn của cây. Thiếu sáng cây yếu, thừa sáng cây cháy.',
      HUMIDITY:
        'Độ ẩm không khí ảnh hưởng đến quá trình thoát hơi nước qua lá. Cây nhiệt đới thích độ ẩm cao.',
    };

    return (
      explanations[category] ||
      'Đây là yếu tố quan trọng cho sự phát triển của cây.'
    );
  }

  private getAdvancedTips(category: string): string {
    const tips = {
      WATERING:
        'Sử dụng cảm biến EC để đo độ mặn của nước. Tưới theo chu kỳ wet-dry để kích thích rễ phát triển sâu.',
      FERTILIZING:
        'Kết hợp phân hữu cơ và vô cơ với tỷ lệ 70:30. Sử dụng amino acid làm chất chelate để tăng hấp thu.',
      TEMPERATURE:
        'Áp dụng kỹ thuật DIF (Day-night temperature difference) để điều chỉnh chiều cao cây.',
      LIGHT:
        'Sử dụng đèn LED full spectrum với DLI (Daily Light Integral) phù hợp cho từng giai đoạn.',
      HUMIDITY:
        'Tạo gradient độ ẩm trong vườn để tối ưu hóa vi khí hậu cho từng loại cây.',
    };

    return (
      tips[category] ||
      'Nghiên cứu thêm về sinh lý cây trồng để áp dụng kỹ thuật chuyên sâu.'
    );
  }

  private prioritizeAndFormat(
    advices: AdviceActionDto[],
    context: AdviceContext,
  ): AdviceActionDto[] {
    // Gộp nhóm theo action tương tự
    const grouped = this.groupSimilarAdvices(advices);

    // Sắp xếp theo priority và category
    const prioritized = this.sortByPriorityAndRelevance(grouped, context);

    // Giới hạn số lượng để không overwhelm user
    const limited = this.limitAdviceCount(prioritized);

    // Format cuối cùng
    return this.finalFormatting(limited);
  }

  private groupSimilarAdvices(advices: AdviceActionDto[]): AdviceActionDto[] {
    const grouped = new Map<string, AdviceActionDto>();

    advices.forEach((advice) => {
      const key = `${advice.category}_${advice.action.substring(0, 20)}`;

      if (grouped.has(key)) {
        const existing = grouped.get(key)!;
        // Gộp nội dung
        existing.description = this.mergeAdviceContent(
          existing.description,
          advice.description,
        );
        existing.reason += '; ' + advice.reason;

        // Chọn priority cao hơn
        const priorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL'];
        if (
          priorities.indexOf(advice.priority) >
          priorities.indexOf(existing.priority)
        ) {
          existing.priority = advice.priority;
        }
      } else {
        grouped.set(key, { ...advice });
      }
    });

    return Array.from(grouped.values());
  }

  private mergeAdviceContent(content1: string, content2: string): string {
    // Tránh trùng lặp nội dung
    const lines1 = content1.split('\n');
    const lines2 = content2.split('\n');

    // Giữ nội dung chi tiết hơn
    return content1.length > content2.length ? content1 : content2;
  }

  private sortByPriorityAndRelevance(
    advices: AdviceActionDto[],
    context: AdviceContext,
  ): AdviceActionDto[] {
    const priorityWeights = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
    const timeOfDay = this.getTimeOfDay(new Date().getHours());

    return advices.sort((a, b) => {
      // Priority trước
      const priorityDiff =
        priorityWeights[b.priority] - priorityWeights[a.priority];
      if (priorityDiff !== 0) return priorityDiff;

      // Thời gian phù hợp
      const aTimeRelevant = a.suggestedTime === timeOfDay ? 1 : 0;
      const bTimeRelevant = b.suggestedTime === timeOfDay ? 1 : 0;
      const timeDiff = bTimeRelevant - aTimeRelevant;
      if (timeDiff !== 0) return timeDiff;

      // Category quan trọng
      const categoryWeights = {
        EMERGENCY: 10,
        WATERING: 9,
        TEMPERATURE: 8,
        FERTILIZING: 7,
        GROWTH_STAGE: 6,
        WEATHER_FORECAST: 5,
        TASK_MANAGEMENT: 4,
        MONITORING: 3,
        SEASONAL: 2,
        EDUCATION: 1,
      };

      return (
        (categoryWeights[b.category] || 0) - (categoryWeights[a.category] || 0)
      );
    });
  }

  private limitAdviceCount(advices: AdviceActionDto[]): AdviceActionDto[] {
    // Giới hạn số lượng theo priority
    const high = advices.filter((a) => a.priority === 'HIGH').slice(0, 3);
    const medium = advices.filter((a) => a.priority === 'MEDIUM').slice(0, 5);
    const low = advices.filter((a) => a.priority === 'LOW').slice(0, 3);

    return [...high, ...medium, ...low];
  }

  private finalFormatting(advices: AdviceActionDto[]): AdviceActionDto[] {
    return advices.map((advice, index) => ({
      ...advice,
      id: index + 1,
      // Thêm timestamp cho tracking
      timestamp: new Date().toISOString(),
      // Thêm metadata
      metadata: {
        generatedAt: new Date().toISOString(),
        version: '2.0',
        aiAssistant: 'GardenAI Premium',
      },
    }));
  }

  // Method to be added
  private getRotationSuggestions(currentPlantName: string): string {
    const safePlantName = currentPlantName.toLowerCase();
    const suggestions: Record<string, string> = {
      'cà chua':
        '• Cây họ đậu (đỗ, lạc) để cải tạo đất\n• Rau cải, xà lách cho vụ sau',
      ớt: '• Trồng dưa chuột hoặc bí để thay đổi họ cây\n• Cây gia vị khác như húng quế',
      'dưa chuột': '• Trồng cà chua hoặc ớt (khác họ)\n• Các loại rau ăn lá',
      'xà lách': '• Cây lấy củ như cà rốt, củ cải\n• Trồng các loại đậu',
      'húng quế':
        '• Trồng các loại rau ăn lá khác họ\n• Cây cải tạo đất như đậu',
      'bạc hà':
        '• Xoay vòng với các loại rau ăn lá hoặc cây gia vị khác\n• Tránh trồng lại liên tục trên cùng một đất',
      // Add more plants and their rotation suggestions
    };
    const suggestion = suggestions[safePlantName];
    if (suggestion) {
      return suggestion;
    }
    return '• Luân canh với cây khác họ để tránh sâu bệnh và làm giàu đất.\n• Tham khảo ý kiến chuyên gia hoặc cộng đồng để có lựa chọn tốt nhất cho loại cây của bạn.';
  }
}
