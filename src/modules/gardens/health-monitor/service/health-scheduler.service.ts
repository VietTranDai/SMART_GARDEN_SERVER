import { Injectable, Logger } from '@nestjs/common';
import { Cron } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { HealthMonitorService } from './health-monitor.service';
import { Severity } from '@prisma/client';

interface ScheduledCheckResult {
  gardenId: number;
  gardenName: string;
  status: 'SUCCESS' | 'ERROR' | 'SKIPPED';
  score?: number;
  alertsCreated?: number;
  error?: string;
  processingTime?: number;
}

interface ScheduledCheckSummary {
  totalGardens: number;
  successfulChecks: number;
  failedChecks: number;
  skippedChecks: number;
  totalAlertsCreated: number;
  averageScore: number;
  processingTimeMs: number;
  timestamp: string;
}

@Injectable()
export class HealthSchedulerService {
  private readonly logger = new Logger(HealthSchedulerService.name);
  private isRunning = false;

  constructor(
    private readonly healthMonitorService: HealthMonitorService,
    private readonly prisma: PrismaService
  ) {}

  // Chạy kiểm tra sức khỏe mỗi 2 giờ
  @Cron('0 */2 * * *', {
    name: 'garden-health-check-2hours',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async performScheduledHealthChecks() {
    if (this.isRunning) {
      this.logger.warn('Kiểm tra sức khỏe vườn đang chạy, bỏ qua lần này');
      return;
    }

    this.isRunning = true;
    const startTime = Date.now();
    
    this.logger.log('🌿 Bắt đầu kiểm tra sức khỏe định kỳ cho tất cả vườn (mỗi 2 giờ)...');

    try {
      const summary = await this.runHealthChecksForAllGardens();
      await this.logScheduledCheckSummary(summary);
      
      this.logger.log(
        `✅ Hoàn thành kiểm tra định kỳ: ${summary.successfulChecks}/${summary.totalGardens} vườn thành công, ` +
        `${summary.totalAlertsCreated} cảnh báo được tạo, thời gian: ${summary.processingTimeMs}ms`
      );

    } catch (error) {
      this.logger.error('❌ Lỗi trong quá trình kiểm tra định kỳ:', error.stack);
    } finally {
      this.isRunning = false;
    }
  }

  // Chạy kiểm tra nhanh mỗi 30 phút (chỉ sensor quan trọng)
  @Cron('*/30 * * * *', {
    name: 'garden-quick-check-30min',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async performQuickHealthChecks() {
    this.logger.log('⚡ Bắt đầu kiểm tra nhanh sensor quan trọng (mỗi 30 phút)...');

    try {
      const criticalIssues = await this.checkCriticalSensors();
      
      if (criticalIssues.length > 0) {
        this.logger.warn(`🚨 Phát hiện ${criticalIssues.length} vấn đề sensor nghiêm trọng`);
        await this.handleCriticalSensorIssues(criticalIssues);
      } else {
        this.logger.log('✅ Tất cả sensor quan trọng hoạt động bình thường');
      }

    } catch (error) {
      this.logger.error('❌ Lỗi trong kiểm tra nhanh:', error.stack);
    }
  }

  // Chạy kiểm tra dự báo thời tiết mỗi 6 giờ
  @Cron('0 */6 * * *', {
    name: 'weather-forecast-check-6hours',
    timeZone: 'Asia/Ho_Chi_Minh'
  })
  async checkWeatherForecastAlerts() {
    this.logger.log('🌤️ Kiểm tra cảnh báo dự báo thời tiết (mỗi 6 giờ)...');

    try {
      const weatherAlerts = await this.analyzeWeatherForecasts();
      
      if (weatherAlerts.length > 0) {
        this.logger.log(`📡 Tạo ${weatherAlerts.length} cảnh báo thời tiết cho các vườn`);
      }

    } catch (error) {
      this.logger.error('❌ Lỗi kiểm tra dự báo thời tiết:', error.stack);
    }
  }

  // Manual method để kiểm tra tất cả vườn ngay lập tức
  async runManualHealthCheckForAllGardens(): Promise<ScheduledCheckSummary> {
    this.logger.log('🔄 Bắt đầu kiểm tra sức khỏe thủ công cho tất cả vườn...');
    
    return await this.runHealthChecksForAllGardens();
  }

  // Core method để chạy kiểm tra cho tất cả vườn
  private async runHealthChecksForAllGardens(): Promise<ScheduledCheckSummary> {
    const startTime = Date.now();
    const results: ScheduledCheckResult[] = [];

    try {
      // Lấy tất cả vườn đang hoạt động
      const activeGardens = await this.prisma.garden.findMany({
        where: { 
          status: 'ACTIVE'
        },
        include: { 
          gardener: {
            include: {
              user: true
            }
          }
        },
        orderBy: { id: 'asc' }
      });

      this.logger.log(`📊 Tìm thấy ${activeGardens.length} vườn đang hoạt động`);

      // Xử lý từng vườn
      for (const garden of activeGardens) {
        const gardenStartTime = Date.now();
        
        try {
          // Kiểm tra xem vườn có cần kiểm tra không (tránh kiểm tra quá thường xuyên)
          if (await this.shouldSkipGarden(garden.id)) {
            results.push({
              gardenId: garden.id,
              gardenName: garden.name,
              status: 'SKIPPED'
            });
            continue;
          }

          const healthReport = await this.healthMonitorService.checkGardenHealth(
            garden.id, 
            garden.gardener.userId
          );

          const processingTime = Date.now() - gardenStartTime;

          results.push({
            gardenId: garden.id,
            gardenName: garden.name,
            status: 'SUCCESS',
            score: healthReport.score,
            alertsCreated: healthReport.alerts.length,
            processingTime
          });

          this.logger.debug(
            `✅ Vườn "${garden.name}" (ID: ${garden.id}) - ` +
            `Điểm: ${healthReport.score}/100, ` +
            `Alerts: ${healthReport.alerts.length}, ` +
            `Thời gian: ${processingTime}ms`
          );

          // Thêm delay nhỏ để tránh quá tải database
          await this.sleep(100);

        } catch (error) {
          const processingTime = Date.now() - gardenStartTime;
          
          results.push({
            gardenId: garden.id,
            gardenName: garden.name,
            status: 'ERROR',
            error: error.message,
            processingTime
          });

          this.logger.error(
            `❌ Lỗi kiểm tra vườn "${garden.name}" (ID: ${garden.id}): ${error.message}`
          );
        }
      }

      // Tạo summary
      const totalProcessingTime = Date.now() - startTime;
      const successfulResults = results.filter(r => r.status === 'SUCCESS');
      
      const summary: ScheduledCheckSummary = {
        totalGardens: activeGardens.length,
        successfulChecks: successfulResults.length,
        failedChecks: results.filter(r => r.status === 'ERROR').length,
        skippedChecks: results.filter(r => r.status === 'SKIPPED').length,
        totalAlertsCreated: successfulResults.reduce((sum, r) => sum + (r.alertsCreated || 0), 0),
        averageScore: successfulResults.length > 0 
          ? Math.round(successfulResults.reduce((sum, r) => sum + (r.score || 0), 0) / successfulResults.length)
          : 0,
        processingTimeMs: totalProcessingTime,
        timestamp: new Date().toISOString()
      };

      return summary;

    } catch (error) {
      this.logger.error('❌ Lỗi nghiêm trọng trong quá trình kiểm tra:', error.stack);
      throw error;
    }
  }

  private async checkCriticalSensors() {
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);
    const criticalIssues: any[] = [];

    // Kiểm tra sensor quan trọng (độ ẩm đất, nhiệt độ)
    const criticalSensors = await this.prisma.sensor.findMany({
      where: {
        type: { in: ['SOIL_MOISTURE', 'TEMPERATURE'] }
      },
      include: {
        garden: { 
          include: { 
            gardener: { include: { user: true } }
          } 
        },
        sensorData: {
          take: 1,
          orderBy: { timestamp: 'desc' }
        }
      }
    });

    for (const sensor of criticalSensors) {
      const latestData = sensor.sensorData[0];
      
      if (!latestData || latestData.timestamp < oneHourAgo) {
        criticalIssues.push({
          sensorId: sensor.id,
          sensorType: sensor.type,
          gardenId: sensor.gardenId,
          gardenName: sensor.garden.name,
          userId: sensor.garden.gardener.userId,
          lastSeen: latestData?.timestamp || null
        });
      }

      // Kiểm tra giá trị cực đoan
      if (latestData) {
        if (sensor.type === 'SOIL_MOISTURE' && latestData.value < 20) {
          criticalIssues.push({
            sensorId: sensor.id,
            sensorType: sensor.type,
            gardenId: sensor.gardenId,
            gardenName: sensor.garden.name,
            userId: sensor.garden.gardener.userId,
            issue: 'CRITICALLY_LOW_MOISTURE',
            value: latestData.value
          });
        }

        if (sensor.type === 'TEMPERATURE' && (latestData.value > 42 || latestData.value < 0)) {
          criticalIssues.push({
            sensorId: sensor.id,
            sensorType: sensor.type,
            gardenId: sensor.gardenId,
            gardenName: sensor.garden.name,
            userId: sensor.garden.gardener.userId,
            issue: 'EXTREME_TEMPERATURE',
            value: latestData.value
          });
        }
      }
    }

    return criticalIssues;
  }

  private async handleCriticalSensorIssues(issues: any[]) {
    for (const issue of issues) {
      try {
        // Kiểm tra xem đã có alert tương tự chưa
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            gardenId: issue.gardenId,
            userId: issue.userId,
            type: 'SENSOR_ERROR',
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            createdAt: {
              gte: new Date(Date.now() - 2 * 60 * 60 * 1000) // 2 giờ qua
            }
          }
        });

        if (!existingAlert) {
          let message = '';
          let suggestion = '';
          let severity: Severity = 'HIGH';

          if (issue.issue === 'CRITICALLY_LOW_MOISTURE') {
            message = `🚨 KHẨN CẤP: Độ ẩm đất cực thấp ${issue.value.toFixed(1)}% tại vườn ${issue.gardenName}`;
            suggestion = 'Tưới nước ngay lập tức! Cây có thể chết trong vài giờ tới nếu không được tưới nước.';
            severity = 'CRITICAL';
          } else if (issue.issue === 'EXTREME_TEMPERATURE') {
            message = `🌡️ KHẨN CẤP: Nhiệt độ cực ${issue.value > 35 ? 'cao' : 'thấp'} ${issue.value.toFixed(1)}°C tại vườn ${issue.gardenName}`;
            suggestion = issue.value > 35 
              ? 'Che nắng và làm mát ngay lập tức!'
              : 'Giữ ấm và bảo vệ cây khỏi lạnh ngay!';
            severity = 'CRITICAL';
          } else {
            message = `🔴 Cảm biến ${issue.sensorType} tại vườn ${issue.gardenName} đã ngừng hoạt động`;
            suggestion = 'Kiểm tra kết nối và pin cảm biến ngay lập tức';
          }

          await this.prisma.alert.create({
            data: {
              gardenId: issue.gardenId,
              userId: issue.userId,
              type: 'SENSOR_ERROR',
              message,
              suggestion,
              severity,
              status: 'PENDING'
            }
          });

          this.logger.warn(`🚨 Tạo cảnh báo khẩn cấp cho vườn ${issue.gardenName}: ${message}`);
        }
      } catch (error) {
        this.logger.error(`Lỗi tạo cảnh báo khẩn cấp:`, error);
      }
    }
  }

