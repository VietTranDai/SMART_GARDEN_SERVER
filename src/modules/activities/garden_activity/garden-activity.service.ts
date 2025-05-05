// src/service/activity.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ActivityType } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';
import {
  GardenActivityDto,
  mapToGardenActivityDto,
} from './dto/dto/garden-activity.dto';
import { CreateActivityDto } from './dto/dto/create-activity.dto';
import {
  ActivityEvaluationDto,
  mapToActivityEvaluationDto,
} from './dto/dto/activity-evaluation.dto';
import { CreateEvaluationDto } from './dto/dto/create-evaluation.dto';

@Injectable()
export class GardenActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Xây dựng filter chung cho cả findAll và findByGarden
   */
  private buildWhere(
    params: { type?: ActivityType; startDate?: string; endDate?: string },
    gardenId?: number,
  ) {
    const where: Record<string, any> = {};

    if (gardenId !== undefined) {
      where.gardenId = gardenId;
    }
    if (params.type) {
      where.activityType = params.type;
    }
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        where.timestamp.gte = new Date(params.startDate);
      }
      if (params.endDate) {
        where.timestamp.lte = new Date(params.endDate);
      }
    }

    return where;
  }

  /**
   * Lấy tất cả activities của user đang đăng nhập
   */
  async findAllForUser(
    userId: number,
    params: { type?: ActivityType; startDate?: string; endDate?: string },
  ): Promise<GardenActivityDto[]> {
    const where = this.buildWhere(params);
    where.gardenerId = userId;

    const list = await this.prisma.gardenActivity.findMany({ where });
    return list.map(mapToGardenActivityDto);
  }

  /**
   * Lấy activities theo garden của user
   */
  async findByGardenForUser(
    userId: number,
    gardenId: number,
    params: { type?: ActivityType; startDate?: string; endDate?: string },
  ): Promise<GardenActivityDto[]> {
    // (Nếu cần, có thể thêm kiểm tra garden thuộc user ở đây)
    const where = this.buildWhere(params, gardenId);
    where.gardenerId = userId;

    const list = await this.prisma.gardenActivity.findMany({ where });
    return list.map(mapToGardenActivityDto);
  }

  /**
   * Lấy chi tiết 1 activity và kiểm tra quyền
   */
  async findOneForUser(userId: number, id: number): Promise<GardenActivityDto> {
    const activity = await this.prisma.gardenActivity.findUnique({
      where: { id },
    });
    if (!activity) {
      throw new NotFoundException(`Activity ${id} not found`);
    }
    if (activity.gardenerId !== userId) {
      throw new ForbiddenException(`Bạn không có quyền truy cập activity này`);
    }
    return mapToGardenActivityDto(activity);
  }

  /**
   * Tạo mới activity, gắn gardenerId từ token
   */
  async createForUser(
    userId: number,
    dto: CreateActivityDto,
  ): Promise<GardenActivityDto> {
    const created = await this.prisma.gardenActivity.create({
      data: {
        ...dto,
        gardenerId: userId,
      },
    });
    return mapToGardenActivityDto(created);
  }

  /**
   * Đánh giá activity: kiểm tra tồn tại, quyền rồi mới tạo evaluation
   */
  async evaluateForUser(
    userId: number,
    activityId: number,
    dto: CreateEvaluationDto,
  ): Promise<ActivityEvaluationDto> {
    const activity = await this.prisma.gardenActivity.findUnique({
      where: { id: activityId },
    });
    if (!activity) {
      throw new NotFoundException(`Activity ${activityId} not found`);
    }
    if (activity.gardenerId !== userId) {
      throw new ForbiddenException(`Bạn không có quyền đánh giá activity này`);
    }

    const ev = await this.prisma.activityEvaluation.create({
      data: {
        gardenActivityId: activityId,
        gardenerId: userId,
        ...dto,
      },
    });
    return mapToActivityEvaluationDto(ev);
  }
}
