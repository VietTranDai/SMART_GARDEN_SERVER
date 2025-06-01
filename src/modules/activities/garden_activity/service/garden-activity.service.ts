// src/service/activity.service.ts
import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { ActivityType, Prisma, GardenActivity } from '@prisma/client';
import { PrismaService } from '../../../../prisma/prisma.service';
import {
  GardenActivityDto,
  mapToGardenActivityDto,
  mapToGardenActivityDtoList,
} from '../dto/garden-activity.dto';
import { GetGardenActivitiesQueryDto } from '../dto/garden-activity-query.dto';
import { PaginatedGardenActivitiesResultDto } from '../dto/pagination.dto';
import { CreateActivityDto } from '../dto/create-activity.dto';
import { CreateEvaluationDto } from '../dto/create-evaluation.dto';
import {
  ActivityEvaluationDto,
  mapToActivityEvaluationDto,
} from '../dto/activity-evaluation.dto';

@Injectable()
export class GardenActivityService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Builds a Prisma WhereInput object for querying garden activities.
   * @param userId The ID of the user to scope the activities to.
   * @param params Query parameters including type, date range, and gardenId.
   * @returns Prisma.GardenActivityWhereInput
   */
  private buildWhere(
    userId: number,
    params: GetGardenActivitiesQueryDto,
  ): Prisma.GardenActivityWhereInput {
    const where: Prisma.GardenActivityWhereInput = {
      gardenerId: userId,
    };

    if (params.gardenId) {
      where.gardenId = params.gardenId;
    }
    if (params.type) {
      where.activityType = params.type;
    }
    if (params.startDate || params.endDate) {
      where.timestamp = {};
      if (params.startDate) {
        (where.timestamp as Prisma.DateTimeFilter).gte = new Date(
          params.startDate,
        );
      }
      if (params.endDate) {
        (where.timestamp as Prisma.DateTimeFilter).lte = new Date(
          params.endDate,
        );
      }
    }
    return where;
  }

  /**
   * Retrieves a paginated list of garden activities for the authenticated user.
   * @param userId The ID of the authenticated user.
   * @param query DTO containing filter and pagination parameters.
   * @returns A promise resolving to a PaginatedGardenActivityResultDto.
   */
  async findAllForUser(
    userId: number,
    query: GetGardenActivitiesQueryDto,
  ): Promise<PaginatedGardenActivitiesResultDto> {
    const { page = 1, limit = 10 } = query;
    const whereClause = this.buildWhere(userId, query);

    const skip = (page - 1) * limit;

    const [activities, totalItems] = await this.prisma.$transaction([
      this.prisma.gardenActivity.findMany({
        where: whereClause,
        orderBy: { timestamp: 'desc' },
        skip: skip,
        take: limit,
        include: {},
      }),
      this.prisma.gardenActivity.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: mapToGardenActivityDtoList(activities as GardenActivity[]),
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single garden activity by its ID, ensuring the user has permission.
   * @param userId The ID of the authenticated user.
   * @param activityId The ID of the activity to retrieve.
   * @returns A promise resolving to the GardenActivityDto.
   * @throws NotFoundException if the activity is not found.
   * @throws ForbiddenException if the user does not own the activity.
   */
  async findOneForUser(
    userId: number,
    activityId: number,
  ): Promise<GardenActivityDto> {
    const activity = await this.prisma.gardenActivity.findUnique({
      where: { id: activityId },
    });

    if (!activity) {
      throw new NotFoundException(
        `Không tìm thấy hoạt động với ID ${activityId}.`,
      );
    }
    if (activity.gardenerId !== userId) {
      const garden = await this.prisma.garden.findUnique({
        where: { id: activity.gardenId },
      });
      if (!garden || garden.gardenerId !== userId) {
        throw new ForbiddenException(
          `Bạn không có quyền truy cập hoạt động này.`,
        );
      }
    }
    return mapToGardenActivityDto(activity as GardenActivity);
  }

  /**
   * Creates a new garden activity for the authenticated user.
   * @param userId The ID of the authenticated user (gardener).
   * @param dto DTO containing data for the new activity.
   * @returns A promise resolving to the created GardenActivityDto.
   * @throws NotFoundException if the specified gardenId does not exist or does not belong to the user.
   */
  async createForUser(
    userId: number,
    dto: CreateActivityDto,
  ): Promise<GardenActivityDto> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: dto.gardenId },
    });

    if (!garden) {
      throw new NotFoundException(
        `Không tìm thấy khu vườn với ID ${dto.gardenId}.`,
      );
    }
    // Authorization: Ensure user (gardenerId from token) can log activity in this garden
    // This might involve checking Garden.gardenerId or a GardenerOnGarden link table
    // For now, assuming if garden exists, user can log (simplification)
    // However, the DTO has gardenerId, which might be different from userId if an admin creates it.
    // If dto.gardenerId is the one to use: ensure that gardener exists.
    // If userId from token is always the gardener for the activity:

    const activityGardenerId = dto.gardenerId || userId; // Prefer DTO if admin sets, else current user

    // Validate if activityGardenerId exists if it's from DTO
    if (dto.gardenerId) {
      const gardenerExists = await this.prisma.gardener.findUnique({
        where: { userId: dto.gardenerId },
      });
      if (!gardenerExists) {
        throw new NotFoundException(
          `Không tìm thấy người làm vườn với ID ${dto.gardenerId} được chỉ định.`,
        );
      }
    }

    const createdActivityData: Prisma.GardenActivityCreateInput = {
      name: dto.name,
      activityType: dto.activityType,
      timestamp: new Date(dto.timestamp), // Assuming dto.timestamp is ISO string or Date
      plantName: dto.plantName,
      plantGrowStage: dto.plantGrowStage,
      humidity: dto.humidity,
      temperature: dto.temperature,
      lightIntensity: dto.lightIntensity,
      waterLevel: dto.waterLevel,
      rainfall: dto.rainfall,
      soilMoisture: dto.soilMoisture,
      soilPH: dto.soilPH,
      details: dto.details,
      reason: dto.reason,
      notes: dto.notes,
      garden: { connect: { id: dto.gardenId } },
      gardener: { connect: { userId: activityGardenerId } }, // Use determined gardenerId
    };

    const createdActivity = await this.prisma.gardenActivity.create({
      data: createdActivityData,
    });
    return mapToGardenActivityDto(createdActivity as GardenActivity);
  }

  async evaluateForUser(
    userId: number,
    activityId: number,
    dto: CreateEvaluationDto,
  ): Promise<ActivityEvaluationDto> {
    const activity = await this.prisma.gardenActivity.findUnique({
      where: { id: activityId },
      include: { garden: true },
    });

    if (!activity) {
      throw new NotFoundException(
        `Không tìm thấy hoạt động với ID ${activityId}.`,
      );
    }

    if (
      activity.gardenerId !== userId &&
      activity.garden.gardenerId !== userId
    ) {
      throw new ForbiddenException(
        `Bạn không có quyền đánh giá hoạt động này.`,
      );
    }

    const evaluatorGardenerId = dto.gardenerId || userId;

    if (dto.gardenerId) {
      const gardenerExists = await this.prisma.gardener.findUnique({
        where: { userId: dto.gardenerId },
      });
      if (!gardenerExists) {
        throw new NotFoundException(
          `Người làm vườn với ID ${dto.gardenerId} (người đánh giá) không tồn tại.`,
        );
      }
    }

    const evaluation = await this.prisma.activityEvaluation.create({
      data: {
        gardenActivity: { connect: { id: activityId } },
        evaluatorType: 'USER',
        gardener: { connect: { userId: evaluatorGardenerId } },
        evaluatedAt: new Date(),
        outcome: dto.outcome,
        rating: dto.rating,
        comments: dto.comments,
      },
    });
    return mapToActivityEvaluationDto(evaluation);
  }
}
