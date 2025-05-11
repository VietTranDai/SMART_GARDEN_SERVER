import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Tag } from '@prisma/client';
import { CreateTagDto } from './dto/create-tag.dto';
import { UpdateTagDto } from './dto/update-tag.dto';
import { TagDto, TagWithPostCountDto } from './dto/tag.dto';

@Injectable()
export class TagService {
  private readonly logger = new Logger(TagService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(createTagDto: CreateTagDto): Promise<TagDto> {
    try {
      // Kiểm tra xem tag có tồn tại không
      const existingTag = await this.prisma.tag.findFirst({
        where: { name: { equals: createTagDto.name, mode: 'insensitive' } },
      });

      if (existingTag) {
        throw new BadRequestException(
          `Tag với tên '${createTagDto.name}' đã tồn tại`,
        );
      }

      const tag = await this.prisma.tag.create({
        data: createTagDto,
      });

      this.logger.log(`Created tag: ${tag.id}`);
      return this.mapToTagDto(tag);
    } catch (error) {
      this.logger.error(`Error creating tag: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo tag');
    }
  }

  async findAll(): Promise<TagWithPostCountDto[]> {
    try {
      const tags = await this.prisma.tag.findMany({
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        postCount: tag._count.posts,
      }));
    } catch (error) {
      this.logger.error(
        `Error finding all tags: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Không thể lấy danh sách tag');
    }
  }

  async findOne(id: number): Promise<TagWithPostCountDto> {
    try {
      const tag = await this.prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      if (!tag) {
        throw new NotFoundException(`Không tìm thấy tag với ID ${id}`);
      }

      return {
        id: tag.id,
        name: tag.name,
        postCount: tag._count.posts,
      };
    } catch (error) {
      this.logger.error(
        `Error finding tag ${id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy thông tin tag`);
    }
  }

  async update(id: number, updateTagDto: UpdateTagDto): Promise<TagDto> {
    try {
      // Kiểm tra xem tag có tồn tại không
      const existingTag = await this.prisma.tag.findUnique({
        where: { id },
      });

      if (!existingTag) {
        throw new NotFoundException(`Không tìm thấy tag với ID ${id}`);
      }

      // Kiểm tra xem tên mới có trùng với tag khác không
      if (updateTagDto.name) {
        const tagWithSameName = await this.prisma.tag.findFirst({
          where: {
            name: { equals: updateTagDto.name, mode: 'insensitive' },
            id: { not: id },
          },
        });

        if (tagWithSameName) {
          throw new BadRequestException(
            `Tag với tên '${updateTagDto.name}' đã tồn tại`,
          );
        }
      }

      const updatedTag = await this.prisma.tag.update({
        where: { id },
        data: updateTagDto,
      });

      this.logger.log(`Updated tag: ${id}`);
      return this.mapToTagDto(updatedTag);
    } catch (error) {
      this.logger.error(
        `Error updating tag ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể cập nhật tag');
    }
  }

  async remove(id: number): Promise<void> {
    try {
      // Kiểm tra xem tag có tồn tại không
      const existingTag = await this.prisma.tag.findUnique({
        where: { id },
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
      });

      if (!existingTag) {
        throw new NotFoundException(`Không tìm thấy tag với ID ${id}`);
      }

      // Kiểm tra xem tag có đang được sử dụng không
      if (existingTag._count.posts > 0) {
        throw new BadRequestException(
          `Không thể xóa tag vì đang được sử dụng bởi ${existingTag._count.posts} bài viết`,
        );
      }

      await this.prisma.tag.delete({
        where: { id },
      });

      this.logger.log(`Deleted tag: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting tag ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa tag');
    }
  }

  /**
   * Get popular tags based on post count
   */
  async getPopularTags(limit: number = 20): Promise<TagWithPostCountDto[]> {
    try {
      const tags = await this.prisma.tag.findMany({
        include: {
          _count: {
            select: {
              posts: true,
            },
          },
        },
        orderBy: {
          posts: {
            _count: 'desc',
          },
        },
        take: limit,
      });

      return tags.map((tag) => ({
        id: tag.id,
        name: tag.name,
        postCount: tag._count.posts,
      }));
    } catch (error) {
      this.logger.error(
        `Error getting popular tags: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Could not get popular tags');
    }
  }

  /**
   * Search tags by name
   */
  async searchTags(query: string, limit: number = 10): Promise<TagDto[]> {
    try {
      const tags = await this.prisma.tag.findMany({
        where: {
          name: {
            contains: query,
            mode: 'insensitive',
          },
        },
        take: limit,
      });

      return tags.map(this.mapToTagDto);
    } catch (error) {
      this.logger.error(`Error searching tags: ${error.message}`, error.stack);
      throw new BadRequestException('Could not search tags');
    }
  }

  private mapToTagDto(tag: Tag): TagDto {
    return {
      id: tag.id,
      name: tag.name,
    };
  }
}
