import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { CreateWateringScheduleDto } from './dto/watering-schedule.dto';
import { TaskStatus } from '@prisma/client';
import { subDays, addDays, startOfDay, endOfDay } from 'date-fns';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class WateringScheduleService {
  constructor(private readonly prisma: PrismaService) {}

  async getAll(userId: number, query: any) {
    const gardener = await this.getGardener(userId);
    return this.prisma.wateringSchedule.findMany({
      where: {
        garden: { gardenerId: gardener.userId },
        status: query.status,
        scheduledAt: this.buildDateRange(query.startDate, query.endDate),
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async getById(userId: number, id: number) {
    const schedule = await this.findScheduleOrFail(id);
    await this.ensureOwnership(schedule.gardenId, userId);
    return schedule;
  }

  async complete(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.update({
      where: { id },
      data: { status: 'COMPLETED' },
    });
  }

  async skip(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.update({
      where: { id },
      data: { status: 'SKIPPED' },
    });
  }

  async delete(userId: number, id: number) {
    await this.ensureOwnershipBySchedule(id, userId);
    return this.prisma.wateringSchedule.delete({ where: { id } });
  }

  async getByGarden(userId: number, gardenId: number, query: any) {
    await this.ensureOwnership(gardenId, userId);
    return this.prisma.wateringSchedule.findMany({
      where: {
        gardenId,
        status: query.status,
        scheduledAt: this.buildDateRange(query.startDate, query.endDate),
      },
      orderBy: { scheduledAt: 'asc' },
    });
  }

  async create(userId: number, gardenId: number, dto: CreateWateringScheduleDto) {
    await this.ensureOwnership(gardenId, userId);
    return this.prisma.wateringSchedule.create({
      data: {
        gardenId,
        scheduledAt: new Date(dto.scheduledAt),
        amount: dto.amount,
      },
    });
  }

  async autoGenerate(userId: number, gardenId: number) {
    await this.ensureOwnership(gardenId, userId);

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: { sensors: true },
    });

    if (!garden) throw new NotFoundException('Garden not found');

    const today = new Date();
    const hasMoistureSensor = garden.sensors.some(s => s.type === 'SOIL_MOISTURE');

    const soilMoisture = hasMoistureSensor
      ? await this.prisma.sensorData.findFirst({
        where: {
          sensor: { gardenId: garden.id, type: 'SOIL_MOISTURE' },
          timestamp: { gte: subDays(today, 1) },
        },
        orderBy: { timestamp: 'desc' },
      })
      : null;

    const recommendedAmount = soilMoisture
      ? soilMoisture.value < 40
        ? 3.0
        : 1.5
      : 2.0; // fallback default

    return this.prisma.wateringSchedule.create({
      data: {
        gardenId,
        scheduledAt: addDays(today, 1),
        amount: recommendedAmount,
        notes: hasMoistureSensor ? 'Tự động dựa trên cảm biến độ ẩm' : 'Tự động mặc định',
      },
    });
  }

  private async ensureOwnership(gardenId: number, userId: number) {
    const garden = await this.prisma.garden.findUnique({ where: { id: gardenId } });
    if (!garden || garden.gardenerId !== userId) {
      throw new ForbiddenException('Bạn không có quyền truy cập garden này');
    }
  }

  private async ensureOwnershipBySchedule(scheduleId: number, userId: number) {
    const schedule = await this.findScheduleOrFail(scheduleId);
    await this.ensureOwnership(schedule.gardenId, userId);
  }

  private async findScheduleOrFail(id: number) {
    const schedule = await this.prisma.wateringSchedule.findUnique({ where: { id } });
    if (!schedule) throw new NotFoundException('Lịch tưới không tồn tại');
    return schedule;
  }

  private buildDateRange(startDate?: string, endDate?: string) {
    if (!startDate && !endDate) return undefined;
    const range: any = {};
    if (startDate) range.gte = startOfDay(new Date(startDate));
    if (endDate) range.lte = endOfDay(new Date(endDate));
    return range;
  }

  private async getGardener(userId: number) {
    const gardener = await this.prisma.gardener.findUnique({ where: { userId } });
    if (!gardener) throw new NotFoundException('Không tìm thấy người làm vườn');
    return gardener;
  }
}
