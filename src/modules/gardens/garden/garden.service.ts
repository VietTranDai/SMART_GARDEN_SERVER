// src/garden/garden.service.ts
import {
  Injectable,
  Logger,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  InternalServerErrorException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { randomUUID } from 'crypto';
import { CreateGardenDto } from './dto/create-garden.dto';
import { UpdateGardenDto } from './dto/update-garden.dto';
import { GardenDto, mapToGardenDto } from './dto/garden.dto';
import { Garden, GardenStatus } from '@prisma/client';

@Injectable()
export class GardenService {
  private readonly logger = new Logger(GardenService.name);
  constructor(private readonly prisma: PrismaService) {}

  async checkGardenOwnership(
    gardenerId: number,
    gardenId: number,
  ): Promise<boolean> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      select: { gardenerId: true },
    });

    if (!garden) {
      throw new NotFoundException(`Garden with ID ${gardenId} not found`);
    }

    return garden.gardenerId === gardenerId;
  }

  private readonly defaultInclude = {
    gardener: {
      include: {
        user: { include: { role: true } },
        experienceLevel: true,
      },
    },
  } as const;


  async findAll(userId: number): Promise<GardenDto[]> {
    const gardens = await this.prisma.garden.findMany({
      where: { gardenerId: userId },
      include: this.defaultInclude,
    });
    return gardens.map(mapToGardenDto);
  }

  async findOne(userId: number, gardenId: number): Promise<GardenDto> {
    const garden = await this.prisma.garden.findUnique({
      where: { id: gardenId },
      include: this.defaultInclude,
    });
    if (!garden) throw new NotFoundException(`Garden ${gardenId} not found`);

    if(!await this.checkGardenOwnership(userId, gardenId)){
      throw new ForbiddenException(`Garden ${gardenId} not found`);
    }

    return mapToGardenDto(garden);
  }


}