import { Injectable, NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';

@Injectable()
export class CommentService {
  constructor(private readonly prisma: PrismaService) {}

  /**
   * Lấy tất cả comments cha cho một post, kèm replies và userVote
   */
  async getPostComments(postId: number): Promise<any[]> {
    const comments = await this.prisma.comment.findMany({
      where: { postId, parentId: null },
      orderBy: { createdAt: 'asc' },
      include: {
        gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } } },
        },
      },
    });
    return Promise.all(comments.map(c => this.attachUserVote(c)));
  }

  /**
   * Tạo comment hoặc reply
   */
  async createComment(
    gardenerId: number,
    postId: number,
    content: string,
    parentId?: number,
  ): Promise<any> {
    const comment = await this.prisma.comment.create({
      data: { gardenerId, postId, content, parentId },
      include: {
        gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } },
      },
    });
    return this.attachUserVote(comment);
  }

  /**
   * Lấy chi tiết comment theo ID
   */
  async getCommentById(id: number): Promise<any> {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
      include: {
        gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } },
        replies: {
          orderBy: { createdAt: 'asc' },
          include: { gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } } },
        },
      },
    });
    if (!comment) throw new NotFoundException('Comment not found');
    return this.attachUserVote(comment);
  }

  /**
   * Lấy replies cho một comment
   */
  async getCommentReplies(commentId: number): Promise<any[]> {
    const replies = await this.prisma.comment.findMany({
      where: { parentId: commentId },
      orderBy: { createdAt: 'asc' },
      include: { gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } } },
    });
    return Promise.all(replies.map(r => this.attachUserVote(r)));
  }

  /**
   * Cập nhật nội dung comment
   */
  async updateComment(
    gardenerId: number,
    id: number,
    content: string,
  ): Promise<any> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.gardenerId !== gardenerId) throw new ForbiddenException('Unauthorized');

    const updated = await this.prisma.comment.update({
      where: { id },
      data: { content },
      include: { gardener: { include: { user: { include: { gardener: { include: { experienceLevel: true } } } } } } },
    });
    return this.attachUserVote(updated);
  }

  /**
   * Xóa comment
   */
  async deleteComment(gardenerId: number, id: number): Promise<void> {
    const existing = await this.prisma.comment.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Comment not found');
    if (existing.gardenerId !== gardenerId) throw new ForbiddenException('Unauthorized');
    await this.prisma.comment.delete({ where: { id } });
  }

  /**
   * Đính kèm userVote cho comment object
   */
  private async attachUserVote(comment: any): Promise<any> {
    const vote = await this.prisma.vote.findUnique({
      where: {
        gardenerId_targetType_targetId: {
          gardenerId: comment.gardenerId,
          targetType: 'COMMENT',
          targetId: comment.id,
        },
      },
      select: { voteValue: true },
    });
    comment.userVote = vote?.voteValue ?? 0;
    return comment;
  }
}
