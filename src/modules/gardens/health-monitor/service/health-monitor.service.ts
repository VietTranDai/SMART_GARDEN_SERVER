import { Injectable, Logger } from '@nestjs/common';
import { 
  AlertType, 
  AlertStatus, 
  Severity, 
  SensorType,
  ActivityType,
  WeatherMain 
} from '@prisma/client';
import { PrismaService } from 'src/prisma/prisma.service';

interface GardenHealthReport {
  gardenId: number;
  overallHealth: 'EXCELLENT' | 'GOOD' | 'WARNING' | 'CRITICAL';
  score: number; // 0-100
  issues: HealthIssue[];
  recommendations: string[];
  alerts: AlertData[];
}

interface HealthIssue {
  type: 'SENSOR' | 'WEATHER' | 'PLANT' | 'MAINTENANCE';
  severity: Severity;
  message: string;
  recommendation: string;
}

interface AlertData {
  type: AlertType;
  message: string;
  suggestion: string;
  severity: Severity;
}

@Injectable()
export class HealthMonitorService {
  private readonly logger = new Logger(HealthMonitorService.name);

  constructor(private prisma: PrismaService) {}

  async checkGardenHealth(gardenId: number, userId: number): Promise<GardenHealthReport> {
    try {
      // Lấy thông tin chi tiết về vườn
      const garden = await this.getGardenDetails(gardenId);
      if (!garden) {
        throw new Error(`Không tìm thấy vườn với ID: ${gardenId}`);
      }

      const report: GardenHealthReport = {
        gardenId,
        overallHealth: 'GOOD',
        score: 100,
        issues: [],
        recommendations: [],
        alerts: []
      };

      // Kiểm tra các yếu tố sức khỏe vườn
      await this.checkSensorHealth(garden, report);
      await this.checkWeatherConditions(garden, report);
      await this.checkPlantConditions(garden, report);
      await this.checkMaintenanceNeeds(garden, report);
      await this.checkWateringSchedule(garden, report);

      // Tính toán điểm tổng thể và đánh giá
      this.calculateOverallHealth(report);

      // Tạo các alert cần thiết
      await this.createAlertsIfNeeded(garden, report, userId);

      this.logger.log(`Đã kiểm tra sức khỏe vườn ${garden.name} - Điểm: ${report.score}/100`);
      
      return report;
    } catch (error) {
      this.logger.error(`Lỗi khi kiểm tra sức khỏe vườn ${gardenId}:`, error);
      throw error;
    }
  }

