// src/modules/alerts/service/alert.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertStatus, AlertType } from '@prisma/client';
import { AlertDto, mapToAlertDto, mapToAlertDtoList } from './dto/alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy tất cả alert của user, có thể filter theo status và type */
  async findAllForUser(
    userId: number,
    params: { status?: AlertStatus; type?: AlertType },
  ): Promise<AlertDto[]> {
    const where: any = { userId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const alerts = await this.prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' } });
    return mapToAlertDtoList(alerts);
  }

  /** Lấy alert theo gardenId, chỉ alerts của user */
  async findByGardenForUser(
    userId: number,
    gardenId: number,
    params: { status?: AlertStatus; type?: AlertType },
  ): Promise<AlertDto[]> {
    const where: any = { userId, gardenId };
    if (params.status) where.status = params.status;
    if (params.type) where.type = params.type;

    const alerts = await this.prisma.alert.findMany({ where, orderBy: { createdAt: 'desc' } });
    return mapToAlertDtoList(alerts);
  }

  /** Lấy chi tiết một alert, kiểm tra quyền */
  async findOneForUser(userId: number, alertId: number): Promise<AlertDto> {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);
    if (alert.userId !== userId) throw new ForbiddenException();
    return mapToAlertDto(alert);
  }

  /** Cập nhật alert (patch), kiểm tra quyền */
  async updateForUser(
    userId: number,
    alertId: number,
    dto: UpdateAlertDto,
  ): Promise<AlertDto> {
    // ensure exists & permission
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);
    if (alert.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { ...dto },
    });
    return mapToAlertDto(updated);
  }

  /** Đánh dấu resolved */
  async resolveForUser(userId: number, alertId: number): Promise<AlertDto> {
    const alert = await this.prisma.alert.findUnique({ where: { id: alertId } });
    if (!alert) throw new NotFoundException(`Alert ${alertId} not found`);
    if (alert.userId !== userId) throw new ForbiddenException();

    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { status: AlertStatus.RESOLVED },
    });
    return mapToAlertDto(updated);
  }
}
