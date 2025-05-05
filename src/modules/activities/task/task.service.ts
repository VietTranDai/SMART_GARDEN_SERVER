import {
  Injectable,
  NotFoundException,
  ForbiddenException,
} from '@nestjs/common';
import { CreateTaskDto, UpdateTaskDto } from './dto/task.dto';
import { TaskStatus } from '@prisma/client';
import { PhotoEvaluation } from '@prisma/client';
import { PrismaService } from '../../../prisma/prisma.service';

import * as path from 'path';
import * as fs from 'fs/promises';
import { mkdirSync, existsSync } from 'fs';

@Injectable()
export class TaskService {
  constructor(private readonly prisma: PrismaService) {}

  async getTasks(userId: number, query: any) {
    const { status, dueDate } = query;

    return this.prisma.task.findMany({
      where: {
        gardenerId: userId,
        status: status ? status : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTasksByGarden(userId: number, gardenId: number, query: any) {
    const { status, dueDate } = query;

    return this.prisma.task.findMany({
      where: {
        gardenerId: userId,
        gardenId,
        status: status ? status : undefined,
        dueDate: dueDate ? new Date(dueDate) : undefined,
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getTaskById(userId: number, taskId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.gardenerId !== userId) throw new ForbiddenException();

    return task;
  }

  async createTask(userId: number, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        gardenerId: userId,
      },
    });
  }

  async createTaskForGarden(userId: number, gardenId: number, dto: CreateTaskDto) {
    return this.prisma.task.create({
      data: {
        ...dto,
        gardenerId: userId,
        gardenId,
      },
    });
  }

  async updateTask(userId: number, taskId: number, dto: UpdateTaskDto) {
    await this.ensureTaskOwner(taskId, userId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        ...dto,
        updatedAt: new Date(),
      },
    });
  }

  async deleteTask(userId: number, taskId: number) {
    await this.ensureTaskOwner(taskId, userId);
    return this.prisma.task.delete({ where: { id: taskId } });
  }

  async completeTask(userId: number, taskId: number) {
    await this.ensureTaskOwner(taskId, userId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.COMPLETED,
        completedAt: new Date(),
      },
    });
  }

  async skipTask(userId: number, taskId: number) {
    await this.ensureTaskOwner(taskId, userId);
    return this.prisma.task.update({
      where: { id: taskId },
      data: {
        status: TaskStatus.SKIPPED,
      },
    });
  }

  async uploadPhoto(
    userId: number,
    taskId: number,
    file: Express.Multer.File,
  ): Promise<PhotoEvaluation> {
    await this.ensureTaskOwner(taskId, userId);

    if (!file || !file.buffer) {
      throw new NotFoundException('No file uploaded');
    }

    const folderPath = path.resolve('pictures/photo_evaluations');
    if (!existsSync(folderPath)) {
      mkdirSync(folderPath, { recursive: true });
    }

    const ext = path.extname(file.originalname) || '.jpg';
    const fileName = `task_${taskId}_${Date.now()}${ext}`;
    const fullPath = path.join(folderPath, fileName);

    await fs.writeFile(fullPath, file.buffer);

    return this.prisma.photoEvaluation.create({
      data: {
        taskId,
        gardenerId: userId,
        photoUrl: fullPath.replace(/\\\\/g, '/'),
        notes: null,
      },
    });
  }

  private async ensureTaskOwner(taskId: number, userId: number) {
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });
    if (!task) throw new NotFoundException('Task not found');
    if (task.gardenerId !== userId) throw new ForbiddenException();
  }
}
