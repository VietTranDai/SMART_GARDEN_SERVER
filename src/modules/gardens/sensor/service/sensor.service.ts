// src/modules/sensor/service/sensor.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Sensor, SensorData, SensorType } from '@prisma/client';
import { GardenService } from '../../garden/garden.service';
import { randomUUID } from 'crypto';
import { CreateSensorDto, UpdateSensorDto } from '../dto/sensor.dto';

@Injectable()
export class SensorService {
  private readonly logger = new Logger(SensorService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gardenService: GardenService,
  ) {}

  async createSensor(
    gardenerId: number,
    dto: CreateSensorDto,
  ): Promise<Sensor> {
    // Verify ownership
    const allowed = await this.gardenService.checkGardenOwnership(
      gardenerId,
      dto.gardenId,
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this garden');
    }

    try {
      return await this.prisma.sensor.create({
        data: {
          sensorKey: dto.sensorKey || this.generateSensorKey(dto.type),
          type: dto.type,
          unit: dto.unit,
          name: dto.name,
          gardenId: dto.gardenId,
        },
      });
    } catch (error) {
      this.logger.error(`createSensor error: ${error.message}`);
      throw new InternalServerErrorException('Failed to create sensor');
    }
  }

  async getSensorByGarden(
    gardenerId: number,
    gardenId: number,
  ): Promise<Sensor[]> {
    const allowed = await this.gardenService.checkGardenOwnership(
      gardenerId,
      gardenId,
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this garden');
    }
    return this.prisma.sensor.findMany({
      where: { gardenId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getSensorById(gardenerId: number, sensorId: number): Promise<Sensor> {
    const sensor = await this.prisma.sensor.findUnique({
      where: { id: sensorId },
    });
    if (!sensor) {
      throw new NotFoundException(`Sensor ${sensorId} not found`);
    }
    const allowed = await this.gardenService.checkGardenOwnership(
      gardenerId,
      sensor.gardenId,
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this sensor');
    }
    return sensor;
  }

  async updateSensor(
    gardenerId: number,
    sensorId: number,
    dto: UpdateSensorDto,
  ): Promise<Sensor> {
    const existing = await this.getSensorById(gardenerId, sensorId);
    try {
      return await this.prisma.sensor.update({
        where: { id: sensorId },
        data: {
          ...('type' in dto && { type: dto.type }),
          ...('unit' in dto && { unit: dto.unit }),
          ...('name' in dto && { name: dto.name }),
        },
      });
    } catch (error) {
      this.logger.error(`updateSensor error: ${error.message}`);
      throw new InternalServerErrorException('Failed to update sensor');
    }
  }

  async deleteSensor(gardenerId: number, sensorId: number): Promise<void> {
    await this.getSensorById(gardenerId, sensorId);
    try {
      await this.prisma.sensor.delete({ where: { id: sensorId } });
    } catch (error) {
      this.logger.error(`deleteSensor error: ${error.message}`);
      throw new InternalServerErrorException('Failed to delete sensor');
    }
  }

  /**
   * Lấy lịch sử dữ liệu của một sensor với tùy chọn limit và khoảng thời gian
   */
  async getSensorDataHistory(
    gardenerId: number,
    sensorId: number,
    limit = 100,
    startDate?: Date,
    endDate?: Date,
  ): Promise<SensorData[]> {
    // verify access
    await this.getSensorById(gardenerId, sensorId);

    const where: any = { sensorId };
    if (startDate || endDate) {
      where.timestamp = {};
      if (startDate) where.timestamp.gte = startDate;
      if (endDate) where.timestamp.lte = endDate;
    }

    try {
      return this.prisma.sensorData.findMany({
        where,
        orderBy: { timestamp: 'desc' },
        take: limit,
      });
    } catch (error) {
      this.logger.error(`getSensorDataHistory error: ${error.message}`);
      throw new InternalServerErrorException(
        'Failed to fetch sensor data history',
      );
    }
  }

  /**
   * Lấy dữ liệu của tất cả sensor trong một garden, nhóm theo sensor type
   */
  async getGardenSensorData(
    gardenerId: number,
    gardenId: number,
    options: {
      limit?: number;
      startDate?: Date;
      endDate?: Date;
      sensorType?: SensorType;
    },
  ): Promise<Record<SensorType, SensorData[]>> {
    const allowed = await this.gardenService.checkGardenOwnership(
      gardenerId,
      gardenId,
    );
    if (!allowed) throw new ForbiddenException('Access denied to this garden');

    // If sensorType is specified, only get sensors of that type
    const where: any = { gardenId };
    if (options.sensorType) {
      where.type = options.sensorType;
    }

    const sensors = await this.prisma.sensor.findMany({ where });
    const grouped: Record<SensorType, SensorData[]> = {} as any;

    for (const sensor of sensors) {
      const data = await this.getSensorDataHistory(
        gardenerId,
        sensor.id,
        options.limit ?? 100,
        options.startDate,
        options.endDate,
      );
      const type = sensor.type;
      if (!grouped[type]) grouped[type] = [];
      grouped[type].push(...data);
    }
    return grouped;
  }

  private generateSensorKey(type: SensorType): string {
    const prefix = type.toLowerCase().slice(0, 3);
    return `${prefix}_${randomUUID()}`;
  }

  /**
   * Lấy latest reading cho tất cả sensor trong một garden
   */
  async getLatestReadingsByGarden(
    gardenerId: number,
    gardenId: number,
  ): Promise<Array<{ sensor: Sensor; latestReading: SensorData | null }>> {
    // 1. Verify quyền truy cập
    const allowed = await this.gardenService.checkGardenOwnership(
      gardenerId,
      Number(gardenId),
    );
    if (!allowed) {
      throw new ForbiddenException('Access denied to this garden');
    }

    // 2. Lấy danh sách sensors
    const sensors = await this.prisma.sensor.findMany({
      where: { gardenId: Number(gardenId) },
      orderBy: { createdAt: 'desc' },
    });

    // 3. Với mỗi sensor, lấy reading mới nhất (timestamp desc)
    const result: Array<{ sensor: Sensor; latestReading: SensorData | null }> =
      [];
    for (const sensor of sensors) {
      const reading = await this.prisma.sensorData.findFirst({
        where: { sensorId: sensor.id },
        orderBy: { timestamp: 'desc' },
      });
      result.push({ sensor, latestReading: reading });
    }

    return result;
  }
}