  private async analyzeWeatherForecasts() {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const weatherForecasts = await this.prisma.dailyForecast.findMany({
      where: {
        forecastFor: {
          gte: tomorrow,
          lt: new Date(tomorrow.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      include: {
        garden: {
          include: {
            gardener: { include: { user: true } }
          }
        }
      }
    });

    const alerts: any[] = [];

    for (const forecast of weatherForecasts) {
      const weatherAlerts: any[] = [];

      // Nhiệt độ cực cao
      if (forecast.tempMax > 40) {
        weatherAlerts.push({
          type: 'WEATHER',
          message: `🌡️ Cảnh báo: Ngày mai nhiệt độ sẽ rất cao ${forecast.tempMax.toFixed(1)}°C tại vườn ${forecast.garden.name}`,
          suggestion: 'Chuẩn bị che nắng và tưới nước nhiều hơn từ sáng sớm. Tránh làm vườn vào giữa trưa.',
          severity: forecast.tempMax > 42 ? 'HIGH' : 'MEDIUM'
        });
      }

      // Mưa to
      if (forecast.rain && forecast.rain > 25) {
        weatherAlerts.push({
          type: 'WEATHER',
          message: `🌧️ Cảnh báo: Ngày mai có mưa to ${forecast.rain.toFixed(1)}mm tại vườn ${forecast.garden.name}`,
          suggestion: 'Kiểm tra hệ thống thoát nước và tạm dừng tưới nước tự động. Chuẩn bị che chắn nếu cần.',
          severity: forecast.rain > 50 ? 'HIGH' : 'MEDIUM'
        });
      }

      // Gió mạnh
      if (forecast.windSpeed > 12) {
        weatherAlerts.push({
          type: 'WEATHER',
          message: `💨 Cảnh báo: Ngày mai có gió mạnh ${forecast.windSpeed.toFixed(1)} m/s tại vườn ${forecast.garden.name}`,
          suggestion: 'Gia cố cây và di chuyển chậu nhỏ vào nơi kín gió. Kiểm tra cột chống.',
          severity: forecast.windSpeed > 15 ? 'HIGH' : 'MEDIUM'
        });
      }

      for (const alert of weatherAlerts) {
        // Kiểm tra alert tương tự
        const existingAlert = await this.prisma.alert.findFirst({
          where: {
            gardenId: forecast.gardenId,
            userId: forecast.garden.gardener.userId,
            type: alert.type,
            status: { in: ['PENDING', 'IN_PROGRESS'] },
            createdAt: {
              gte: new Date(Date.now() - 12 * 60 * 60 * 1000) // 12 giờ qua
            }
          }
        });

        if (!existingAlert) {
          await this.prisma.alert.create({
            data: {
              gardenId: forecast.gardenId,
              userId: forecast.garden.gardener.userId,
              type: alert.type,
              message: alert.message,
              suggestion: alert.suggestion,
              severity: alert.severity,
              status: 'PENDING'
            }
          });

          alerts.push(alert);
        }
      }
    }

    return alerts;
  }

  private async shouldSkipGarden(gardenId: number): Promise<boolean> {
    // Bỏ qua nếu đã kiểm tra trong 1.5 giờ qua
    const recentCheck = await this.prisma.alert.findFirst({
      where: {
        gardenId,
        createdAt: {
          gte: new Date(Date.now() - 1.5 * 60 * 60 * 1000)
        }
      }
    });

    return !!recentCheck;
  }

  private async logScheduledCheckSummary(summary: ScheduledCheckSummary) {
    try {
      // Log vào database hoặc file nếu cần
      this.logger.log(
        `📊 Tóm tắt kiểm tra định kỳ: ` +
        `${summary.successfulChecks}/${summary.totalGardens} thành công, ` +
        `${summary.failedChecks} lỗi, ` +
        `${summary.skippedChecks} bỏ qua, ` +
        `${summary.totalAlertsCreated} cảnh báo, ` +
        `điểm TB: ${summary.averageScore}/100`
      );
    } catch (error) {
      this.logger.error('Lỗi ghi log summary:', error);
    }
  }

  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Public methods để quản lý service
  getSchedulerStatus() {
    return {
      isRunning: this.isRunning,
      timezone: 'Asia/Ho_Chi_Minh',
      schedules: {
        'garden-health-check-2hours': 'Mỗi 2 giờ (0 */2 * * *)',
        'garden-quick-check-30min': 'Mỗi 30 phút (*/30 * * * *)',
        'weather-forecast-check-6hours': 'Mỗi 6 giờ (0 */6 * * *)'
      },
      nextRun: {
        healthCheck: 'Trong 2 giờ tới',
        quickCheck: 'Trong 30 phút tới',
        weatherCheck: 'Trong 6 giờ tới'
      }
    };
  }
}