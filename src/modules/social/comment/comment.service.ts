import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { Comment, Prisma } from '@prisma/client';
import { CreateCommentDto } from './dto/create-comment.dto';
import { UpdateCommentDto } from './dto/update-comment.dto';
import {
  CommentDto,
  CommentPaginationDto,
  CommentReplyDto,
} from './dto/comment.dto';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private readonly prisma: PrismaService) {}

  private mapToCommentDto(
    comment: Comment & {
      gardener: { user: { firstName: string; lastName: string } };
      replies?: (Comment & {
        gardener: { user: { firstName: string; lastName: string } };
      })[];
    },
    userVote?: number,
  ): CommentDto {
    const commentDto: CommentDto = {
      id: comment.id,
      postId: comment.postId,
      parentId: comment.parentId || undefined,
      gardenerId: comment.gardenerId,
      gardenerName: `${comment.gardener.user.firstName} ${comment.gardener.user.lastName}`,
      content: comment.content,
      score: comment.score,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      userVote: userVote,
    };

    if (comment.replies) {
      commentDto.replies = comment.replies.map((reply) => ({
        id: reply.id,
        gardenerId: reply.gardenerId,
        gardenerName: `${reply.gardener.user.firstName} ${reply.gardener.user.lastName}`,
        content: reply.content,
        score: reply.score,
        createdAt: reply.createdAt,
        updatedAt: reply.updatedAt,
      }));
    }

    return commentDto;
  }

  async create(
    gardenerId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<CommentDto> {
    try {
      // Kiểm tra postId có tồn tại
      const post = await this.prisma.post.findUnique({
        where: { id: createCommentDto.postId },
      });

      if (!post) {
        throw new NotFoundException(
          `Không tìm thấy bài viết với ID ${createCommentDto.postId}`,
        );
      }

      // Nếu có parentId, kiểm tra parentId có tồn tại và thuộc về postId
      if (createCommentDto.parentId) {
        const parentComment = await this.prisma.comment.findUnique({
          where: { id: createCommentDto.parentId },
        });

        if (!parentComment) {
          throw new NotFoundException(
            `Không tìm thấy bình luận cha với ID ${createCommentDto.parentId}`,
          );
        }

        if (parentComment.postId !== createCommentDto.postId) {
          throw new BadRequestException(
            'Bình luận cha không thuộc về bài viết này',
          );
        }

        if (parentComment.parentId) {
          throw new BadRequestException(
            'Không thể trả lời cho một trả lời (chỉ có thể trả lời cho bình luận gốc)',
          );
        }
      }

      // Tạo bình luận
      const comment = await this.prisma.comment.create({
        data: {
          postId: createCommentDto.postId,
          parentId: createCommentDto.parentId,
          gardenerId: gardenerId,
          content: createCommentDto.content,
          score: 0,
        },
        include: {
          gardener: {
            include: {
              user: true,
            },
          },
        },
      });

      this.logger.log(
        `Comment created by gardener ${gardenerId}: ${comment.id}`,
      );
      return this.mapToCommentDto(comment);
    } catch (error) {
      this.logger.error(
        `Error creating comment: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo bình luận');
    }
  }

  async findAllByPost(
    postId: number,
    page = 1,
    limit = 10,
    currentUserId?: number,
  ): Promise<CommentPaginationDto> {
    try {
      // Kiểm tra postId có tồn tại
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID ${postId}`);
      }

      const skip = (page - 1) * limit;

      // Lấy tổng số bình luận gốc (không có parentId)
      const total = await this.prisma.comment.count({
        where: {
          postId,
          parentId: null,
        },
      });

      // Lấy danh sách bình luận gốc và 5 trả lời cho mỗi bình luận
      const comments = await this.prisma.comment.findMany({
        where: {
          postId,
          parentId: null,
        },
        orderBy: { score: 'desc' },
        skip,
        take: limit,
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
      });

      // Nếu có currentUserId, lấy thông tin vote của người dùng cho từng bình luận
      let userVotes: Record<number, number> = {};
      if (currentUserId) {
        // Lấy tất cả ID của bình luận gốc và trả lời
        const commentIds = comments.reduce((ids, comment) => {
          ids.push(comment.id);
          comment.replies.forEach((reply) => ids.push(reply.id));
          return ids;
        }, [] as number[]);

        const votes = await this.prisma.vote.findMany({
          where: {
            gardenerId: currentUserId,
            targetType: 'COMMENT',
            targetId: {
              in: commentIds,
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
      const items = comments.map((comment) =>
        this.mapToCommentDto(comment, userVotes[comment.id]),
      );

      return {
        items,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Error finding comments for post ${postId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách bình luận');
    }
  }

  async findReplies(
    commentId: number,
    page = 1,
    limit = 10,
    currentUserId?: number,
  ): Promise<CommentPaginationDto> {
    try {
      // Kiểm tra commentId có tồn tại
      const comment = await this.prisma.comment.findUnique({
        where: { id: commentId },
      });

      if (!comment) {
        throw new NotFoundException(
          `Không tìm thấy bình luận với ID ${commentId}`,
        );
      }

      if (comment.parentId !== null) {
        throw new BadRequestException(
          'Chỉ có thể lấy danh sách trả lời cho bình luận gốc',
        );
      }

      const skip = (page - 1) * limit;

      // Lấy tổng số trả lời
      const total = await this.prisma.comment.count({
        where: {
          parentId: commentId,
        },
      });

      // Lấy danh sách trả lời
      const replies = await this.prisma.comment.findMany({
        where: {
          parentId: commentId,
        },
        orderBy: { createdAt: 'asc' },
        skip,
        take: limit,
        include: {
          gardener: {
            include: {
              user: true,
            },
          },
        },
      });

      // Nếu có currentUserId, lấy thông tin vote của người dùng cho từng trả lời
      let userVotes: Record<number, number> = {};
      if (currentUserId) {
        const votes = await this.prisma.vote.findMany({
          where: {
            gardenerId: currentUserId,
            targetType: 'COMMENT',
            targetId: {
              in: replies.map((reply) => reply.id),
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
      const items = replies.map((reply) => {
        return {
          id: reply.id,
          postId: reply.postId,
          parentId: reply.parentId,
          gardenerId: reply.gardenerId,
          gardenerName: `${reply.gardener.user.firstName} ${reply.gardener.user.lastName}`,
          content: reply.content,
          score: reply.score,
          createdAt: reply.createdAt,
          updatedAt: reply.updatedAt,
          userVote: userVotes[reply.id],
        };
      });

      return {
        items,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Error finding replies for comment ${commentId}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách trả lời');
    }
  }

  async findOne(id: number, currentUserId?: number): Promise<CommentDto> {
    try {
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          gardener: {
            include: {
              user: true,
            },
          },
          replies:
            comment.parentId === null
              ? {
                  orderBy: { createdAt: 'asc' },
                  take: 5,
                  include: {
                    gardener: {
                      include: {
                        user: true,
                      },
                    },
                  },
                }
              : undefined,
        },
      });

      if (!comment) {
        throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
      }

      // Nếu có currentUserId, lấy thông tin vote của người dùng
      let userVote: number | undefined;
      if (currentUserId) {
        const vote = await this.prisma.vote.findUnique({
          where: {
            gardenerId_targetType_targetId: {
              gardenerId: currentUserId,
              targetType: 'COMMENT',
              targetId: id,
            },
          },
        });
        userVote = vote?.voteValue;
      }

      return this.mapToCommentDto(comment, userVote);
    } catch (error) {
      this.logger.error(
        `Error finding comment ${id}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy thông tin bình luận');
    }
  }

  async update(
    id: number,
    gardenerId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<CommentDto> {
    try {
      // Kiểm tra bình luận tồn tại và thuộc về người dùng
      const comment = await this.prisma.comment.findUnique({
        where: { id },
        include: {
          gardener: {
            include: {
              user: true,
            },
          },
        },
      });

      if (!comment) {
        throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
      }

      if (comment.gardenerId !== gardenerId) {
        throw new ForbiddenException(
          'Bạn không có quyền cập nhật bình luận này',
        );
      }

      // Cập nhật bình luận
      const updatedComment = await this.prisma.comment.update({
        where: { id },
        data: {
          content: updateCommentDto.content,
        },
        include: {
          gardener: {
            include: {
              user: true,
            },
          },
        },
      });

      this.logger.log(`Comment updated by gardener ${gardenerId}: ${id}`);
      return this.mapToCommentDto(updatedComment);
    } catch (error) {
      this.logger.error(
        `Error updating comment ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể cập nhật bình luận');
    }
  }

  async remove(id: number, gardenerId: number): Promise<void> {
    try {
      // Kiểm tra bình luận tồn tại và thuộc về người dùng
      const comment = await this.prisma.comment.findUnique({
        where: { id },
      });

      if (!comment) {
        throw new NotFoundException(`Không tìm thấy bình luận với ID ${id}`);
      }

      if (comment.gardenerId !== gardenerId) {
        throw new ForbiddenException('Bạn không có quyền xóa bình luận này');
      }

      // Xóa bình luận
      await this.prisma.comment.delete({
        where: { id },
      });

      this.logger.log(`Comment deleted by gardener ${gardenerId}: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting comment ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa bình luận');
    }
  }
}
