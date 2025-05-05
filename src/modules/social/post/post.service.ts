import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  private readonly postIncludes = {
    tags: { include: { tag: true } },
    comments: {
      include: {
        gardener: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                gardener: {
                  select: {
                    experienceLevel: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: {
        createdAt: 'desc' as const,
      },
    },
    images: true,
    gardener: {
      include: {
        user: {
          select: {
            id: true,
            username: true,
            firstName: true,
            lastName: true,
            profilePicture: true,
            gardener: {
              select: {
                experienceLevel: true,
              },
            },
          },
        },
      },
    },
  };

  async getPosts(query: any) {
    const { tag, search, gardenerId, plantName, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.PostWhereInput = {
      ...(search && { title: { contains: search, mode: 'insensitive' } }),
      ...(gardenerId && { gardenerId: Number(gardenerId) }),
      ...(plantName && {
        plantName: { contains: plantName, mode: 'insensitive' },
      }),
      ...(tag && {
        tags: {
          some: {
            tag: { name: tag },
          },
        },
      }),
    };

    return this.prisma.post.findMany({
      where,
      skip: Number(skip),
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
      include: this.postIncludes,
    });
  }

  async getPostById(id: number) {
    const post = await this.prisma.post.findUnique({
      where: { id },
      include: this.postIncludes,
    });
    if (!post) throw new NotFoundException('Post not found');
    return post;
  }

  async createPost(userId: number, body: any, images: Express.Multer.File[]) {
    const { title, content, gardenId, plantName, plantGrowStage, tagIds } = body;

    return this.prisma.post.create({
      data: {
        title,
        content,
        gardenId: gardenId ? Number(gardenId) : undefined,
        plantName,
        plantGrowStage,
        gardenerId: userId,
        tags: tagIds?.length
          ? {
            create: tagIds.map((tagId: string) => ({
              tag: { connect: { id: Number(tagId) } },
            })),
          }
          : undefined,
        images: images?.length
          ? {
            create: images.map((img) => ({
              url: `/uploads/${img.filename}`,
            })),
          }
          : undefined,
      },
      include: this.postIncludes,
    });
  }

  async updatePost(userId: number, id: number, data: Partial<CreatePostDto>) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.gardenerId !== userId) throw new ForbiddenException('Unauthorized');

    return this.prisma.post.update({
      where: { id },
      data,
      include: this.postIncludes,
    });
  }

  async deletePost(userId: number, id: number) {
    const post = await this.prisma.post.findUnique({ where: { id } });
    if (!post) throw new NotFoundException('Post not found');
    if (post.gardenerId !== userId) throw new ForbiddenException('Unauthorized');

    await this.prisma.post.delete({ where: { id } });
  }

  async getCommentsByPostId(postId: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('Post not found');

    return this.prisma.comment.findMany({
      where: { postId },
      orderBy: { createdAt: 'asc' },
      include: {
        gardener: {
          include: {
            user: {
              select: {
                id: true,
                username: true,
                firstName: true,
                lastName: true,
                profilePicture: true,
                gardener: {
                  select: {
                    experienceLevel: true,
                  },
                },
              },
            },
          },
        },
      },
    });
  }
}
