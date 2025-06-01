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

  /** Lấy danh sách bài viết, phân tách query theo model */
  async getPosts(query: any): Promise<PostDto[]> {
    const { tag, search, gardenerId, plantName, page = 1, limit = 10 } = query;
    const skip = (page - 1) * limit;

    // 1) Fetch phần cơ bản của posts
    const posts = await this.prisma.post.findMany({
      where: {
        ...(search && { title: { contains: search, mode: 'insensitive' } }),
        ...(gardenerId && { gardenerId: Number(gardenerId) }),
        ...(plantName && {
          plantName: { contains: plantName, mode: 'insensitive' },
        }),
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

    const postIds = posts.map((p) => p.id);
    const gardenerIds = Array.from(new Set(posts.map((p) => p.gardenerId)));

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
    const tagsMap = new Map<number, (typeof postTags)[0]['tag'][]>();
    const imagesMap = new Map<number, (typeof images)[0][]>();
    const commentsMap = new Map<number, (typeof comments)[0][]>();
    const gardenerUserMap = new Map<number, (typeof gardeners)[0]['user']>();

    for (const id of postIds) {
      tagsMap.set(id, []);
      imagesMap.set(id, []);
      commentsMap.set(id, []);
    }
    postTags.forEach((pt) => tagsMap.get(pt.postId)!.push(pt.tag));
    images.forEach((img) => imagesMap.get(img.postId)!.push(img));
    comments.forEach((c) => commentsMap.get(c.postId)!.push(c));
    gardeners.forEach((g) => gardenerUserMap.set(g.user.id, g.user));

    // 4) Build DTO
    return posts.map((post) =>
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
      postTags.map((r) => r.tag),
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
    const { title, content, gardenId, plantName, plantGrowStage, tagIds } =
      body;

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
        data: tagIds.map((tid) => ({
          postId: post.id,
          tagId: Number(tid),
        })),
      });
    }
    if (files?.length) {
      await this.prisma.postImage.createMany({
        data: files.map((f) => ({
          postId: post.id,
          url: `/uploads/${f.filename}`,
        })),
      });
    }

    // 3) Fetch lại quan hệ
    const [postTags, images, comments, gardener] = await Promise.all([
      this.prisma.postTag.findMany({
        where: { postId: post.id },
        include: { tag: true },
      }),
      this.prisma.postImage.findMany({ where: { postId: post.id } }),
      this.prisma.comment.findMany({
        where: { postId: post.id },
        orderBy: { createdAt: 'asc' },
      }),
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
      postTags.map((r) => r.tag),
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
    if (existing.gardenerId !== userId)
      throw new ForbiddenException('Unauthorized');

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
      postTags.map((r) => r.tag),
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
    if (existing.gardenerId !== userId)
      throw new ForbiddenException('Unauthorized');
    await this.prisma.post.delete({ where: { id } });
  }

  /** Lấy riêng comments theo postId */
  async getCommentsByPostId(postId: number) {
    return this.prisma.comment.findMany({
      where: { postId },
      include: {
        gardener: {
          include: {
            user: true,
          },
        },
      },
    });
  }

  /** Filter posts based on specified criteria */
  async getFilteredPosts(params: {
    tagIds?: number[];
    searchQuery?: string;
    gardenId?: number;
    userId?: number;
    page: number;
    limit: number;
  }): Promise<PostDto[]> {
    const { tagIds, searchQuery, gardenId, userId, page, limit } = params;
    const skip = (page - 1) * limit;

    // Build where clause with filters
    const where: any = {};

    // Add tag filter if provided
    if (tagIds && tagIds.length > 0) {
      where.tags = { some: { tagId: { in: tagIds } } };
    }

    // Add search query filter if provided
    if (searchQuery) {
      where.OR = [
        { title: { contains: searchQuery, mode: 'insensitive' } },
        { content: { contains: searchQuery, mode: 'insensitive' } },
        { plantName: { contains: searchQuery, mode: 'insensitive' } },
      ];
    }

    // Add garden filter if provided
    if (gardenId) {
      where.gardenId = gardenId;
    }

    // Add user filter if provided
    if (userId) {
      where.gardenerId = userId;
    }

    // Fetch posts with filters
    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
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

    const postIds = posts.map((p) => p.id);
    const gardenerIds = Array.from(new Set(posts.map((p) => p.gardenerId)));

    // Fetch related data
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

    // Group into maps for easy lookup
    const tagsMap = new Map<number, (typeof postTags)[0]['tag'][]>();
    const imagesMap = new Map<number, (typeof images)[0][]>();
    const commentsMap = new Map<number, (typeof comments)[0][]>();
    const gardenerUserMap = new Map<number, (typeof gardeners)[0]['user']>();

    for (const id of postIds) {
      tagsMap.set(id, []);
      imagesMap.set(id, []);
      commentsMap.set(id, []);
    }
    postTags.forEach((pt) => tagsMap.get(pt.postId)!.push(pt.tag));
    images.forEach((img) => imagesMap.get(img.postId)!.push(img));
    comments.forEach((c) => commentsMap.get(c.postId)!.push(c));
    gardeners.forEach((g) => gardenerUserMap.set(g.user.id, g.user));

    // Build and return DTOs
    return posts.map((post) =>
      mapToPostDto(
        post,
        tagsMap.get(post.id) || [],
        imagesMap.get(post.id) || [],
        commentsMap.get(post.id) || [],
        gardenerUserMap.get(post.gardenerId)!,
        undefined,
      ),
    );
  }

  /** Search posts by query */
  async searchPosts(
    query: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<PostDto[]> {
    const skip = (page - 1) * limit;

    // Search in title, content, and plantName
    const posts = await this.prisma.post.findMany({
      where: {
        OR: [
          { title: { contains: query, mode: 'insensitive' } },
          { content: { contains: query, mode: 'insensitive' } },
          { plantName: { contains: query, mode: 'insensitive' } },
        ],
      },
      skip,
      take: limit,
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

    const postIds = posts.map((p) => p.id);
    const gardenerIds = Array.from(new Set(posts.map((p) => p.gardenerId)));

    // Fetch related data
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

    // Group into maps for easy lookup
    const tagsMap = new Map<number, (typeof postTags)[0]['tag'][]>();
    const imagesMap = new Map<number, (typeof images)[0][]>();
    const commentsMap = new Map<number, (typeof comments)[0][]>();
    const gardenerUserMap = new Map<number, (typeof gardeners)[0]['user']>();

    for (const id of postIds) {
      tagsMap.set(id, []);
      imagesMap.set(id, []);
      commentsMap.set(id, []);
    }
    postTags.forEach((pt) => tagsMap.get(pt.postId)!.push(pt.tag));
    images.forEach((img) => imagesMap.get(img.postId)!.push(img));
    comments.forEach((c) => commentsMap.get(c.postId)!.push(c));
    gardeners.forEach((g) => gardenerUserMap.set(g.user.id, g.user));

    // Build and return DTOs
    return posts.map((post) =>
      mapToPostDto(
        post,
        tagsMap.get(post.id) || [],
        imagesMap.get(post.id) || [],
        commentsMap.get(post.id) || [],
        gardenerUserMap.get(post.gardenerId)!,
        undefined,
      ),
    );
  }

  /** Advanced search posts với SearchPostDto */
  async searchPostsAdvanced(searchDto: SearchPostDto): Promise<{
    data: PostDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      title,
      content,
      plantName,
      plantGrowStage,
      gardenerId,
      gardenId,
      tagIds,
      tagName,
      minVotes,
      page = 1,
      limit = 10,
      sortBy = 'createdAt',
      sortOrder = 'desc',
      generalSearch,
    } = searchDto;

    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Specific field searches
    if (title) {
      where.title = { contains: title, mode: 'insensitive' };
    }
    if (content) {
      where.content = { contains: content, mode: 'insensitive' };
    }
    if (plantName) {
      where.plantName = { contains: plantName, mode: 'insensitive' };
    }
    if (plantGrowStage) {
      where.plantGrowStage = { contains: plantGrowStage, mode: 'insensitive' };
    }
    if (gardenerId) {
      where.gardenerId = gardenerId;
    }
    if (gardenId) {
      where.gardenId = gardenId;
    }
    if (minVotes !== undefined) {
      where.total_vote = { gte: minVotes };
    }

    // Tag filters
    if (tagIds && tagIds.length > 0) {
      where.tags = { some: { tagId: { in: tagIds } } };
    } else if (tagName) {
      where.tags = { some: { tag: { name: { contains: tagName, mode: 'insensitive' } } } };
    }

    // General search - tìm kiếm tổng hợp
    if (generalSearch) {
      const searchConditions = [
        { title: { contains: generalSearch, mode: 'insensitive' } },
        { content: { contains: generalSearch, mode: 'insensitive' } },
        { plantName: { contains: generalSearch, mode: 'insensitive' } },
        { plantGrowStage: { contains: generalSearch, mode: 'insensitive' } },
      ];

      // Nếu có các điều kiện khác, kết hợp với AND
      if (Object.keys(where).length > 0) {
        where.AND = [
          where,
          { OR: searchConditions }
        ];
        // Clear the original where object
        Object.keys(where).forEach(key => {
          if (key !== 'AND') delete where[key];
        });
      } else {
        where.OR = searchConditions;
      }
    }

    // Build orderBy
    const orderBy: any = {};
    orderBy[sortBy] = sortOrder;

    // Get total count
    const total = await this.prisma.post.count({ where });

    // Fetch posts
    const posts = await this.prisma.post.findMany({
      where,
      skip,
      take: limit,
      orderBy,
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

    const postIds = posts.map((p) => p.id);
    const gardenerIds = Array.from(new Set(posts.map((p) => p.gardenerId)));

    // Fetch related data
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

    // Group into maps
    const tagsMap = new Map<number, (typeof postTags)[0]['tag'][]>();
    const imagesMap = new Map<number, (typeof images)[0][]>();
    const commentsMap = new Map<number, (typeof comments)[0][]>();
    const gardenerUserMap = new Map<number, (typeof gardeners)[0]['user']>();

    for (const id of postIds) {
      tagsMap.set(id, []);
      imagesMap.set(id, []);
      commentsMap.set(id, []);
    }
    postTags.forEach((pt) => tagsMap.get(pt.postId)!.push(pt.tag));
    images.forEach((img) => imagesMap.get(img.postId)!.push(img));
    comments.forEach((c) => commentsMap.get(c.postId)!.push(c));
    gardeners.forEach((g) => gardenerUserMap.set(g.user.id, g.user));

    // Build DTOs
    const data = posts.map((post) =>
      mapToPostDto(
        post,
        tagsMap.get(post.id) || [],
        imagesMap.get(post.id) || [],
        commentsMap.get(post.id) || [],
        gardenerUserMap.get(post.gardenerId)!,
        undefined,
      ),
    );

    const totalPages = Math.ceil(total / limit);

    return {
      data,
      total,
      page,
      limit,
      totalPages,
    };
  }
}
