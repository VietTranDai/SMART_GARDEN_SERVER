import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { UpdatePostDto } from './dto/update-post.dto';
import { PostDto, PostPaginationDto } from './dto/post.dto';
import { Post, Prisma } from '@prisma/client';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapToPostDto(post: Post, userVote?: number): PostDto {
    return {
      id: post.id,
      gardenerId: post.gardenerId,
      title: post.title,
      content: post.content,
      gardenId: post.gardenId || undefined,
      plantName: post.plantName || undefined,
      plantGrowStage: post.plantGrowStage || undefined,
      total_vote: post.total_vote,
      createdAt: post.createdAt,
      updatedAt: post.updatedAt,
      userVote: userVote,
    };
  }

  async create(
    gardenerId: number,
    createPostDto: CreatePostDto,
  ): Promise<PostDto> {
    try {
      // Tạo transaction để đảm bảo tính nhất quán khi tạo post, thêm tag và thêm ảnh
      return await this.prisma.$transaction(async (tx) => {
        // Tạo bài viết
        const post = await tx.post.create({
          data: {
            title: createPostDto.title,
            content: createPostDto.content,
            gardenerId: gardenerId,
            gardenId: createPostDto.gardenId,
            plantName: createPostDto.plantName,
            plantGrowStage: createPostDto.plantGrowStage,
            total_vote: 0,
          },
        });

        // Nếu có tagIds, thêm các liên kết PostTag
        if (createPostDto.tagIds && createPostDto.tagIds.length > 0) {
          // Kiểm tra xem tất cả tags có tồn tại không
          const tagCount = await tx.tag.count({
            where: {
              id: {
                in: createPostDto.tagIds,
              },
            },
          });

          if (tagCount !== createPostDto.tagIds.length) {
            throw new BadRequestException('Một hoặc nhiều tag không tồn tại');
          }

          // Thêm liên kết PostTag
          await Promise.all(
            createPostDto.tagIds.map((tagId) =>
              tx.postTag.create({
                data: {
                  postId: post.id,
                  tagId: tagId,
                },
              }),
            ),
          );
        }

        // Nếu có imageUrls, thêm các liên kết PostImage
        if (createPostDto.imageUrls && createPostDto.imageUrls.length > 0) {
          await Promise.all(
            createPostDto.imageUrls.map((url) =>
              tx.postImage.create({
                data: {
                  postId: post.id,
                  url: url,
                },
              }),
            ),
          );
        }

        this.logger.log(`Post created by gardener ${gardenerId}: ${post.id}`);
        return this.mapToPostDto(post);
      });
    } catch (error) {
      this.logger.error(`Error creating post: ${error.message}`, error.stack);
      if (error instanceof BadRequestException) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo bài viết');
    }
  }

  async findAll(
    page = 1,
    limit = 10,
    sortBy: 'createdAt' | 'total_vote' = 'createdAt',
    order: 'asc' | 'desc' = 'desc',
    gardenerId?: number,
    gardenId?: number,
    tagId?: number,
    search?: string,
    currentUserId?: number,
  ): Promise<PostPaginationDto> {
    try {
      const skip = (page - 1) * limit;

      // Xây dựng điều kiện lọc
      const where: Prisma.PostWhereInput = {};

      if (gardenerId) {
        where.gardenerId = gardenerId;
      }

      if (gardenId) {
        where.gardenId = gardenId;
      }

      if (tagId) {
        where.tags = {
          some: {
            tagId: tagId,
          },
        };
      }

      if (search) {
        where.OR = [
          { title: { contains: search, mode: 'insensitive' } },
          { content: { contains: search, mode: 'insensitive' } },
        ];
      }

      // Đếm tổng số bài viết
      const total = await this.prisma.post.count({ where });

      // Lấy danh sách bài viết
      const posts = await this.prisma.post.findMany({
        where,
        orderBy: { [sortBy]: order },
        skip,
        take: limit,
        include: {
          images: true,
          tags: {
            include: {
              tag: true,
            },
          },
        },
      });

      // Nếu có currentUserId, lấy thông tin vote của người dùng cho từng bài viết
      let userVotes: Record<number, number> = {};
      if (currentUserId) {
        const votes = await this.prisma.vote.findMany({
          where: {
            gardenerId: currentUserId,
            targetType: 'POST',
            targetId: {
              in: posts.map((post) => post.id),
            },
          },
          select: {
            targetId: true,
            voteValue: true,
          },
        });

        userVotes = votes.reduce(
          (acc, vote) => {
            acc[vote.targetId] = vote.voteValue;
            return acc;
          },
          {} as Record<number, number>,
        );
      }

      // Map kết quả sang DTO
      const items = posts.map((post) => {
        const postDto = this.mapToPostDto(post, userVotes[post.id]);

        // Thêm thông tin images và tags
        postDto.images = post.images.map((img) => ({
          id: img.id,
          postId: img.postId,
          url: img.url,
        }));

        postDto.tags = post.tags.map((pt) => ({
          id: pt.tag.id,
          name: pt.tag.name,
        }));

        return postDto;
      });

      return {
        items,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(`Error finding posts: ${error.message}`, error.stack);
      throw new BadRequestException('Không thể lấy danh sách bài viết');
    }
  }

  async findOne(id: number, currentUserId?: number): Promise<PostDto> {
    try {
      const post = await this.prisma.post.findUnique({
        where: { id },
        include: {
          images: true,
          tags: {
            include: {
              tag: true,
            },
          },
          comments: {
            where: { parentId: null },
            orderBy: { score: 'desc' },
            take: 10,
            include: {
              gardener: {
                include: {
                  user: true,
                },
              },
              replies: {
                orderBy: { createdAt: 'asc' },
                take: 5,
                include: {
                  gardener: {
                    include: {
                      user: true,
                    },
                  },
                },
              },
            },
          },
        },
      });

      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
      }

      // Nếu có currentUserId, lấy thông tin vote của người dùng
      let userVote: number | undefined;
      if (currentUserId) {
        const vote = await this.prisma.vote.findUnique({
          where: {
            gardenerId_targetType_targetId: {
              gardenerId: currentUserId,
              targetType: 'POST',
              targetId: id,
            },
          },
        });
        userVote = vote?.voteValue;
      }

      // Map kết quả sang DTO
      const postDto = this.mapToPostDto(post, userVote);

      // Thêm thông tin images, tags và comments
      postDto.images = post.images.map((img) => ({
        id: img.id,
        postId: img.postId,
        url: img.url,
      }));

      postDto.tags = post.tags.map((pt) => ({
        id: pt.tag.id,
        name: pt.tag.name,
      }));

      postDto.comments = post.comments.map((comment) => ({
        id: comment.id,
        postId: comment.postId,
        gardenerId: comment.gardenerId,
        gardenerName: `${comment.gardener.user.firstName} ${comment.gardener.user.lastName}`,
        content: comment.content,
        score: comment.score,
        createdAt: comment.createdAt,
        updatedAt: comment.updatedAt,
        replies: comment.replies.map((reply) => ({
          id: reply.id,
          gardenerId: reply.gardenerId,
          gardenerName: `${reply.gardener.user.firstName} ${reply.gardener.user.lastName}`,
          content: reply.content,
          score: reply.score,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
        })),
      }));

      return postDto;
    } catch (error) {
      this.logger.error(
        `Error finding post ${id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(`Không thể lấy thông tin bài viết`);
    }
  }

  async update(
    id: number,
    gardenerId: number,
    updatePostDto: UpdatePostDto,
  ): Promise<PostDto> {
    try {
      // Kiểm tra bài viết tồn tại và thuộc về người dùng
      const post = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
      }

      if (post.gardenerId !== gardenerId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật bài viết này',
        );
      }

      // Tạo transaction để đảm bảo tính nhất quán khi cập nhật
      return await this.prisma.$transaction(async (tx) => {
        // Cập nhật bài viết
        const updatedPost = await tx.post.update({
          where: { id },
          data: {
            title: updatePostDto.title,
            content: updatePostDto.content,
            gardenId: updatePostDto.gardenId,
            plantName: updatePostDto.plantName,
            plantGrowStage: updatePostDto.plantGrowStage,
          },
        });

        // Nếu có tagIds, cập nhật các liên kết PostTag
        if (updatePostDto.tagIds) {
          // Xóa tất cả liên kết cũ
          await tx.postTag.deleteMany({
            where: { postId: id },
          });

          // Thêm liên kết mới
          if (updatePostDto.tagIds.length > 0) {
            // Kiểm tra xem tất cả tags có tồn tại không
            const tagCount = await tx.tag.count({
              where: {
                id: {
                  in: updatePostDto.tagIds,
                },
              },
            });

            if (tagCount !== updatePostDto.tagIds.length) {
              throw new BadRequestException('Một hoặc nhiều tag không tồn tại');
            }

            // Thêm liên kết PostTag
            await Promise.all(
              updatePostDto.tagIds.map((tagId) =>
                tx.postTag.create({
                  data: {
                    postId: id,
                    tagId: tagId,
                  },
                }),
              ),
            );
          }
        }

        // Nếu có imageUrls, cập nhật các liên kết PostImage
        if (updatePostDto.imageUrls) {
          // Xóa tất cả liên kết cũ
          await tx.postImage.deleteMany({
            where: { postId: id },
          });

          // Thêm liên kết mới
          if (updatePostDto.imageUrls.length > 0) {
            await Promise.all(
              updatePostDto.imageUrls.map((url) =>
                tx.postImage.create({
                  data: {
                    postId: id,
                    url: url,
                  },
                }),
              ),
            );
          }
        }

        this.logger.log(`Post updated by gardener ${gardenerId}: ${id}`);
        return this.mapToPostDto(updatedPost);
      });
    } catch (error) {
      this.logger.error(
        `Error updating post ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể cập nhật bài viết');
    }
  }

  async remove(id: number, gardenerId: number): Promise<void> {
    try {
      // Kiểm tra bài viết tồn tại và thuộc về người dùng
      const post = await this.prisma.post.findUnique({
        where: { id },
      });

      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID ${id}`);
      }

      if (post.gardenerId !== gardenerId) {
        throw new ForbiddenException('Bạn không có quyền xóa bài viết này');
      }

      // Xóa bài viết (các liên kết sẽ tự động bị xóa nhờ vào cascade delete trong Prisma)
      await this.prisma.post.delete({
        where: { id },
      });

      this.logger.log(`Post deleted by gardener ${gardenerId}: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting post ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa bài viết');
    }
  }
}
