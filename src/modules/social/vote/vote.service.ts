import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateVoteDto } from './dto/create-vote.dto';
import { VoteDto } from './dto/vote.dto';
import { VoteTargetType } from '@prisma/client';

@Injectable()
export class VoteService {
  private readonly logger = new Logger(VoteService.name);

  constructor(private readonly prisma: PrismaService) {}

  async vote(
    gardenerId: number,
    createVoteDto: CreateVoteDto,
  ): Promise<VoteDto> {
    try {
      // Kiểm tra target có tồn tại không
      if (createVoteDto.targetType === VoteTargetType.POST) {
        const post = await this.prisma.post.findUnique({
          where: { id: createVoteDto.targetId },
        });

        if (!post) {
          throw new NotFoundException(
            `Không tìm thấy bài viết với ID ${createVoteDto.targetId}`,
          );
        }
      } else if (createVoteDto.targetType === VoteTargetType.COMMENT) {
        const comment = await this.prisma.comment.findUnique({
          where: { id: createVoteDto.targetId },
        });

        if (!comment) {
          throw new NotFoundException(
            `Không tìm thấy bình luận với ID ${createVoteDto.targetId}`,
          );
        }
      }

      // Kiểm tra xem đã vote chưa
      const existingVote = await this.prisma.vote.findUnique({
        where: {
          gardenerId_targetType_targetId: {
            gardenerId,
            targetType: createVoteDto.targetType,
            targetId: createVoteDto.targetId,
          },
        },
      });

      // Sử dụng transaction để đảm bảo tính nhất quán
      return await this.prisma.$transaction(async (tx) => {
        // Cập nhật total_vote của target
        if (createVoteDto.targetType === VoteTargetType.POST) {
          // Nếu đã vote thì cập nhật total_vote tương ứng
          if (existingVote) {
            // Nếu vote mới giống vote cũ thì hủy vote (xóa vote và trừ điểm)
            if (existingVote.voteValue === createVoteDto.voteValue) {
              await tx.post.update({
                where: { id: createVoteDto.targetId },
                data: { total_vote: { decrement: existingVote.voteValue } },
              });

              await tx.vote.delete({
                where: {
                  gardenerId_targetType_targetId: {
                    gardenerId,
                    targetType: createVoteDto.targetType,
                    targetId: createVoteDto.targetId,
                  },
                },
              });

              this.logger.log(
                `Vote removed for post ${createVoteDto.targetId} by gardener ${gardenerId}`,
              );

              return {
                gardenerId,
                targetType: createVoteDto.targetType,
                targetId: createVoteDto.targetId,
                voteValue: 0,
              };
            } else {
              // Nếu vote mới khác vote cũ thì cập nhật vote và điểm
              // (trừ giá trị cũ, cộng giá trị mới)
              await tx.post.update({
                where: { id: createVoteDto.targetId },
                data: {
                  total_vote: {
                    decrement: existingVote.voteValue,
                    increment: createVoteDto.voteValue,
                  },
                },
              });

              const updatedVote = await tx.vote.update({
                where: {
                  gardenerId_targetType_targetId: {
                    gardenerId,
                    targetType: createVoteDto.targetType,
                    targetId: createVoteDto.targetId,
                  },
                },
                data: { voteValue: createVoteDto.voteValue },
              });

              this.logger.log(
                `Vote updated for post ${createVoteDto.targetId} by gardener ${gardenerId}: ${updatedVote.voteValue}`,
              );

              return {
                gardenerId: updatedVote.gardenerId,
                targetType: updatedVote.targetType,
                targetId: updatedVote.targetId,
                voteValue: updatedVote.voteValue,
              };
            }
          } else {
            // Nếu chưa vote thì tạo vote mới và cộng điểm
            await tx.post.update({
              where: { id: createVoteDto.targetId },
              data: { total_vote: { increment: createVoteDto.voteValue } },
            });

            const newVote = await tx.vote.create({
              data: {
                gardenerId,
                targetType: createVoteDto.targetType,
                targetId: createVoteDto.targetId,
                voteValue: createVoteDto.voteValue,
              },
            });

            this.logger.log(
              `Vote created for post ${createVoteDto.targetId} by gardener ${gardenerId}: ${newVote.voteValue}`,
            );

            return {
              gardenerId: newVote.gardenerId,
              targetType: newVote.targetType,
              targetId: newVote.targetId,
              voteValue: newVote.voteValue,
            };
          }
        } else {
          // Xử lý tương tự cho comment
          if (existingVote) {
            if (existingVote.voteValue === createVoteDto.voteValue) {
              await tx.comment.update({
                where: { id: createVoteDto.targetId },
                data: { score: { decrement: existingVote.voteValue } },
              });

              await tx.vote.delete({
                where: {
                  gardenerId_targetType_targetId: {
                    gardenerId,
                    targetType: createVoteDto.targetType,
                    targetId: createVoteDto.targetId,
                  },
                },
              });

              this.logger.log(
                `Vote removed for comment ${createVoteDto.targetId} by gardener ${gardenerId}`,
              );

              return {
                gardenerId,
                targetType: createVoteDto.targetType,
                targetId: createVoteDto.targetId,
                voteValue: 0,
              };
            } else {
              await tx.comment.update({
                where: { id: createVoteDto.targetId },
                data: {
                  score: {
                    decrement: existingVote.voteValue,
                    increment: createVoteDto.voteValue,
                  },
                },
              });

              const updatedVote = await tx.vote.update({
                where: {
                  gardenerId_targetType_targetId: {
                    gardenerId,
                    targetType: createVoteDto.targetType,
                    targetId: createVoteDto.targetId,
                  },
                },
                data: { voteValue: createVoteDto.voteValue },
              });

              this.logger.log(
                `Vote updated for comment ${createVoteDto.targetId} by gardener ${gardenerId}: ${updatedVote.voteValue}`,
              );

              return {
                gardenerId: updatedVote.gardenerId,
                targetType: updatedVote.targetType,
                targetId: updatedVote.targetId,
                voteValue: updatedVote.voteValue,
              };
            }
          } else {
            await tx.comment.update({
              where: { id: createVoteDto.targetId },
              data: { score: { increment: createVoteDto.voteValue } },
            });

            const newVote = await tx.vote.create({
              data: {
                gardenerId,
                targetType: createVoteDto.targetType,
                targetId: createVoteDto.targetId,
                voteValue: createVoteDto.voteValue,
              },
            });

            this.logger.log(
              `Vote created for comment ${createVoteDto.targetId} by gardener ${gardenerId}: ${newVote.voteValue}`,
            );

            return {
              gardenerId: newVote.gardenerId,
              targetType: newVote.targetType,
              targetId: newVote.targetId,
              voteValue: newVote.voteValue,
            };
          }
        }
      });
    } catch (error) {
      this.logger.error(`Error voting: ${error.message}`, error.stack);
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể thực hiện bình chọn');
    }
  }
}
