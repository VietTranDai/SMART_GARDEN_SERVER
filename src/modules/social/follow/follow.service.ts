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

  // Theo dõi (follow)
  async follow(
    followerId: number,
    createFollowDto: CreateFollowDto,
  ): Promise<FollowDto> {
    const followedId = createFollowDto.followedId;

    // Kiểm tra followed có tồn tại không
    const followed = await this.prisma.gardener.findUnique({
      where: { userId: followedId },
    });
    if (!followed) {
      throw new NotFoundException(
        `Không tìm thấy người làm vườn với ID ${followedId}`,
      );
    }

    if (followerId === followedId) {
      throw new BadRequestException('Không thể tự theo dõi chính mình');
    }

    // Kiểm tra đã follow chưa
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followedId: { followerId, followedId },
      },
    });
    if (existing) {
      throw new ConflictException('Bạn đã theo dõi người này rồi');
    }

    const follow = await this.prisma.follow.create({
      data: { followerId, followedId },
    });

    this.logger.log(`Gardener ${followerId} followed gardener ${followedId}`);

    return {
      followerId: follow.followerId,
      followedId: follow.followedId,
      createdAt: follow.createdAt,
    };
  }

  // Hủy theo dõi (unfollow)
  async unfollow(followerId: number, followedId: number): Promise<void> {
    const existing = await this.prisma.follow.findUnique({
      where: {
        followerId_followedId: { followerId, followedId },
      },
    });
    if (!existing) {
      throw new NotFoundException('Bạn chưa theo dõi người này');
    }

    await this.prisma.follow.delete({
      where: {
        followerId_followedId: { followerId, followedId },
      },
    });

    this.logger.log(`Gardener ${followerId} unfollowed gardener ${followedId}`);
  }

  // // Lấy danh sách followers của một gardener
  // async getFollowers(
  //   gardenerId: number,
  //   page = 1,
  //   limit = 10,
  // ): Promise<FollowerListDto> {
  //   const gardener = await this.prisma.gardener.findUnique({
  //     where: { userId: gardenerId },
  //   });
  //   if (!gardener) {
  //     throw new NotFoundException(
  //       `Không tìm thấy người làm vườn với ID ${gardenerId}`,
  //     );
  //   }

  //   const skip = (page - 1) * limit;
  //   const total = await this.prisma.follow.count({
  //     where: { followedId: gardenerId },
  //   });

  //   const follows = await this.prisma.follow.findMany({
  //     where: { followedId: gardenerId },
  //     orderBy: { createdAt: 'desc' },
  //     skip,
  //     take: limit,
  //     include: {
  //       follower: {
  //         include: { user: true },
  //       },
  //     },
  //   });

  //   const followers: GardenerDto[] = follows.map((f) => ({
  //     id: f.followerId,
  //     name: `${f.follower.user.firstName} ${f.follower.user.lastName}`,
  //     avatarUrl: f.follower.user.avatarUrl,
  //     email: f.follower.user.email,
  //     username: f.follower.user.username,
  //     experiencePoints: f.follower.experiencePoints,
  //     experienceLevel: f.follower.experienceLevel,
  //     createdAt: f.follower.createdAt,
  //   }));

  //   return { followers, total, page, limit };
  // }

  // // Lấy danh sách những người mà gardener đang follow
  // async getFollowing(
  //   gardenerId: number,
  //   page = 1,
  //   limit = 10,
  // ): Promise<FollowingListDto> {
  //   const gardener = await this.prisma.gardener.findUnique({
  //     where: { userId: gardenerId },
  //   });
  //   if (!gardener) {
  //     throw new NotFoundException(
  //       `Không tìm thấy người làm vườn với ID ${gardenerId}`,
  //     );
  //   }

  //   const skip = (page - 1) * limit;
  //   const total = await this.prisma.follow.count({
  //     where: { followerId: gardenerId },
  //   });

  //   const follows = await this.prisma.follow.findMany({
  //     where: { followerId: gardenerId },
  //     orderBy: { createdAt: 'desc' },
  //     skip,
  //     take: limit,
  //     include: {
  //       followed: {
  //         include: { user: true },
  //       },
  //     },
  //   });

  //   const following: GardenerDto[] = follows.map((f) => ({
  //     id: f.followedId,
  //     name: `${f.followed.user.firstName} ${f.followed.user.lastName}`,
  //     avatarUrl: f.followed.user.avatarUrl,
  //   }));

  //   return { following, total, page, limit };
  // }

  // Kiểm tra trạng thái follow
  async checkFollowStatus(
    followerId: number,
    followedId: number,
  ): Promise<boolean> {
    const f = await this.prisma.follow.findUnique({
      where: {
        followerId_followedId: { followerId, followedId },
      },
    });
    return !!f;
  }
}
