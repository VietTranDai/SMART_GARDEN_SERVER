// src/modules/social/post/post.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDto, mapToPostDto } from './dto/post.dto';
import { SearchPostDto } from './dto/search-post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /** Search posts với SearchPostDto */
  async searchPostsAdvanced(searchDto: SearchPostDto): Promise<{
    data: PostDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      search,
      tagName,
      gardenerId,
      page = 1,
      limit = 10,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where conditions
    const whereConditions: any[] = [];

    // General search
    if (search) {
      whereConditions.push({
        OR: [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
          { plantName: { contains: search, mode: 'insensitive' } },
          { plantGrowStage: { contains: search, mode: 'insensitive' } },
        ]
      });
    }

    // Tag search
    if (tagName) {
      whereConditions.push({ 
        tags: { 
          some: { 
            tag: { 
              name: { contains: tagName, mode: 'insensitive' } 
            } 
          } 
        } 
      });
    }

    // User filter
    if (gardenerId) {
      whereConditions.push({ gardenerId });
    }

    const where = whereConditions.length > 0 ? { AND: whereConditions } : {};

    try {
      const [total, posts] = await Promise.all([
        this.prisma.post.count({ where }),
        this.prisma.post.findMany({
          where,
          skip,
          take: limit,
          orderBy: { createdAt: 'desc' },
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
                    bio: true,
                    gardener: { 
                      select: { 
                        experienceLevel: {
                          select: {
                            title: true,
                            icon: true,
                          }
                        }
                      } 
                    },
                  },
                },
              },
            },
            _count: {
              select: {
                comments: true,
                images: true,
              }
            }
          },
        })
      ]);

      if (posts.length === 0) {
        return {
          data: [],
          total: 0,
          page,
          limit,
          totalPages: 0,
        };
      }

      // Build DTOs
      const data = posts.map((post) => {
        const user = post.gardener?.user;
        if (!user) {
          throw new Error(`User not found for gardenerId: ${post.gardenerId}`);
        }

        return {
          id: post.id,
          gardenerId: post.gardenerId,
          userdata: {
            id: user.id,
            fullName: `${user.firstName} ${user.lastName}`.trim(),
            username: user.username,
            profilePicture: user.profilePicture || undefined,
            bio: user.bio || undefined,
            levelTitle: user.gardener?.experienceLevel?.title,
            levelIcon: user.gardener?.experienceLevel?.icon,
          },
          title: post.title,
          content: post.content,
          gardenId: post.gardenId ?? undefined,
          plantName: post.plantName ?? undefined,
          plantGrowStage: post.plantGrowStage ?? undefined,
          total_vote: post.total_vote,
          createdAt: post.createdAt,
          updatedAt: post.updatedAt,
          tags: [],
          comments: [],  
          images: [],
          commentCount: post._count.comments,
          imageCount: post._count.images,
          userVote: undefined,
        };
      });

      const totalPages = Math.ceil(total / limit);

      return {
        data,
        total,
        page,
        limit,
        totalPages,
      };
    } catch (error) {
      console.error('Error in searchPostsAdvanced:', error);
      throw error;
    }
  }

  /** Lấy chi tiết một bài viết */
  async getPostById(id: number): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id },
      select: {
        id: true,
        gardenerId: true,
        gardenId: true,
        plantName: true,
        plantGrowStage: true,
        title: true,
        content: true,
        total_vote: true,
        createdAt: true,
        updatedAt: true,
      },
    });
    if (!post) throw new NotFoundException('Post not found');

    const [postTags, images, comments, user] = await Promise.all([
      this.prisma.postTag.findMany({
        where: { postId: id },
        include: { tag: true },
      }),
      this.prisma.postImage.findMany({ where: { postId: id } }),
      this.prisma.comment.findMany({
        where: { postId: id },
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
                  bio: true,
                  gardener: { 
                    select: { 
                      experienceLevel: {
                        select: {
                          title: true,
                          icon: true,
                        }
                      }
                    } 
                  },
                },
              },
            },
          },
        },
      }),
      this.prisma.user.findUnique({
        where: { id: post.gardenerId },
        select: {
          id: true,
          username: true,
          firstName: true,
          lastName: true,
          profilePicture: true,
          bio: true,
          gardener: { 
            select: { 
              experienceLevel: {
                select: {
                  title: true,
                  icon: true,
                }
              }
            } 
          },
        },
      }),
    ]);
    if (!user) throw new NotFoundException('User not found');

    return mapToPostDto(
      post,
      postTags.map((r) => r.tag),
      images,
      comments,
      user,
      undefined,
    );
  }

  /** Tạo mới bài viết */
  async createPost(
    userId: number,
    body: CreatePostDto & { tagIds?: string[] },
    files: Express.Multer.File[],
  ): Promise<PostDto> {
    const { title, content, gardenId, plantName, plantGrowStage, tagIds } = body;

    const post = await this.prisma.post.create({
      data: {
        gardenerId: userId,
        gardenId: gardenId ? Number(gardenId) : undefined,
        plantName,
        plantGrowStage,
        title,
        content,
      },
      select: {
        id: true,
        gardenerId: true,
        gardenId: true,
        plantName: true,
        plantGrowStage: true,
        title: true,
        content: true,
        total_vote: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // Connect tags if provided
    if (tagIds && tagIds.length > 0) {
      const tagConnections = tagIds.map((tagId) => ({
        postId: post.id,
        tagId: Number(tagId),
      }));
      await this.prisma.postTag.createMany({ data: tagConnections });
    }

    // TODO: Handle file uploads for images

    return this.getPostById(post.id);
  }

  /** Cập nhật bài viết */
  async updatePost(
    userId: number,
    postId: number,
    data: Partial<CreatePostDto>,
  ): Promise<PostDto> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { gardenerId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.gardenerId !== userId) {
      throw new ForbiddenException('You can only edit your own posts');
    }

    const { title, content, gardenId, plantName, plantGrowStage } = data;
    await this.prisma.post.update({
      where: { id: postId },
      data: {
        ...(title && { title }),
        ...(content && { content }),
        ...(gardenId !== undefined && { gardenId: gardenId ? Number(gardenId) : null }),
        ...(plantName !== undefined && { plantName }),
        ...(plantGrowStage !== undefined && { plantGrowStage }),
      },
    });

    return this.getPostById(postId);
  }

  /** Xóa bài viết */
  async deletePost(userId: number, postId: number): Promise<void> {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { gardenerId: true },
    });
    if (!post) throw new NotFoundException('Post not found');
    if (post.gardenerId !== userId) {
      throw new ForbiddenException('You can only delete your own posts');
    }

    await this.prisma.post.delete({ where: { id: postId } });
  }

  /** Lấy comments của một post */
  async getCommentsByPostId(postId: number) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      select: { id: true },
    });
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
                bio: true,
                gardener: { 
                  select: { 
                    experienceLevel: {
                      select: {
                        title: true,
                        icon: true,
                      }
                    }
                  } 
                },
              },
            },
          },
        },
      },
    });
  }
}