  private async getGardenDetails(gardenId: number) {
    return await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: {
        sensors: {
          include: {
            sensorData: {
              take: 10,
              orderBy: { timestamp: 'desc' }
            }
          }
        },
        weatherData: {
          take: 1,
          orderBy: { observedAt: 'desc' }
        },
        dailyForecast: {
          take: 3,
          orderBy: { forecastFor: 'asc' },
          where: {
            forecastFor: {
              gte: new Date()
            }
          }
        },
        activities: {
          take: 10,
          orderBy: { timestamp: 'desc' }
        },
        wateringSchedule: {
          where: {
            scheduledAt: {
              gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) // 7 ngày qua
            }
          },
          orderBy: { scheduledAt: 'desc' }
        },
        photos: {
          take: 5,
          orderBy: { createdAt: 'desc' }
        }
      }
    });
  }

  private async checkSensorHealth(garden: any, report: GardenHealthReport) {
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    
    for (const sensor of garden.sensors) {
      const latestData = sensor.sensorData[0];
      
      // Kiểm tra sensor có hoạt động không
      if (!latestData || latestData.timestamp < oneHourAgo) {
        const issue: HealthIssue = {
          type: 'SENSOR',
          severity: 'HIGH',
          message: `Cảm biến ${this.getSensorTypeName(sensor.type)} đã ngừng gửi dữ liệu từ ${latestData ? this.formatTimeAgo(latestData.timestamp) : 'rất lâu'}.`,
          recommendation: 'Vui lòng kiểm tra kết nối và pin của cảm biến. Có thể cần thay pin hoặc khởi động lại thiết bị.'
        };
        report.issues.push(issue);
        report.score -= 15;

        report.alerts.push({
          type: AlertType.SENSOR_ERROR,
          message: `⚠️ Cảm biến ${this.getSensorTypeName(sensor.type)} không phản hồi`,
          suggestion: issue.recommendation,
          severity: 'HIGH'
        });
        continue;
      }

      // Kiểm tra giá trị sensor có bất thường không
      await this.checkSensorValues(sensor, latestData, report);
    }
  }

  private async checkSensorValues(sensor: any, latestData: any, report: GardenHealthReport) {
    const value = latestData.value;
    
    switch (sensor.type) {
      case SensorType.SOIL_MOISTURE:
        if (value < 30) {
          report.issues.push({
            type: 'PLANT',
            severity: 'MEDIUM',
            message: `Độ ẩm đất thấp (${value.toFixed(1)}%). Cây có thể đang thiếu nước.`,
            recommendation: 'Tưới nước ngay lập tức và kiểm tra lịch tưới. Xem xét tăng tần suất tưới trong thời tiết nóng.'
          });
          report.score -= 10;
          
          report.alerts.push({
            type: AlertType.PLANT_CONDITION,
            message: `🌱 Đất khô - Độ ẩm chỉ còn ${value.toFixed(1)}%`,
            suggestion: 'Tưới nước ngay để cây không bị héo. Kiểm tra hệ thống tưới tự động nếu có.',
            severity: 'MEDIUM'
          });
        } else if (value > 80) {
          report.issues.push({
            type: 'PLANT',
            severity: 'MEDIUM',
            message: `Độ ẩm đất cao (${value.toFixed(1)}%). Có thể tưới quá nhiều nước.`,
            recommendation: 'Giảm lượng nước tưới và kiểm tra hệ thống thoát nước. Đất quá ẩm có thể gây thối rễ.'
          });
          report.score -= 8;
          
          report.alerts.push({
            type: AlertType.PLANT_CONDITION,
            message: `💧 Đất quá ẩm - Độ ẩm ${value.toFixed(1)}%`,
            suggestion: 'Tạm dừng tưới nước và cải thiện thoát nước. Theo dõi dấu hiệu thối rễ.',
            severity: 'MEDIUM'
          });
        }
        break;

      case SensorType.TEMPERATURE:
        if (value > 35) {
          report.issues.push({
            type: 'WEATHER',
            severity: 'MEDIUM',
            message: `Nhiệt độ cao (${value.toFixed(1)}°C). Cây có thể bị stress nhiệt.`,
            recommendation: 'Tăng tưới nước, che bóng mát và thoáng khí. Tránh tưới vào giữa trưa.'
          });
          report.score -= 8;
        } else if (value < 15) {
          report.issues.push({
            type: 'WEATHER',
            severity: 'MEDIUM',
            message: `Nhiệt độ thấp (${value.toFixed(1)}°C). Cây có thể bị stress lạnh.`,
            recommendation: 'Che chắn gió, giữ ấm cho cây. Giảm tưới nước trong thời tiết lạnh.'
          });
          report.score -= 8;
        }
        break;

      case SensorType.HUMIDITY:
        if (value < 40) {
          report.issues.push({
            type: 'WEATHER',
            severity: 'LOW',
            message: `Độ ẩm không khí thấp (${value.toFixed(1)}%). Có thể ảnh hưởng đến sự phát triển.`,
            recommendation: 'Xịt sương nhẹ xung quanh cây hoặc đặt chậu nước gần để tăng độ ẩm.'
          });
          report.score -= 5;
        }
        break;

      case SensorType.LIGHT:
        if (value < 1000) {
          report.issues.push({
            type: 'PLANT',
            severity: 'LOW',
            message: `Ánh sáng yếu (${value.toFixed(0)} lux). Cây có thể không đủ ánh sáng để quang hợp.`,
            recommendation: 'Di chuyển cây đến nơi có nhiều ánh sáng hơn hoặc sử dụng đèn LED trồng cây.'
          });
          report.score -= 6;
        }
        break;
    }
  }

  private async checkWeatherConditions(garden: any, report: GardenHealthReport) {
    const currentWeather = garden.weatherData[0];
    const forecasts = garden.dailyForecast;

    if (currentWeather) {
      // Kiểm tra thời tiết hiện tại
      if (currentWeather.weatherMain === WeatherMain.RAIN && currentWeather.rain1h > 10) {
        report.issues.push({
          type: 'WEATHER',
          severity: 'LOW',
          message: `Đang mưa to (${currentWeather.rain1h}mm/h). Cây có thể bị ngập úng.`,
          recommendation: 'Kiểm tra hệ thống thoát nước và tạm dừng tưới nước tự động nếu có.'
        });
        report.score -= 3;
      }

      if (currentWeather.windSpeed > 10) {
        report.issues.push({
          type: 'WEATHER',
          severity: 'MEDIUM',
          message: `Gió mạnh (${currentWeather.windSpeed.toFixed(1)} m/s). Cây có thể bị gãy cành.`,
          recommendation: 'Gia cường cột chống và che chắn cho cây. Kiểm tra sau khi gió tạnh.'
        });
        report.score -= 7;
      }
    }

    // Kiểm tra dự báo thời tiết
    if (forecasts.length > 0) {
      const tomorrow = forecasts[0];
      if (tomorrow.tempMax > 38) {
        report.alerts.push({
          type: AlertType.WEATHER,
          message: `🌡️ Ngày mai sẽ rất nóng (${tomorrow.tempMax.toFixed(1)}°C)`,
          suggestion: 'Chuẩn bị tưới nước nhiều hơn và che nắng cho cây từ sáng sớm.',
          severity: 'MEDIUM'
        });
      }

      if (tomorrow.rain > 20) {
        report.alerts.push({
          type: AlertType.WEATHER,
          message: `🌧️ Ngày mai có mưa to (${tomorrow.rain.toFixed(1)}mm)`,
          suggestion: 'Kiểm tra hệ thống thoát nước và tạm dừng tưới nước tự động.',
          severity: 'LOW'
        });
      }
    }
  }

  private async checkPlantConditions(garden: any, report: GardenHealthReport) {
    if (!garden.plantName || !garden.plantGrowStage) {
      report.recommendations.push('💡 Cập nhật thông tin loại cây và giai đoạn phát triển để nhận được lời khuyên chăm sóc tốt hơn.');
      return;
    }

    // Kiểm tra thời gian trồng
    if (garden.plantStartDate) {
      const daysSincePlanting = Math.floor((Date.now() - garden.plantStartDate.getTime()) / (1000 * 60 * 60 * 24));
      
      if (garden.plantDuration && daysSincePlanting > garden.plantDuration) {
        report.alerts.push({
          type: AlertType.PLANT_CONDITION,
          message: `🌿 Cây đã trưởng thành sau ${daysSincePlanting} ngày`,
          suggestion: 'Đã đến lúc thu hoạch hoặc chuẩn bị chu kỳ trồng mới.',
          severity: 'LOW'
        });
      }
    }

    // Kiểm tra hoạt động chăm sóc gần đây
    const recentActivities = garden.activities.slice(0, 5);
    const lastWatering = recentActivities.find(a => a.activityType === ActivityType.WATERING);
    
    if (!lastWatering || this.daysSince(lastWatering.timestamp) > 3) {
      report.issues.push({
        type: 'MAINTENANCE',
        severity: 'MEDIUM',
        message: `Chưa tưới nước từ ${lastWatering ? this.formatTimeAgo(lastWatering.timestamp) : 'rất lâu'}.`,
        recommendation: 'Kiểm tra độ ẩm đất và tưới nước nếu cần thiết. Đặt nhắc nhở tưới nước định kỳ.'
      });
      report.score -= 12;
    }
  }

  private async checkMaintenanceNeeds(garden: any, report: GardenHealthReport) {
    const recentActivities = garden.activities.slice(0, 10);
    const now = new Date();

    // Kiểm tra bón phân
    const lastFertilizing = recentActivities.find(a => a.activityType === ActivityType.FERTILIZING);
    if (!lastFertilizing || this.daysSince(lastFertilizing.timestamp) > 30) {
      report.recommendations.push(`🌿 Đã ${lastFertilizing ? this.daysSince(lastFertilizing.timestamp) : 'rất nhiều'} ngày chưa bón phân. Cân nhắc bón phân để cây phát triển tốt hơn.`);
    }

    // Kiểm tra tỉa cành
    const lastPruning = recentActivities.find(a => a.activityType === ActivityType.PRUNING);
    if (!lastPruning || this.daysSince(lastPruning.timestamp) > 45) {
      report.recommendations.push(`✂️ Cân nhắc tỉa cành để cây phát triển đều và thoáng khí.`);
    }

    // Kiểm tra kiểm soát sâu bệnh
    const lastPestControl = recentActivities.find(a => a.activityType === ActivityType.PEST_CONTROL);
    if (!lastPestControl || this.daysSince(lastPestControl.timestamp) > 60) {
      report.recommendations.push(`🐛 Thường xuyên kiểm tra sâu bệnh và phun thuốc phòng trừ nếu cần.`);
    }
  }

  private async checkWateringSchedule(garden: any, report: GardenHealthReport) {
    const upcomingWatering = garden.wateringSchedule.filter(w => 
      w.status === 'PENDING' && w.scheduledAt > new Date()
    );

    const overdueWatering = garden.wateringSchedule.filter(w => 
      w.status === 'PENDING' && w.scheduledAt < new Date()
    );

    if (overdueWatering.length > 0) {
      report.issues.push({
        type: 'MAINTENANCE',
        severity: 'MEDIUM',
        message: `Có ${overdueWatering.length} lịch tưới đã quá hạn.`,
        recommendation: 'Tưới nước ngay lập tức và cập nhật trạng thái lịch tưới.'
      });
      report.score -= 10;

      report.alerts.push({
        type: AlertType.ACTIVITY,
        message: `⏰ Quên tưới nước - ${overdueWatering.length} lịch tưới quá hạn`,
        suggestion: 'Tưới nước ngay và đặt nhắc nhở để không quên lần sau.',
        severity: 'MEDIUM'
      });
    }

    if (upcomingWatering.length > 0) {
      const nextWatering = upcomingWatering[0];
      const hoursUntil = Math.ceil((nextWatering.scheduledAt.getTime() - Date.now()) / (1000 * 60 * 60));
      
      if (hoursUntil <= 2) {
        report.alerts.push({
          type: AlertType.MAINTENANCE,
          message: `💧 Sắp đến giờ tưới nước (${hoursUntil}h nữa)`,
          suggestion: 'Chuẩn bị dụng cụ tưới và kiểm tra lượng nước cần thiết.',
          severity: 'LOW'
        });
      }
    }
  }

  private calculateOverallHealth(report: GardenHealthReport) {
    // Đảm bảo điểm không âm
    report.score = Math.max(0, report.score);

    // Xác định mức độ sức khỏe tổng thể
    if (report.score >= 90) {
      report.overallHealth = 'EXCELLENT';
    } else if (report.score >= 70) {
      report.overallHealth = 'GOOD';
    } else if (report.score >= 50) {
      report.overallHealth = 'WARNING';
    } else {
      report.overallHealth = 'CRITICAL';
    }

    // Thêm lời khuyên tổng quát
    switch (report.overallHealth) {
      case 'EXCELLENT':
        report.recommendations.push('🎉 Vườn của bạn đang phát triển rất tốt! Tiếp tục duy trì chế độ chăm sóc hiện tại.');
        break;
      case 'GOOD':
        report.recommendations.push('👍 Vườn đang trong tình trạng tốt. Chú ý một số điểm nhỏ để đạt kết quả tốt hơn.');
        break;
      case 'WARNING':
        report.recommendations.push('⚠️ Vườn cần được chăm sóc thêm. Hãy xử lý các vấn đề được chỉ ra để cây phát triển tốt hơn.');
        break;
      case 'CRITICAL':
        report.recommendations.push('🚨 Vườn đang gặp nhiều vấn đề nghiêm trọng. Cần hành động ngay lập tức để cứu cây.');
        break;
    }
  }

  private async createAlertsIfNeeded(garden: any, report: GardenHealthReport, userId: number) {
    for (const alertData of report.alerts) {
      // Kiểm tra xem alert tương tự đã tồn tại chưa
      const existingAlert = await this.prisma.alert.findFirst({
        where: {
          gardenId: garden.id,
          userId: userId,
          type: alertData.type,
          message: alertData.message,
          status: { in: ['PENDING', 'IN_PROGRESS'] },
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000) // Trong 24h qua
          }
        }
      });

      if (!existingAlert) {
        await this.prisma.alert.create({
          data: {
            gardenId: garden.id,
            userId: userId,
            type: alertData.type,
            message: alertData.message,
            suggestion: alertData.suggestion,
            severity: alertData.severity,
            status: AlertStatus.PENDING
          }
        });
      }
    }
  }

  // Utility methods
  private getSensorTypeName(type: SensorType): string {
    const names = {
      [SensorType.HUMIDITY]: 'độ ẩm không khí',
      [SensorType.TEMPERATURE]: 'nhiệt độ',
      [SensorType.LIGHT]: 'ánh sáng',
      [SensorType.WATER_LEVEL]: 'mực nước',
      [SensorType.RAINFALL]: 'lượng mưa',
      [SensorType.SOIL_MOISTURE]: 'độ ẩm đất',
      [SensorType.SOIL_PH]: 'độ pH đất'
    };
    return names[type] || type;
  }

  private formatTimeAgo(date: Date): string {
    const hours = Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60));
    if (hours < 1) return 'vài phút trước';
    if (hours < 24) return `${hours} giờ trước`;
    const days = Math.floor(hours / 24);
    return `${days} ngày trước`;
  }

  private daysSince(date: Date): number {
    return Math.floor((Date.now() - date.getTime()) / (1000 * 60 * 60 * 24));
  }

  // Public method để lấy báo cáo với format thân thiện
  async getGardenHealthReportForUser(gardenId: number, userId: number): Promise<string> {
    const report = await this.checkGardenHealth(gardenId, userId);
    
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { name: true, plantName: true }
    });

    let message = `📊 **BÁO CÁO TÌNH TRẠNG VƯỜN "${garden?.name}"**\n\n`;
    
    // Hiển thị điểm tổng thể
    const healthEmoji = {
      'EXCELLENT': '🌟',
      'GOOD': '👍',
      'WARNING': '⚠️',
      'CRITICAL': '🚨'
    };

    message += `${healthEmoji[report.overallHealth]} **Tình trạng tổng thể**: ${this.getHealthStatusText(report.overallHealth)}\n`;
    message += `📈 **Điểm sức khỏe**: ${report.score}/100\n\n`;

    // Hiển thị các vấn đề
    if (report.issues.length > 0) {
      message += `🔍 **CÁC VẤN ĐỀ CẦN CHÚ Ý:**\n`;
      report.issues.forEach((issue, index) => {
        const severityEmoji = { 'LOW': '🟡', 'MEDIUM': '🟠', 'HIGH': '🔴', 'CRITICAL': '🚨' };
        message += `${index + 1}. ${severityEmoji[issue.severity]} ${issue.message}\n`;
        message += `   💡 *${issue.recommendation}*\n\n`;
      });
    }

    // Hiển thị lời khuyên
    if (report.recommendations.length > 0) {
      message += `💡 **LỜI KHUYÊN CHĂM SÓC:**\n`;
      report.recommendations.forEach((rec, index) => {
        message += `${index + 1}. ${rec}\n`;
      });
      message += `\n`;
    }

    // Hiển thị alert khẩn cấp
    const urgentAlerts = report.alerts.filter(a => a.severity === 'HIGH' || a.severity === 'CRITICAL');
    if (urgentAlerts.length > 0) {
      message += `🚨 **CẦN XỬ LÝ NGAY:**\n`;
      urgentAlerts.forEach(alert => {
        message += `• ${alert.message}\n`;
        message += `  ${alert.suggestion}\n`;
      });
    }

    message += `\n📅 *Cập nhật lúc: ${new Date().toLocaleString('vi-VN')}*`;
    
    return message;
  }

  private getHealthStatusText(health: string): string {
    const statusTexts = {
      'EXCELLENT': 'Xuất sắc',
      'GOOD': 'Tốt',
      'WARNING': 'Cần chú ý',
      'CRITICAL': 'Nghiêm trọng'
    };
    return statusTexts[health] || health;
  }
}