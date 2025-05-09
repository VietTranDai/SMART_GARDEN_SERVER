import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { AdviceActionDto } from './dto/advice-action.dto';

@Injectable()
export class GardenAdviceService {
  constructor(private prisma: PrismaService) {}

  async getAdvice(gardenId: number): Promise<AdviceActionDto[]> {
    // 1. Lấy thông tin Garden chỉ với plantName và plantGrowStage
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { plantName: true, plantGrowStage: true },
    });
    if (!garden) {
      throw new NotFoundException(`Không tìm thấy vườn với id ${gardenId}`);
    }
    const { plantName, plantGrowStage } = garden;
    if (!plantName || !plantGrowStage) {
      throw new NotFoundException('Garden chưa khai báo plantName hoặc plantGrowStage');
    }

    // 2. Tìm Plant theo plantName
    const plant = await this.prisma.plant.findUnique({
      where: { name: plantName },
      select: { id: true },
    });
    if (!plant) {
      throw new NotFoundException(`Không tìm thấy Plant với tên ${plantName}`);
    }

    // 3. Tìm GrowthStage theo plantId và stageName
    const growthStage = await this.prisma.growthStage.findFirst({
      where: { plantId: plant.id, stageName: plantGrowStage },
      select: {
        optimalTemperatureMin: true,
        optimalTemperatureMax: true,
        optimalHumidityMin: true,
        optimalHumidityMax: true,
        optimalSoilMoistureMin: true,
        optimalSoilMoistureMax: true,
        optimalPHMin: true,
        optimalPHMax: true,
        optimalLightMin: true,
        optimalLightMax: true,
      },
    });
    if (!growthStage) {
      throw new NotFoundException(
        `Không tìm thấy giai đoạn '${plantGrowStage}' cho cây '${plantName}'`
      );
    }

    // 4. Lấy sensorData mới nhất cho từng loại cảm biến trong vườn
    const sensors = await this.prisma.sensor.findMany({
      where: { gardenId },
      select: { id: true, type: true },
    });
    const sensorDataMap: Record<string, number> = {};
    await Promise.all(
      sensors.map(async ({ id, type }) => {
        const data = await this.prisma.sensorData.findFirst({
          where: { sensorId: id },
          orderBy: { timestamp: 'desc' },
          select: { value: true },
        });
        if (data) sensorDataMap[type.toLowerCase()] = data.value;
      })
    );

    // 5. Lấy weatherObservation, hourlyForecasts, dailyForecasts
    const [weatherObs, hourlyForecasts, dailyForecasts] = await Promise.all([
      this.prisma.weatherObservation.findFirst({
        where: { gardenId },
        orderBy: { observedAt: 'desc' },
        select: { rain1h: true },
      }),
      this.prisma.hourlyForecast.findMany({
        where: { gardenId },
        orderBy: { forecastFor: 'asc' },
        take: 6,
        select: { forecastFor: true, pop: true },
      }),
      this.prisma.dailyForecast.findMany({
        where: { gardenId },
        orderBy: { forecastFor: 'asc' },
        take: 1, // chỉ cần dự báo ngày hôm nay
        select: { forecastFor: true, pop: true },
      }),
    ]);

    // 6. Xác định thời điểm gợi ý
    const hour = new Date().getHours();
    const timeOfDay: 'morning' | 'noon' | 'evening' =
      hour < 12 ? 'morning' : hour < 18 ? 'noon' : 'evening';

    // 7. Khởi tạo danh sách khuyến nghị
    const advices: AdviceActionDto[] = [];

    // --- Khuyến nghị dựa trên dự báo thời tiết ngày hôm nay ---
    if (dailyForecasts.length > 0) {
      const todayForecast = dailyForecasts[0];
      const pop = todayForecast.pop;
      // Mưa lớn
      if (pop >= 0.8) {
        advices.push({
          action: 'Chuẩn bị thoát nước',
          description: 'Dự báo mưa lớn trong ngày, hãy đảm bảo hệ thống thoát nước thông suốt.',
          reason: `Xác suất mưa: ${Math.round(pop * 100)}%.`,
          priority: 'HIGH',
          suggestedTime: 'afternoon',
          category: 'WEATHER_FORECAST',
        });
      } else if (pop >= 0.5) {
        // Mưa vừa
        advices.push({
          action: 'Kiểm tra thoát nước',
          description: 'Có khả năng mưa vừa hôm nay, chú ý hệ thống thoát nước.',
          reason: `Xác suất mưa: ${Math.round(pop * 100)}%.`,
          priority: 'MEDIUM',
          suggestedTime: 'afternoon',
          category: 'WEATHER_FORECAST',
        });
      }
    }

    // --- Giữ lại khuyến nghị từ cảm biến ---
    // Tưới nước
    const soil = sensorDataMap['soil_moisture'];
    if (soil != null) {
      if (soil < growthStage.optimalSoilMoistureMin) {
        const rainSoon = hourlyForecasts.some(hf => hf.pop > 0.5);
        advices.push({
          action: 'Tưới nước',
          description: rainSoon
            ? 'Độ ẩm đất thấp, nhưng dự báo mưa nên có thể hoãn tưới.'
            : 'Độ ẩm đất thấp hơn ngưỡng tối ưu, cần tưới thêm nước.',
          reason: `Độ ẩm: ${soil}% so với tối thiểu ${growthStage.optimalSoilMoistureMin}%.`,
          priority: rainSoon ? 'MEDIUM' : 'HIGH',
          suggestedTime: rainSoon ? 'noon' : 'morning',
          category: 'WATERING',
        });
      } else if (soil > growthStage.optimalSoilMoistureMax) {
        advices.push({
          action: 'Dừng tưới',
          description: 'Độ ẩm đất cao hơn ngưỡng tối đa, tạm dừng tưới.',
          reason: `Độ ẩm: ${soil}% so với tối đa ${growthStage.optimalSoilMoistureMax}%.`,
          priority: 'LOW',
          suggestedTime: timeOfDay,
          category: 'WATERING',
        });
      }
    }

    // Nhiệt độ
    const temp = sensorDataMap['temperature'];
    if (temp != null) {
      if (temp > growthStage.optimalTemperatureMax) {
        advices.push({
          action: 'Che nắng',
          description: 'Nhiệt độ môi trường cao hơn ngưỡng tối ưu, nên che chắn.',
          reason: `Nhiệt độ: ${temp}°C so với tối đa ${growthStage.optimalTemperatureMax}°C.`,
          priority: 'HIGH',
          suggestedTime: 'noon',
          category: 'TEMPERATURE',
        });
      } else if (temp < growthStage.optimalTemperatureMin) {
        advices.push({
          action: 'Giữ ấm',
          description: 'Nhiệt độ môi trường thấp hơn ngưỡng tối ưu, cần giữ ấm.',
          reason: `Nhiệt độ: ${temp}°C so với tối thiểu ${growthStage.optimalTemperatureMin}°C.`,
          priority: 'MEDIUM',
          suggestedTime: 'morning',
          category: 'TEMPERATURE',
        });
      }
    }

    // Ánh sáng
    const light = sensorDataMap['light'];
    if (light != null) {
      if (light < growthStage.optimalLightMin) {
        advices.push({
          action: 'Tăng ánh sáng',
          description: 'Ánh sáng hiện tại yếu hơn ngưỡng tối ưu.',
          reason: `Ánh sáng: ${light} lux so với tối thiểu ${growthStage.optimalLightMin} lux.`,
          priority: 'MEDIUM',
          suggestedTime: 'morning',
          category: 'LIGHT',
        });
      } else if (light > growthStage.optimalLightMax) {
        advices.push({
          action: 'Che nắng',
          description: 'Ánh sáng mạnh hơn ngưỡng tối ưu, nên che chắn.',
          reason: `Ánh sáng: ${light} lux so với tối đa ${growthStage.optimalLightMax} lux.`,
          priority: 'MEDIUM',
          suggestedTime: 'noon',
          category: 'LIGHT',
        });
      }
    }

    // Độ ẩm không khí
    const hum = sensorDataMap['humidity'];
    if (hum != null) {
      if (hum < growthStage.optimalHumidityMin) {
        advices.push({
          action: 'Tăng độ ẩm không khí',
          description: 'Độ ẩm không khí thấp hơn ngưỡng tối ưu.',
          reason: `Độ ẩm: ${hum}% so với tối thiểu ${growthStage.optimalHumidityMin}%.`,
          priority: 'MEDIUM',
          suggestedTime: timeOfDay,
          category: 'HUMIDITY',
        });
      } else if (hum > growthStage.optimalHumidityMax) {
        advices.push({
          action: 'Giảm độ ẩm không khí',
          description: 'Độ ẩm không khí cao hơn ngưỡng tối ưu.',
          reason: `Độ ẩm: ${hum}% so với tối đa ${growthStage.optimalHumidityMax}%.`,
          priority: 'LOW',
          suggestedTime: timeOfDay,
          category: 'HUMIDITY',
        });
      }
    }

    // 8. Gộp nhóm theo action và chọn priority cao nhất
    const merged = new Map<string, AdviceActionDto>();
    advices.forEach(dto => {
      const key = dto.action;
      if (merged.has(key)) {
        const ex = merged.get(key)!;
        ex.reason += ' ' + dto.reason;
        if (['LOW','MEDIUM','HIGH'].indexOf(dto.priority) > ['LOW','MEDIUM','HIGH'].indexOf(ex.priority)) {
          ex.priority = dto.priority;
        }
      } else merged.set(key, { ...dto });
    });

    // 9. Sắp xếp và trả về kết quả
    return Array.from(merged.values()).sort((a, b) =>
      ['LOW','MEDIUM','HIGH'].indexOf(b.priority) - ['LOW','MEDIUM','HIGH'].indexOf(a.priority)
    );
  }
}
