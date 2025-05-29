// src/modules/tasks/task.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  Param,
  ParseIntPipe,
  Put,
  Post,
  Query,
  Req,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
  ApiResponse,
} from '@nestjs/swagger';
import {
  CreateTaskDto,
  UpdateTaskDto,
  GetTasksQueryDto,
  PaginatedTaskResult,
  TaskDto,
  mapToTaskDto,
} from './dto/task.dto';
import { TaskStatus, Task } from '@prisma/client';
import { TaskService } from './task.service';

/**
 * Controller for managing tasks.
 * Base path: /api/tasks
 * All endpoints are protected and require Bearer token authentication.
 */
@ApiTags('Tasks')
@Controller('tasks')
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  /**
   * Creates a new task.
   * @param createTaskDto DTO containing data for the new task.
   * @returns The created task as a TaskDto.
   */
  @Post()
  @ApiOperation({ summary: 'Tạo một công việc mới' })
  @ApiResponse({
    status: 201,
    description: 'Công việc đã được tạo thành công.',
    type: TaskDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 404,
    description: 'Không tìm thấy Gardener hoặc Garden được chỉ định.',
  })
  async createTask(@Body() createTaskDto: CreateTaskDto): Promise<TaskDto> {
    const task = await this.taskService.createTask(createTaskDto);
    return mapToTaskDto(task);
  }

  /**
   * Retrieves a paginated list of tasks with optional filters.
   * The user ID from the request is used to further scope tasks if not an admin or querying specific gardener.
   * @param req The request object (to get authenticated user ID).
   * @param query DTO containing filter and pagination parameters.
   * @returns A paginated list of tasks.
   */
  @Get()
  @ApiOperation({
    summary: 'Lấy danh sách công việc với các bộ lọc và phân trang',
  })
  @ApiQuery({
    name: 'gardenerId',
    type: Number,
    required: false,
    description: 'Lọc công việc theo ID Người làm vườn',
    example: 1,
  })
  @ApiQuery({
    name: 'gardenId',
    type: Number,
    required: false,
    description: 'Lọc công việc theo ID Khu vườn',
    example: 1,
  })
  @ApiQuery({
    name: 'status',
    enum: TaskStatus,
    required: false,
    description: 'Lọc công việc theo trạng thái',
  })
  @ApiQuery({
    name: 'dueDateFrom',
    type: String,
    required: false,
    description: 'Lọc công việc đến hạn từ ngày này (ISO 8601)',
    example: '2024-01-01T00:00:00Z',
  })
  @ApiQuery({
    name: 'dueDateTo',
    type: String,
    required: false,
    description: 'Lọc công việc đến hạn đến ngày này (ISO 8601)',
    example: '2024-12-31T23:59:59Z',
  })
  @ApiQuery({
    name: 'page',
    type: Number,
    required: false,
    description: 'Số trang',
    default: 1,
    example: 1,
  })
  @ApiQuery({
    name: 'limit',
    type: Number,
    required: false,
    description: 'Số lượng mục trên mỗi trang',
    default: 10,
    example: 10,
  })
  @ApiResponse({
    status: 200,
    description: 'Lấy danh sách công việc thành công.',
    type: PaginatedTaskResult,
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  async getTasks(
    @Req() req: any,
    @Query() query: GetTasksQueryDto,
  ): Promise<PaginatedTaskResult> {
    const userId = req.user?.id;
    return this.taskService.getTasks(userId, query);
  }

  /**
   * Retrieves a specific task by its ID.
   * Requires user to be the task's gardener or the garden owner.
   * @param req The request object (to get authenticated user ID).
   * @param taskId The ID of the task to retrieve.
   * @returns The requested task as a TaskDto.
   */
  @Get(':taskId')
  @ApiOperation({ summary: 'Lấy chi tiết công việc theo ID' })
  @ApiParam({
    name: 'taskId',
    type: Number,
    description: 'ID Công việc',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết công việc.',
    type: TaskDto,
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền truy cập công việc này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc.' })
  async getTaskById(
    @Req() req: any,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<TaskDto> {
    const userId = req.user?.id;
    const task = await this.taskService.getTaskById(userId, taskId);
    return mapToTaskDto(task);
  }

  /**
   * Updates an existing task.
   * Requires user to be the task's gardener or the garden owner.
   * @param req The request object (to get authenticated user ID).
   * @param taskId The ID of the task to update.
   * @param updateTaskDto DTO containing data for the update.
   * @returns The updated task as a TaskDto.
   */
  @Put(':taskId')
  @ApiOperation({
    summary: 'Cập nhật thông tin công việc (bao gồm cả trạng thái)',
  })
  @ApiParam({
    name: 'taskId',
    type: Number,
    description: 'ID Công việc',
    example: 1,
  })
  @ApiResponse({
    status: 200,
    description: 'Công việc đã được cập nhật thành công.',
    type: TaskDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu đầu vào không hợp lệ.' })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền cập nhật công việc này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc.' })
  async updateTask(
    @Req() req: any,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() updateTaskDto: UpdateTaskDto,
  ): Promise<TaskDto> {
    const userId = req.user?.id;
    const updatedTask = await this.taskService.updateTask(
      userId,
      taskId,
      updateTaskDto,
    );
    return mapToTaskDto(updatedTask);
  }

  /**
   * Deletes a task.
   * Requires user to be the task's gardener or the garden owner.
   * @param req The request object (to get authenticated user ID).
   * @param taskId The ID of the task to delete.
   */
  @Delete(':taskId')
  @ApiOperation({ summary: 'Xóa một công việc' })
  @ApiParam({
    name: 'taskId',
    type: Number,
    description: 'ID Công việc',
    example: 1,
  })
  @ApiResponse({
    status: 204,
    description: 'Công việc đã được xóa thành công.',
  })
  @ApiResponse({ status: 401, description: 'Không được phép (Chưa xác thực).' })
  @ApiResponse({
    status: 403,
    description: 'Không có quyền xóa công việc này.',
  })
  @ApiResponse({ status: 404, description: 'Không tìm thấy công việc.' })
  @HttpCode(204)
  async deleteTask(
    @Req() req: any,
    @Param('taskId', ParseIntPipe) taskId: number,
  ): Promise<void> {
    const userId = req.user?.id;
    await this.taskService.deleteTask(userId, taskId);
  }
}
