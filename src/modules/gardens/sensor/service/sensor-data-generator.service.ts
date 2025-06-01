import { Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sensor, SensorType } from '@prisma/client';

@Injectable()
export class SensorDataGeneratorService implements OnModuleInit {
  private readonly logger = new Logger(SensorDataGeneratorService.name);

  // Cache toàn bộ sensor cần tạo data
  private sensors: Sensor[] = [];

  constructor(private readonly prisma: PrismaService) {}

  private generateRandomValue(type: SensorType): number {
    switch (type) {
      case SensorType.TEMPERATURE:
        return parseFloat((Math.random() * 50).toFixed(2)); // 0°C - 50°C
      case SensorType.HUMIDITY:
        return parseFloat((Math.random() * 100).toFixed(2)); // 0% - 100%
      case SensorType.LIGHT:
        return parseFloat((Math.random() * 10000).toFixed(2)); // 0 lux - 10000 lux
      case SensorType.WATER_LEVEL:
        return parseFloat((Math.random() * 100).toFixed(2)); // 0% - 100%
      case SensorType.RAINFALL:
        return parseFloat((Math.random() * 50).toFixed(2)); // 0 mm - 50 mm
      case SensorType.SOIL_MOISTURE:
        return parseFloat((Math.random() * 100).toFixed(2)); // 0% - 100%
      case SensorType.SOIL_PH:
        return parseFloat((Math.random() * 14).toFixed(2)); // 0 - 14
    }
  }

  /** Chạy một lần khi module init để load danh sách sensors */
  async onModuleInit() {
    this.sensors = await this.prisma.sensor.findMany({
      where: {
        sensorKey: {
          in: ['1', '2', '3', '4', '5', '6', '7']
            .flatMap(gk =>
              (Object.values(SensorType) as SensorType[]).map(
                t => `sensor_${gk}_${t.toLowerCase()}`,
              ),
            ),
        },
      },
    });

    this.logger.log(
      `Loaded ${this.sensors.length} sensors, sẽ tạo data mỗi 5s.`,
    );
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async createSensorData() {
    const timestamp = new Date();

    const creates = this.sensors.map(sensor => {
      const value = this.generateRandomValue(sensor.type);
      return this.prisma.sensorData.create({
        data: {
          sensorId: sensor.id,
          gardenId: sensor.gardenId,
          timestamp,
          value,
        },
      });
    });

    await Promise.all(creates);

    this.logger.log(
      `✅ Đã tạo dữ liệu cho ${this.sensors.length} sensor lúc ${timestamp.toISOString()}`,
    );
  }
}
