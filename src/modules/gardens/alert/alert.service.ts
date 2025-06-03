// src/modules/alerts/service/alert.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { AlertStatus, AlertType } from '@prisma/client';
import { AlertDto, mapToAlertDto, mapToAlertDtoList } from './dto/alert.dto';
import { UpdateAlertDto } from './dto/update-alert.dto';

@Injectable()
export class AlertService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Common include object for garden relation
   */
  private readonly includeGarden = {
    garden: {
      select: { name: true }
    }
  };

  /**
   * Build where clause for alerts
   */
  private buildWhereClause(
    userId: number,
    gardenId?: number,
    params?: { status?: AlertStatus; type?: AlertType }
  ) {
    const where: any = { userId };
    if (gardenId) where.gardenId = gardenId;
    if (params?.status) where.status = params.status;
    if (params?.type) where.type = params.type;
    return where;
  }

  /**
   * Find and validate alert ownership
   */
  private async findAlertWithOwnership(userId: number, alertId: number) {
    const alert = await this.prisma.alert.findUnique({
      where: { id: alertId },
      include: this.includeGarden
    });
    
    if (!alert) {
      throw new NotFoundException(`Alert ${alertId} not found`);
    }
    
    if (alert.userId !== userId) {
      throw new ForbiddenException('Access denied to this alert');
    }
    
    return alert;
  }

  /**
   * Lấy tất cả alert của user, có thể filter theo status và type
   */
  async findAllForUser(
    userId: number,
    params: { status?: AlertStatus; type?: AlertType } = {},
  ): Promise<AlertDto[]> {
    const alerts = await this.prisma.alert.findMany({
      where: this.buildWhereClause(userId, undefined, params),
      include: this.includeGarden,
      orderBy: { createdAt: 'desc' }
    });
    
    return mapToAlertDtoList(alerts);
  }

  /**
   * Lấy alert theo gardenId, chỉ alerts của user
   */
  async findByGardenForUser(
    userId: number,
    gardenId: number,
    params: { status?: AlertStatus; type?: AlertType } = {},
  ): Promise<AlertDto[]> {
    const alerts = await this.prisma.alert.findMany({
      where: this.buildWhereClause(userId, gardenId, params),
      include: this.includeGarden,
      orderBy: { createdAt: 'desc' }
    });
    
    return mapToAlertDtoList(alerts);
  }

  /**
   * Lấy chi tiết một alert, kiểm tra quyền
   */
  async findOneForUser(userId: number, alertId: number): Promise<AlertDto> {
    const alert = await this.findAlertWithOwnership(userId, alertId);
    return mapToAlertDto(alert);
  }

  /**
   * Cập nhật alert (patch), kiểm tra quyền
   */
  async updateForUser(
    userId: number,
    alertId: number,
    dto: UpdateAlertDto,
  ): Promise<AlertDto> {
    // Validate ownership first
    await this.findAlertWithOwnership(userId, alertId);

    // Update alert
    const updated = await this.prisma.alert.update({
      where: { id: alertId },
      data: { ...dto },
      include: this.includeGarden
    });
    
    return mapToAlertDto(updated);
  }

  /**
   * Đánh dấu resolved
   */
  async resolveForUser(userId: number, alertId: number): Promise<AlertDto> {
    return this.updateForUser(userId, alertId, { status: AlertStatus.RESOLVED });
  }
}
