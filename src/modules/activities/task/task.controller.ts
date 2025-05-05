// src/modules/tasks/task.controller.ts
import {
  Body,
  Controller,
  Delete,
  Get, HttpCode,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
  UploadedFile,
  UseInterceptors,
} from '@nestjs/common';
import {
  ApiBearerAuth,
  ApiConsumes,
  ApiOperation,
  ApiParam,
  ApiQuery,
  ApiTags,
} from '@nestjs/swagger';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from '@prisma/client';
import { FileInterceptor } from '@nestjs/platform-express';
import { TaskService } from './task.service';

@ApiTags('Task')
@Controller('tasks/me')
@ApiBearerAuth()
export class TaskController {
  constructor(private readonly taskService: TaskService) {}

  @Get()
  @ApiOperation({ summary: 'Get all tasks of current user' })
  @ApiQuery({ name: 'status', enum: TaskStatus, required: false })
  @ApiQuery({ name: 'dueDate', required: false })
  async getTasks(@GetUser('id') userId: number, @Query() query: any) {
    return this.taskService.getTasks(userId, query);
  }

  @Get('gardens/:gardenId')
  @ApiOperation({ summary: 'Get tasks by garden' })
  @ApiParam({ name: 'gardenId' })
  async getTasksByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query() query: any,
  ) {
    return this.taskService.getTasksByGarden(userId, gardenId, query);
  }

  @Get(':taskId')
  @ApiOperation({ summary: 'Get task detail' })
  @ApiParam({ name: 'taskId' })
  async getTaskById(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.taskService.getTaskById(userId, taskId);
  }

  @Post()
  @ApiOperation({ summary: 'Create task' })
  async createTask(@GetUser('id') userId: number, @Body() dto: CreateTaskDto) {
    return this.taskService.createTask(userId, dto);
  }

  @Post('gardens/:gardenId')
  @ApiOperation({ summary: 'Create task for specific garden' })
  @ApiParam({ name: 'gardenId' })
  async createTaskForGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Body() dto: CreateTaskDto,
  ) {
    return this.taskService.createTaskForGarden(userId, gardenId, dto);
  }

  @Patch(':taskId')
  @ApiOperation({ summary: 'Update task' })
  @ApiParam({ name: 'taskId' })
  async updateTask(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.updateTask(userId, taskId, dto);
  }

  @Delete(':taskId')
  @ApiOperation({ summary: 'Delete task' })
  @ApiParam({ name: 'taskId' })
  @HttpCode(204)
  async deleteTask(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.taskService.deleteTask(userId, taskId);
  }

  @Post(':taskId/complete')
  @ApiOperation({ summary: 'Mark task as completed' })
  async completeTask(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.taskService.completeTask(userId, taskId);
  }

  @Post(':taskId/skip')
  @ApiOperation({ summary: 'Mark task as skipped' })
  async skipTask(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
  ) {
    return this.taskService.skipTask(userId, taskId);
  }

  @Post(':taskId/photo')
  @ApiOperation({ summary: 'Upload photo for task' })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FileInterceptor('photo'))
  async uploadPhoto(
    @GetUser('id') userId: number,
    @Param('taskId', ParseIntPipe) taskId: number,
    @UploadedFile() file: Express.Multer.File,
  ) {
    return this.taskService.uploadPhoto(userId, taskId, file);
  }
}