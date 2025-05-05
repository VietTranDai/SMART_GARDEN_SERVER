// src/modules/social/post/post.service.ts
import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../../../prisma/prisma.service';
import { CreatePostDto } from './dto/create-post.dto';
import { PostDto, mapToPostDto } from './dto/post.dto';

@Injectable()
export class PostService {
  constructor(private readonly prisma: PrismaService) {}

  /** Lấy danh sách bài viết, phân tách query theo model */
  async getPosts(query: any): Promise<PostDto[]> {
    const { tag, search, gardenerId, plantName, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // 1) Fetch phần cơ bản của posts
    const posts = await this.prisma.post.findMany({
      where: {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(gardenerId && { gardenerId: Number(gardenerId) }),
        ...(plantName && { plantName: { contains: plantName, mode: 'insensitive' } }),
        ...(tag && {
          tags: { some: { tag: { name: tag } } },
        }),
      },
      skip,
      take: Number(limit),
      orderBy: { createdAt: 'desc' },
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

    const postIds = posts.map(p => p.id);
    const gardenerIds = Array.from(new Set(posts.map(p => p.gardenerId)));

    // 2) Fetch các quan hệ riêng
    const [postTags, images, comments, gardeners] = await Promise.all([
      this.prisma.postTag.findMany({
        where: { postId: { in: postIds } },
        include: { tag: true },
      }),
      this.prisma.postImage.findMany({
        where: { postId: { in: postIds } },
      }),
      this.prisma.comment.findMany({
        where: { postId: { in: postIds } },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.gardener.findMany({
        where: { userId: { in: gardenerIds } },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              gardener: { select: { experienceLevel: true } },
            },
          },
        },
      }),
    ]);

    // 3) Group thành map để dễ lookup
    const tagsMap = new Map<number, typeof postTags[0]['tag'][]>();
    const imagesMap = new Map<number, typeof images[0][]>();
    const commentsMap = new Map<number, typeof comments[0][]>();
    const gardenerUserMap = new Map<number, typeof gardeners[0]['user']>();

    for (const id of postIds) {
      tagsMap.set(id, []);
      imagesMap.set(id, []);
      commentsMap.set(id, []);
    }
    postTags.forEach(pt => tagsMap.get(pt.postId)!.push(pt.tag));
    images.forEach(img => imagesMap.get(img.postId)!.push(img));
    comments.forEach(c => commentsMap.get(c.postId)!.push(c));
    gardeners.forEach(g => gardenerUserMap.set(g.user.id, g.user));

    // 4) Build DTO
    return posts.map(post =>
      mapToPostDto(
        post,
        tagsMap.get(post.id)!,
        imagesMap.get(post.id)!,
        commentsMap.get(post.id)!,
        gardenerUserMap.get(post.gardenerId)!,
        undefined, // userVote: nếu cần, có thể thêm param currentUserId và fetch vote riêng
      ),
    );
  }

  /** Lấy chi tiết một bài viết */
  async getPostById(id: number): Promise<PostDto> {
    // 1) Fetch cơ bản
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

    // 2) Fetch quan hệ
    const [postTags, images, comments, gardener] = await Promise.all([
      this.prisma.postTag.findMany({
        where: { postId: id },
        include: { tag: true },
      }),
      this.prisma.postImage.findMany({ where: { postId: id } }),
      this.prisma.comment.findMany({
        where: { postId: id },
        orderBy: { createdAt: 'asc' },
      }),
      this.prisma.gardener.findUnique({
        where: { userId: post.gardenerId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              gardener: { select: { experienceLevel: true } },
            },
          },
        },
      }),
    ]);
    if (!gardener) throw new NotFoundException('Gardener not found');

    return mapToPostDto(
      post,
      postTags.map(r => r.tag),
      images,
      comments,
      gardener.user,
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

    // 1) Tạo post
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

    // 2) Tạo PostTag & PostImage nếu có
    if (tagIds?.length) {
      await this.prisma.postTag.createMany({
        data: tagIds.map(tid => ({
          postId: post.id,
          tagId: Number(tid),
        })),
      });
    }
    if (files?.length) {
      await this.prisma.postImage.createMany({
        data: files.map(f => ({
          postId: post.id,
          url: `/uploads/${f.filename}`,
        })),
      });
    }

    // 3) Fetch lại quan hệ
    const [postTags, images, comments, gardener] = await Promise.all([
      this.prisma.postTag.findMany({ where: { postId: post.id }, include: { tag: true } }),
      this.prisma.postImage.findMany({ where: { postId: post.id } }),
      this.prisma.comment.findMany({ where: { postId: post.id }, orderBy: { createdAt: 'asc' } }),
      this.prisma.gardener.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              gardener: { select: { experienceLevel: true } },
            },
          },
        },
      }),
    ]);

    return mapToPostDto(
      post,
      postTags.map(r => r.tag),
      images,
      comments,
      gardener!.user,
      undefined,
    );
  }

  /** Cập nhật bài viết */
  async updatePost(
    userId: number,
    id: number,
    data: Partial<CreatePostDto>,
  ): Promise<PostDto> {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.gardenerId !== userId) throw new ForbiddenException('Unauthorized');

    // 1) Cập nhật cơ bản
    const post = await this.prisma.post.update({
      where: { id },
      data,
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

    // 2) Fetch lại quan hệ
    const [postTags, images, comments, gardener] = await Promise.all([
      this.prisma.postTag.findMany({ where: { postId: id }, include: { tag: true } }),
      this.prisma.postImage.findMany({ where: { postId: id } }),
      this.prisma.comment.findMany({ where: { postId: id }, orderBy: { createdAt: 'asc' } }),
      this.prisma.gardener.findUnique({
        where: { userId },
        include: {
          user: {
            select: {
              id: true,
              username: true,
              firstName: true,
              lastName: true,
              profilePicture: true,
              gardener: { select: { experienceLevel: true } },
            },
          },
        },
      }),
    ]);

    return mapToPostDto(
      post,
      postTags.map(r => r.tag),
      images,
      comments,
      gardener!.user,
      undefined,
    );
  }

  /** Xóa bài viết */
  async deletePost(userId: number, id: number): Promise<void> {
    const existing = await this.prisma.post.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException('Post not found');
    if (existing.gardenerId !== userId) throw new ForbiddenException('Unauthorized');
    await this.prisma.post.delete({ where: { id } });
  }

  /** Lấy riêng comments theo postId */
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
                gardener: { select: { experienceLevel: true } },
              },
            },
          },
        },
      },
    });
  }
}
