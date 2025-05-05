import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task, TaskStatus } from '@prisma/client';

export class TaskDto {
  @ApiProperty({ description: 'ID của công việc', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'ID của garden', example: 10 })
  gardenId: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantTypeName?: string;

  @ApiPropertyOptional({ description: 'Tên giai đoạn cây', example: 'Flowering' })
  plantStageName?: string;

  @ApiProperty({ description: 'Loại công việc', example: 'Watering' })
  type: string;

  @ApiProperty({ description: 'Mô tả công việc', example: 'Water the tomatoes in the morning' })
  description: string;

  @ApiProperty({ description: 'Ngày đến hạn', type: String, format: 'date-time' })
  dueDate: Date;

  @ApiProperty({ description: 'Trạng thái công việc', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({ description: 'Thời gian tạo', type: String, format: 'date-time' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', type: String, format: 'date-time' })
  updatedAt: Date;

  @ApiPropertyOptional({ description: 'ID lịch tưới nếu có', example: 3 })
  wateringScheduleId?: number;

  @ApiPropertyOptional({ description: 'Thời gian hoàn thành nếu đã hoàn thành', type: String, format: 'date-time' })
  completedAt?: Date;
}

export class CreateTaskDto {
  @ApiProperty({ description: 'ID của gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'ID của garden', example: 10 })
  gardenId: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantTypeName?: string;

  @ApiPropertyOptional({ description: 'Tên giai đoạn cây', example: 'Flowering' })
  plantStageName?: string;

  @ApiProperty({ description: 'Loại công việc', example: 'Watering' })
  type: string;

  @ApiProperty({ description: 'Mô tả công việc', example: 'Water the tomatoes in the morning' })
  description: string;

  @ApiProperty({ description: 'Ngày đến hạn', type: String, format: 'date-time' })
  dueDate: Date;

  @ApiPropertyOptional({ description: 'ID lịch tưới nếu có', example: 3 })
  wateringScheduleId?: number;
}

export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantTypeName?: string;

  @ApiPropertyOptional({ description: 'Tên giai đoạn cây', example: 'Flowering' })
  plantStageName?: string;

  @ApiPropertyOptional({ description: 'Loại công việc', example: 'Watering' })
  type?: string;

  @ApiPropertyOptional({ description: 'Mô tả công việc', example: 'Water the tomatoes in the morning' })
  description?: string;

  @ApiPropertyOptional({ description: 'Ngày đến hạn', type: String, format: 'date-time' })
  dueDate?: Date;

  @ApiPropertyOptional({ description: 'Trạng thái công việc', enum: TaskStatus })
  status?: TaskStatus;

  @ApiPropertyOptional({ description: 'ID lịch tưới nếu có', example: 3 })
  wateringScheduleId?: number;

  @ApiPropertyOptional({ description: 'Thời gian hoàn thành nếu đã xong', type: String, format: 'date-time' })
  completedAt?: Date;
}

// Mapping functions
export function mapToTaskDto(task: Task): TaskDto {
  return {
    id: task.id,
    gardenerId: task.gardenerId,
    gardenId: task.gardenId,
    plantTypeName: task.plantTypeName ?? undefined,
    plantStageName: task.plantStageName ?? undefined,
    type: task.type,
    description: task.description,
    dueDate: task.dueDate,
    status: task.status,
    createdAt: task.createdAt,
    updatedAt: task.updatedAt,
    wateringScheduleId: task.wateringScheduleId ?? undefined,
    completedAt: task.completedAt ?? undefined,
  };
}

export function mapToTaskDtoList(tasks: Task[]): TaskDto[] {
  return tasks.map(mapToTaskDto);
}
