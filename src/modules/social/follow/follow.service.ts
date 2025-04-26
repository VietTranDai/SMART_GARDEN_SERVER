import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreateFollowDto } from './dto/create-follow.dto';
import {
  FollowDto,
  FollowerListDto,
  FollowingListDto,
  GardenerDto,
} from './dto/follow.dto';

@Injectable()
export class FollowService {
  private readonly logger = new Logger(FollowService.name);

  constructor(private readonly prisma: PrismaService) {}

  async follow(
    followerId: number,
    createFollowDto: CreateFollowDto,
  ): Promise<FollowDto> {
    try {
      // Kiểm tra xem người được theo dõi có tồn tại không
      const followedGardener = await this.prisma.gardener.findUnique({
        where: { id: createFollowDto.followedId },
      });

      if (!followedGardener) {
        throw new NotFoundException(
          `Không tìm thấy người làm vườn với ID ${createFollowDto.followedId}`,
        );
      }

      // Không thể tự theo dõi chính mình
      if (followerId === createFollowDto.followedId) {
        throw new BadRequestException('Không thể tự theo dõi chính mình');
      }

      // Kiểm tra xem đã theo dõi người này chưa
      const existingFollow = await this.prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId,
            followedId: createFollowDto.followedId,
          },
        },
      });

      if (existingFollow) {
        throw new ConflictException('Bạn đã theo dõi người này rồi');
      }

      // Tạo mối quan hệ theo dõi mới
      const follow = await this.prisma.follow.create({
        data: {
          followerId,
          followedId: createFollowDto.followedId,
        },
      });

      this.logger.log(
        `Gardener ${followerId} followed gardener ${createFollowDto.followedId}`,
      );

      return {
        followerId: follow.followerId,
        followedId: follow.followedId,
        createdAt: follow.createdAt,
      };
    } catch (error) {
      this.logger.error(
        `Error following gardener: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể theo dõi người làm vườn này');
    }
  }

  async unfollow(followerId: number, followedId: number): Promise<void> {
    try {
      // Kiểm tra xem mối quan hệ theo dõi có tồn tại không
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId,
            followedId,
          },
        },
      });

      if (!follow) {
        throw new NotFoundException('Bạn chưa theo dõi người này');
      }

      // Xóa mối quan hệ theo dõi
      await this.prisma.follow.delete({
        where: {
          followerId_followedId: {
            followerId,
            followedId,
          },
        },
      });

      this.logger.log(
        `Gardener ${followerId} unfollowed gardener ${followedId}`,
      );
    } catch (error) {
      this.logger.error(
        `Error unfollowing gardener: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Không thể hủy theo dõi người làm vườn này',
      );
    }
  }

  async getFollowers(
    gardenerId: number,
    page = 1,
    limit = 10,
  ): Promise<FollowerListDto> {
    try {
      // Kiểm tra xem người làm vườn có tồn tại không
      const gardener = await this.prisma.gardener.findUnique({
        where: { id: gardenerId },
      });

      if (!gardener) {
        throw new NotFoundException(
          `Không tìm thấy người làm vườn với ID ${gardenerId}`,
        );
      }

      const skip = (page - 1) * limit;

      // Đếm tổng số người theo dõi
      const total = await this.prisma.follow.count({
        where: { followedId: gardenerId },
      });

      // Lấy danh sách người theo dõi
      const follows = await this.prisma.follow.findMany({
        where: { followedId: gardenerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          follower: {
            include: {
              user: true,
            },
          },
        },
      });

      // Chuyển đổi thành DTO
      const followers: GardenerDto[] = follows.map((follow) => ({
        id: follow.follower.id,
        name: `${follow.follower.user.firstName} ${follow.follower.user.lastName}`,
        avatarUrl: follow.follower.user.avatarUrl,
      }));

      return {
        followers,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Error getting followers for gardener ${gardenerId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách người theo dõi');
    }
  }

  async getFollowing(
    gardenerId: number,
    page = 1,
    limit = 10,
  ): Promise<FollowingListDto> {
    try {
      // Kiểm tra xem người làm vườn có tồn tại không
      const gardener = await this.prisma.gardener.findUnique({
        where: { id: gardenerId },
      });

      if (!gardener) {
        throw new NotFoundException(
          `Không tìm thấy người làm vườn với ID ${gardenerId}`,
        );
      }

      const skip = (page - 1) * limit;

      // Đếm tổng số người đang theo dõi
      const total = await this.prisma.follow.count({
        where: { followerId: gardenerId },
      });

      // Lấy danh sách người đang theo dõi
      const follows = await this.prisma.follow.findMany({
        where: { followerId: gardenerId },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          followed: {
            include: {
              user: true,
            },
          },
        },
      });

      // Chuyển đổi thành DTO
      const following: GardenerDto[] = follows.map((follow) => ({
        id: follow.followed.id,
        name: `${follow.followed.user.firstName} ${follow.followed.user.lastName}`,
        avatarUrl: follow.followed.user.avatarUrl,
      }));

      return {
        following,
        total,
        page,
        limit,
      };
    } catch (error) {
      this.logger.error(
        `Error getting following for gardener ${gardenerId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        'Không thể lấy danh sách người đang theo dõi',
      );
    }
  }

  async checkFollowStatus(
    followerId: number,
    followedId: number,
  ): Promise<boolean> {
    try {
      const follow = await this.prisma.follow.findUnique({
        where: {
          followerId_followedId: {
            followerId,
            followedId,
          },
        },
      });

      return !!follow;
    } catch (error) {
      this.logger.error(
        `Error checking follow status: ${error.message}`,
        error.stack,
      );
      throw new BadRequestException('Không thể kiểm tra trạng thái theo dõi');
    }
  }
}
