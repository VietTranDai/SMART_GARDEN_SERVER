import { Injectable, OnModuleInit } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from 'src/prisma/prisma.service';
import { SensorType } from '@prisma/client';

@Injectable()
export class SensorDataGeneratorService implements OnModuleInit {
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
        return parseFloat((Math.random() * 100).toFixed(2)); // 0% - 100% (mức nước)
      case SensorType.RAINFALL:
        return parseFloat((Math.random() * 50).toFixed(2)); // 0 mm - 50 mm (lượng mưa)
      case SensorType.SOIL_MOISTURE:
        return parseFloat((Math.random() * 100).toFixed(2)); // 0% - 100% (độ ẩm đất)
      case SensorType.SOIL_PH:
        return parseFloat((Math.random() * (14)).toFixed(2)); // 0 - 14 (độ pH)
    }
  }

  @Cron(CronExpression.EVERY_5_SECONDS)
  private async createSensorData() {
    const gardenKeys = ['1', '2', '3'];
    const allSensorTypes = Object.values(SensorType);

    const validSensorKeys = gardenKeys.flatMap(gardenKey =>
      allSensorTypes.map(type => `sensor_${gardenKey}_${type.toLowerCase()}`)
    );

    const sensors = await this.prisma.sensor.findMany({
      where: {
        sensorKey: {
          in: validSensorKeys,
        },
      },
    });

    for (const sensor of sensors) {
      const value = this.generateRandomValue(sensor.type);
      const timestamp = new Date();

      await this.prisma.sensorData.create({
        data: {
          sensorId: sensor.id,
          timestamp,
          value,
          gardenId: sensor.gardenId || null,
        },
      });
    }

    console.log(`✅ Đã tạo dữ liệu cho ${sensors.length} sensor lúc ${new Date().toISOString()}`);
  }

  onModuleInit() {
    console.log('SensorDataGeneratorService đã khởi động. Tạo dữ liệu sensor mỗi 5 giây.');
  }
}