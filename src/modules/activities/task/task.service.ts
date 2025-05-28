import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksQueryDto,
  TaskDto,
  mapToTaskDtoList,
  PaginatedTaskResult,
} from './dto/task.dto';
import {
  TaskStatus,
  ActivityType,
  Prisma,
  Task,
  Garden,
  Gardener,
  User,
} from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

// Define a more specific type for tasks with included relations for internal use
type TaskWithDetails = Task & {
  garden: Garden | null;
  gardener: (Gardener & { user: User | null }) | null;
};

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Maps a string task type to its corresponding ActivityType enum.
   * @param taskType The string representation of the task type.
   * @returns The mapped ActivityType or OTHER if no specific match.
   */
  private mapTaskTypeToActivityType(taskType: string): ActivityType {
    switch (taskType.toLowerCase()) {
      case 'tưới cây':
      case 'watering':
        return ActivityType.WATERING;
      case 'bón phân':
      case 'fertilizing':
        return ActivityType.FERTILIZING;
      case 'cắt tỉa':
      case 'pruning':
        return ActivityType.PRUNING;
      case 'thu hoạch':
      case 'harvesting':
        return ActivityType.HARVESTING;
      case 'kiểm soát sâu bệnh':
      case 'pest control':
        return ActivityType.PEST_CONTROL;
      case 'kiểm tra đất':
      case 'soil testing':
        return ActivityType.SOIL_TESTING;
      case 'làm cỏ':
      case 'weeding':
        return ActivityType.WEEDING;
      default:
        return ActivityType.OTHER;
    }
  }

  /**
   * Logs a garden activity to the database.
   * @param data The data for the garden activity log.
   */
  private async logGardenActivity(data: {
    gardenId: number;
    gardenerId: number;
    name: string;
    activityType: ActivityType;
    timestamp?: Date;
    plantName?: string | null;
    plantGrowStage?: string | null;
    details?: string;
    reason?: string;
  }): Promise<void> {
    await this.prisma.gardenActivity.create({
      data: {
        gardenId: data.gardenId,
        gardenerId: data.gardenerId,
        name: data.name,
        activityType: data.activityType,
        timestamp: data.timestamp || new Date(),
        plantName: data.plantName ?? undefined,
        plantGrowStage: data.plantGrowStage ?? undefined,
        details: data.details,
        reason: data.reason,
      },
    });
  }

  /**
   * Retrieves a paginated list of tasks based on specified filters.
   * @param userId The ID of the authenticated user.
   * @param query DTO containing filter and pagination parameters.
   * @returns A promise resolving to a PaginatedTaskResult.
   */
  async getTasks(
    userId: number,
    query: GetTasksQueryDto,
  ): Promise<PaginatedTaskResult> {
    const {
      status,
      dueDateFrom,
      dueDateTo,
      gardenId,
      gardenerId: queryGardenerId,
      page = 1,
      limit = 10,
    } = query;

    const whereClause: Prisma.TaskWhereInput = {};
    whereClause.gardenerId = queryGardenerId ?? userId;

    if (gardenId) {
      whereClause.gardenId = gardenId;
      if (!queryGardenerId) {
        whereClause.gardenerId = userId;
      }
    }
    if (status) {
      whereClause.status = status;
    }
    if (dueDateFrom || dueDateTo) {
      whereClause.dueDate = {};
      if (dueDateFrom) {
        (whereClause.dueDate as Prisma.DateTimeFilter).gte = new Date(
          dueDateFrom,
        );
      }
      if (dueDateTo) {
        (whereClause.dueDate as Prisma.DateTimeFilter).lte = new Date(
          dueDateTo,
        );
      }
    }

    const skip = (page - 1) * limit;

    const [tasks, totalItems] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where: whereClause,
        orderBy: { dueDate: 'asc' },
        skip: skip,
        take: limit,
      }),
      this.prisma.task.count({ where: whereClause }),
    ]);

    const totalPages = Math.ceil(totalItems / limit);

    return {
      items: mapToTaskDtoList(tasks),
      meta: {
        totalItems,
        itemsPerPage: limit,
        currentPage: page,
        totalPages,
      },
    };
  }

  /**
   * Retrieves a single task by its ID, ensuring the user has permission.
   * @param userId The ID of the authenticated user.
   * @param taskId The ID of the task to retrieve.
   * @returns A promise resolving to the Task object.
   */
  async getTaskById(userId: number, taskId: number): Promise<Task> {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Không tìm thấy công việc yêu cầu.');

    const garden = await this.prisma.garden.findUnique({
      where: { id: task.gardenId },
    });
    if (!garden)
      throw new NotFoundException(
        'Không tìm thấy khu vườn liên kết với công việc này.',
      );

    if (task.gardenerId !== userId && garden.gardenerId !== userId) {
      throw new ForbiddenException(
        'Bạn không có quyền truy cập công việc này.',
      );
    }
    return task;
  }

  /**
   * Creates a new task.
   * @param dto DTO containing data for the new task.
   * @returns A promise resolving to the created Task object.
   */
  async createTask(dto: CreateTaskDto): Promise<Task> {
    const {
      gardenerId,
      gardenId,
      type,
      description,
      dueDate,
      plantTypeName,
      plantStageName,
    } = dto;

    const gardenerWithUser = await this.prisma.gardener.findUnique({
      where: { userId: gardenerId },
      include: { user: true },
    });
    if (!gardenerWithUser)
      throw new NotFoundException(
        `Không tìm thấy người làm vườn với ID ${gardenerId}.`,
      );
    if (!gardenerWithUser.user)
      throw new NotFoundException(
        `Không tìm thấy thông tin người dùng cho người làm vườn ID ${gardenerId}.`,
      );

    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
    });
    if (!garden)
      throw new NotFoundException(
        `Không tìm thấy khu vườn với ID ${gardenId}.`,
      );

    const newTask = await this.prisma.task.create({
      data: {
        gardenerId,
        gardenId,
        type,
        description,
        dueDate: new Date(dueDate),
        plantTypeName,
        plantStageName,
        status: TaskStatus.PENDING,
      },
    });

    await this.logGardenActivity({
      gardenId: newTask.gardenId,
      gardenerId: newTask.gardenerId,
      name: `Đã tạo công việc mới: ${newTask.type}`,
      activityType: ActivityType.OTHER,
      timestamp: new Date(),
      plantName: newTask.plantTypeName,
      plantGrowStage: newTask.plantStageName,
      details: `Công việc "${newTask.description}" được tạo cho ${gardenerWithUser.user.username} trong khu vườn ${garden.name}. Hạn chót: ${new Date(newTask.dueDate).toLocaleDateString('vi-VN')}.`,
      reason: 'Tạo công việc mới trong hệ thống.',
    });

    return newTask;
  }

  /**
   * Updates an existing task.
   * @param userId The ID of the authenticated user performing the update.
   * @param taskId The ID of the task to update.
   * @param dto DTO containing data to update the task with.
   * @returns A promise resolving to the updated Task object.
   */
  async updateTask(
    userId: number,
    taskId: number,
    dto: UpdateTaskDto,
  ): Promise<Task> {
    const taskBeforeUpdate = await this.ensureTaskOwnerAndGetTask(
      taskId,
      userId,
    );

    const dataToUpdate: Prisma.TaskUpdateInput = { updatedAt: new Date() };

    if (dto.type !== undefined) dataToUpdate.type = dto.type;
    if (dto.description !== undefined)
      dataToUpdate.description = dto.description;
    if (dto.dueDate !== undefined) dataToUpdate.dueDate = new Date(dto.dueDate);
    if (dto.plantTypeName !== undefined)
      dataToUpdate.plantTypeName = dto.plantTypeName;
    if (dto.plantStageName !== undefined)
      dataToUpdate.plantStageName = dto.plantStageName;
    if (dto.status !== undefined) dataToUpdate.status = dto.status;
    if (dto.completedAt !== undefined)
      dataToUpdate.completedAt = dto.completedAt
        ? new Date(dto.completedAt)
        : null;

    if (dto.status) {
      if (dto.status === TaskStatus.COMPLETED) {
        dataToUpdate.completedAt = new Date();
      } else if (taskBeforeUpdate.status === TaskStatus.COMPLETED) {
        dataToUpdate.completedAt = null;
      } else if (dto.status === TaskStatus.SKIPPED) {
        dataToUpdate.completedAt = null;
      }
    } else if (
      dto.completedAt === null &&
      taskBeforeUpdate.status === TaskStatus.COMPLETED
    ) {
    }

    const updatedTask = await this.prisma.task.update({
      where: { id: taskId },
      data: dataToUpdate,
    });

    if (dto.status && dto.status !== taskBeforeUpdate.status) {
      if (updatedTask.status === TaskStatus.COMPLETED) {
        await this.logGardenActivity({
          gardenId: updatedTask.gardenId,
          gardenerId: updatedTask.gardenerId,
          name: `Đã hoàn thành công việc: ${updatedTask.type}`,
          activityType: this.mapTaskTypeToActivityType(updatedTask.type),
          timestamp: updatedTask.completedAt || new Date(),
          plantName: updatedTask.plantTypeName,
          plantGrowStage: updatedTask.plantStageName,
          details: `Công việc "${updatedTask.description}" đã được người làm vườn đánh dấu là HOÀN THÀNH.`,
          reason: 'Hoàn thành công việc theo lịch trình.',
        });
      } else if (updatedTask.status === TaskStatus.SKIPPED) {
        await this.logGardenActivity({
          gardenId: updatedTask.gardenId,
          gardenerId: updatedTask.gardenerId,
          name: `Đã bỏ qua công việc: ${updatedTask.type}`,
          activityType: ActivityType.OTHER,
          timestamp: new Date(),
          plantName: updatedTask.plantTypeName,
          plantGrowStage: updatedTask.plantStageName,
          details: `Công việc "${updatedTask.description}" đã được đánh dấu là BỎ QUA.`,
          reason: 'Công việc được người làm vườn đánh dấu là bỏ qua.',
        });
      }
    } else if (
      Object.values(dto).filter((v) => v !== undefined).length > 0 &&
      (!dto.status || dto.status === taskBeforeUpdate.status)
    ) {
      const changes: string[] = [];
      if (dto.type && dto.type !== taskBeforeUpdate.type)
        changes.push(
          `loại công việc từ "${taskBeforeUpdate.type}" thành "${dto.type}"`,
        );
      if (dto.description && dto.description !== taskBeforeUpdate.description)
        changes.push('mô tả công việc');
      if (
        dto.dueDate &&
        new Date(dto.dueDate).toISOString() !==
          taskBeforeUpdate.dueDate.toISOString()
      )
        changes.push(
          `hạn chót từ ${taskBeforeUpdate.dueDate.toLocaleDateString('vi-VN')} thành ${new Date(dto.dueDate).toLocaleDateString('vi-VN')}`,
        );
      if (
        dto.plantTypeName &&
        dto.plantTypeName !== (taskBeforeUpdate.plantTypeName ?? undefined)
      )
        changes.push(
          `tên loại cây từ "${taskBeforeUpdate.plantTypeName || 'trống'}" thành "${dto.plantTypeName || 'không có'}`,
        );
      if (
        dto.plantStageName &&
        dto.plantStageName !== (taskBeforeUpdate.plantStageName ?? undefined)
      )
        changes.push(
          `giai đoạn cây từ "${taskBeforeUpdate.plantStageName || 'trống'}" thành "${dto.plantStageName || 'không có'}`,
        );
      if (
        dto.completedAt &&
        updatedTask.completedAt?.toISOString() !==
          taskBeforeUpdate.completedAt?.toISOString()
      ) {
        if (updatedTask.completedAt) {
          changes.push(
            `thời gian hoàn thành thành ${updatedTask.completedAt.toLocaleString('vi-VN')}`,
          );
        } else {
          changes.push('thời gian hoàn thành đã được xóa');
        }
      }

      if (changes.length > 0) {
        const details = `Thông tin công việc "${updatedTask.description}" đã được cập nhật: thay đổi ${changes.join(', ')}.`;
        await this.logGardenActivity({
          gardenId: updatedTask.gardenId,
          gardenerId: updatedTask.gardenerId,
          name: `Cập nhật chi tiết công việc: ${updatedTask.type}`,
          activityType: ActivityType.OTHER,
          timestamp: new Date(),
          plantName: updatedTask.plantTypeName,
          plantGrowStage: updatedTask.plantStageName,
          details: details,
          reason: 'Cập nhật thông tin chi tiết của công việc.',
        });
      }
    }
    return updatedTask;
  }

  /**
   * Deletes a task by its ID after ensuring ownership.
   * @param userId The ID of the authenticated user.
   * @param taskId The ID of the task to delete.
   * @returns A promise resolving to a success message object.
   */
  async deleteTask(
    userId: number,
    taskId: number,
  ): Promise<{ message: string }> {
    const taskToDelete = await this.ensureTaskOwnerAndGetTask(taskId, userId);

    const gardenerUsername =
      taskToDelete.gardener?.user?.username || 'người dùng không xác định';
    const gardenName = taskToDelete.garden?.name || 'khu vườn không xác định';

    await this.logGardenActivity({
      gardenId: taskToDelete.gardenId,
      gardenerId: taskToDelete.gardenerId,
      name: `Đã xóa công việc: ${taskToDelete.type}`,
      activityType: ActivityType.OTHER,
      timestamp: new Date(),
      plantName: taskToDelete.plantTypeName,
      plantGrowStage: taskToDelete.plantStageName,
      details: `Công việc "${taskToDelete.description}" (ID: ${taskToDelete.id}) của ${gardenerUsername} trong khu vườn ${gardenName} đã bị xóa khỏi hệ thống.`,
      reason: 'Xóa công việc theo yêu cầu.',
    });

    await this.prisma.task.delete({ where: { id: taskId } });
    return { message: 'Công việc đã được xóa thành công.' };
  }

  /**
   * Ensures that the authenticated user is either the assigned gardener for the task
   * or the owner of the garden the task belongs to. Fetches the task with details.
   * @param taskId The ID of the task to check and retrieve.
   * @param userId The ID of the authenticated user.
   * @returns A promise resolving to the TaskWithDetails object if authorized.
   * @throws NotFoundException if task or its garden is not found.
   * @throws ForbiddenException if the user is not authorized.
   */
  private async ensureTaskOwnerAndGetTask(
    taskId: number,
    userId: number,
  ): Promise<TaskWithDetails> {
    const task = await this.prisma.task.findUnique({
      where: { id: taskId },
      include: {
        gardener: { include: { user: true } },
        garden: true,
      },
    });
    const typedTask = task as TaskWithDetails;

    if (!typedTask)
      throw new NotFoundException('Không tìm thấy công việc được yêu cầu.');
    if (!typedTask.garden)
      throw new NotFoundException(
        'Không tìm thấy khu vườn liên kết với công việc này. Dữ liệu không nhất quán.',
      );

    if (
      typedTask.gardenerId !== userId &&
      typedTask.garden.gardenerId !== userId
    ) {
      throw new ForbiddenException(
        'Bạn không có quyền thực hiện hành động này trên công việc đã cho.',
      );
    }
    return typedTask;
  }
}
