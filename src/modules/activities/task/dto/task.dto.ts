import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { Task, TaskStatus } from '@prisma/client';
import {
  IsString,
  IsNotEmpty,
  IsOptional,
  IsInt,
  IsEnum,
  IsDateString,
  ValidateIf,
  Min,
  Max,
} from 'class-validator';
import { Transform } from 'class-transformer';

// TaskDto: Represents a Task object for responses
export class TaskDto {
  @ApiProperty({ description: 'ID của công việc', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của gardener', example: 5 })
  gardenerId: number;

  @ApiProperty({ description: 'ID của garden', example: 10 })
  gardenId: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  plantTypeName?: string;

  @ApiPropertyOptional({
    description: 'Tên giai đoạn cây',
    example: 'Flowering',
  })
  plantStageName?: string;

  @ApiProperty({ description: 'Loại công việc', example: 'Watering' })
  type: string;

  @ApiProperty({
    description: 'Mô tả công việc',
    example: 'Water the tomatoes in the morning',
  })
  description: string;

  @ApiProperty({
    description: 'Ngày đến hạn',
    type: String,
    format: 'date-time',
  })
  dueDate: Date;

  @ApiProperty({ description: 'Trạng thái công việc', enum: TaskStatus })
  status: TaskStatus;

  @ApiProperty({
    description: 'Thời gian tạo',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;

  @ApiPropertyOptional({
    description: 'Thời gian hoàn thành nếu đã hoàn thành',
    type: String,
    format: 'date-time',
  })
  completedAt?: Date;
}

// CreateTaskDto: DTO for creating a new task
export class CreateTaskDto {
  @ApiProperty({
    description: 'ID của Gardener được giao nhiệm vụ',
    example: 1,
  })
  @IsInt({ message: 'Gardener ID phải là một số nguyên.' })
  @IsNotEmpty({ message: 'Gardener ID không được để trống.' })
  @Transform(({ value }) => parseInt(value, 10))
  gardenerId: number;

  @ApiProperty({
    description: 'ID của Garden nơi công việc được thực hiện',
    example: 1,
  })
  @IsInt({ message: 'Garden ID phải là một số nguyên.' })
  @IsNotEmpty({ message: 'Garden ID không được để trống.' })
  @Transform(({ value }) => parseInt(value, 10))
  gardenId: number;

  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  @IsString({ message: 'Tên loại cây phải là một chuỗi.' })
  @IsOptional()
  plantTypeName?: string;

  @ApiPropertyOptional({
    description: 'Tên giai đoạn cây',
    example: 'Flowering',
  })
  @IsString({ message: 'Tên giai đoạn cây phải là một chuỗi.' })
  @IsOptional()
  plantStageName?: string;

  @ApiProperty({ description: 'Loại công việc', example: 'Tưới cây' })
  @IsString({ message: 'Loại công việc phải là một chuỗi.' })
  @IsNotEmpty({ message: 'Loại công việc không được để trống.' })
  type: string;

  @ApiProperty({
    description: 'Mô tả công việc',
    example: 'Water the tomatoes in the morning',
  })
  @IsString({ message: 'Mô tả công việc phải là một chuỗi.' })
  @IsNotEmpty({ message: 'Mô tả công việc không được để trống.' })
  description: string;

  @ApiProperty({
    description: 'Ngày đến hạn (ISO 8601 string)',
    example: '2024-08-15T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    { message: 'Ngày đến hạn phải là một chuỗi ngày tháng hợp lệ (ISO 8601).' },
  )
  @IsNotEmpty({ message: 'Ngày đến hạn không được để trống.' })
  dueDate: string;
}

// UpdateTaskDto: DTO for updating an existing task
export class UpdateTaskDto {
  @ApiPropertyOptional({ description: 'Tên loại cây', example: 'Tomato' })
  @IsString({ message: 'Tên loại cây phải là một chuỗi.' })
  @IsOptional()
  plantTypeName?: string;

  @ApiPropertyOptional({
    description: 'Tên giai đoạn cây',
    example: 'Flowering',
  })
  @IsString({ message: 'Tên giai đoạn cây phải là một chuỗi.' })
  @IsOptional()
  plantStageName?: string;

  @ApiPropertyOptional({ description: 'Loại công việc', example: 'Watering' })
  @IsString({ message: 'Loại công việc phải là một chuỗi.' })
  @IsOptional()
  type?: string;

  @ApiPropertyOptional({
    description: 'Mô tả công việc',
    example: 'Water the tomatoes in the morning',
  })
  @IsString({ message: 'Mô tả công việc phải là một chuỗi.' })
  @IsOptional()
  description?: string;

  @ApiPropertyOptional({
    description: 'Ngày đến hạn (ISO 8601 string)',
    example: '2024-08-16T10:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    { message: 'Ngày đến hạn phải là một chuỗi ngày tháng hợp lệ (ISO 8601).' },
  )
  @IsOptional()
  dueDate?: string;

  @ApiPropertyOptional({
    description: 'Trạng thái công việc',
    enum: TaskStatus,
  })
  @IsEnum(TaskStatus, { message: 'Trạng thái công việc không hợp lệ.' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Thời gian hoàn thành nếu đã xong (ISO 8601 string)',
    example: '2024-08-15T11:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    {
      message:
        'Thời gian hoàn thành phải là một chuỗi ngày tháng hợp lệ (ISO 8601).',
    },
  )
  @IsOptional()
  completedAt?: string;
}

// GetTasksQueryDto: DTO for querying tasks with filters and pagination
export class GetTasksQueryDto {
  @ApiPropertyOptional({
    description: 'Lọc theo ID người làm vườn',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Gardener ID phải là một số nguyên.' })
  @Min(1, { message: 'Gardener ID phải lớn hơn hoặc bằng 1.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  gardenerId?: number;

  @ApiPropertyOptional({
    description: 'Lọc theo ID khu vườn',
    type: Number,
    example: 1,
  })
  @IsOptional()
  @IsInt({ message: 'Garden ID phải là một số nguyên.' })
  @Min(1, { message: 'Garden ID phải lớn hơn hoặc bằng 1.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : undefined))
  gardenId?: number;

  @ApiPropertyOptional({
    enum: TaskStatus,
    description: 'Lọc theo trạng thái công việc',
    example: TaskStatus.PENDING,
  })
  @IsEnum(TaskStatus, { message: 'Trạng thái công việc không hợp lệ.' })
  @IsOptional()
  status?: TaskStatus;

  @ApiPropertyOptional({
    description: 'Lọc công việc đến hạn từ ngày (ISO 8601 string)',
    example: '2024-08-01T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    { message: 'Ngày bắt đầu phải là một chuỗi ngày tháng hợp lệ (ISO 8601).' },
  )
  @IsOptional()
  dueDateFrom?: string;

  @ApiPropertyOptional({
    description: 'Lọc công việc đến hạn đến ngày (ISO 8601 string)',
    example: '2024-08-31T23:59:59.000Z',
    type: String,
    format: 'date-time',
  })
  @IsDateString(
    {},
    {
      message: 'Ngày kết thúc phải là một chuỗi ngày tháng hợp lệ (ISO 8601).',
    },
  )
  @IsOptional()
  @ValidateIf((o) => o.dueDateFrom) // Consider adding custom validator: dueDateTo >= dueDateFrom
  dueDateTo?: string;

  @ApiPropertyOptional({
    description: 'Số trang hiện tại (mặc định là 1)',
    type: Number,
    default: 1,
    example: 1,
    minimum: 1, // Added for Swagger UI clarity
  })
  @IsOptional()
  @IsInt({ message: 'Số trang phải là một số nguyên.' })
  @Min(1, { message: 'Số trang phải lớn hơn hoặc bằng 1.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 1))
  page?: number;

  @ApiPropertyOptional({
    description: 'Số lượng mục trên mỗi trang (mặc định là 10, tối đa 100)',
    type: Number,
    default: 10,
    example: 10,
    minimum: 1, // Added for Swagger UI clarity
    maximum: 100, // Added for Swagger UI clarity
  })
  @IsOptional()
  @IsInt({ message: 'Số lượng mục phải là một số nguyên.' })
  @Min(1, { message: 'Số lượng mục phải lớn hơn hoặc bằng 1.' })
  @Max(100, { message: 'Số lượng mục không được vượt quá 100.' })
  @Transform(({ value }) => (value ? parseInt(value, 10) : 10))
  limit?: number;
}

// PaginationMeta: Class for pagination metadata in responses
export class PaginationMeta {
  @ApiProperty({ type: Number, description: 'Tổng số công việc tìm thấy' })
  totalItems: number;

  @ApiProperty({
    type: Number,
    description: 'Số lượng công việc trên trang hiện tại',
  })
  itemsPerPage: number;

  @ApiProperty({ type: Number, description: 'Số trang hiện tại' })
  currentPage: number;

  @ApiProperty({ type: Number, description: 'Tổng số trang' })
  totalPages: number;
}

// PaginatedTaskResult: Response structure for paginated task results
export class PaginatedTaskResult {
  @ApiProperty({
    type: [TaskDto],
    description: 'Danh sách công việc cho trang hiện tại',
  })
  items: TaskDto[];

  @ApiProperty({
    type: () => PaginationMeta,
    description: 'Thông tin phân trang',
  })
  meta: PaginationMeta;
}

// mapToTaskDto: Maps a Prisma Task object to TaskDto
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
    completedAt: task.completedAt ?? undefined,
  };
}

// mapToTaskDtoList: Maps an array of Prisma Task objects to an array of TaskDto
export function mapToTaskDtoList(tasks: Task[]): TaskDto[] {
  return tasks.map(mapToTaskDto);
}
