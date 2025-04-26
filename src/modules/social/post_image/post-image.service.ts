import {
  Injectable,
  Logger,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from 'src/prisma/prisma.service';
import { CreatePostImageDto } from './dto/create-post-image.dto';
import { PostImageDto } from './dto/post-image.dto';

@Injectable()
export class PostImageService {
  private readonly logger = new Logger(PostImageService.name);

  constructor(private readonly prisma: PrismaService) {}

  async create(
    gardenerId: number,
    createPostImageDto: CreatePostImageDto,
  ): Promise<PostImageDto> {
    try {
      // Kiểm tra bài viết tồn tại và thuộc về người dùng
      const post = await this.prisma.post.findUnique({
        where: { id: createPostImageDto.postId },
      });

      if (!post) {
        throw new NotFoundException(
          `Không tìm thấy bài viết với ID ${createPostImageDto.postId}`,
        );
      }

      if (post.gardenerId !== gardenerId) {
        throw new ForbiddenException(
          'Bạn không có quyền thêm hình ảnh vào bài viết này',
        );
      }

      // Tạo hình ảnh mới
      const postImage = await this.prisma.postImage.create({
        data: {
          postId: createPostImageDto.postId,
          url: createPostImageDto.url,
        },
      });

      this.logger.log(`PostImage created: ${postImage.id}`);
      return {
        id: postImage.id,
        postId: postImage.postId,
        url: postImage.url,
      };
    } catch (error) {
      this.logger.error(
        `Error creating post image: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể tạo hình ảnh');
    }
  }

  async findByPostId(postId: number): Promise<PostImageDto[]> {
    try {
      // Kiểm tra bài viết tồn tại
      const post = await this.prisma.post.findUnique({
        where: { id: postId },
      });

      if (!post) {
        throw new NotFoundException(`Không tìm thấy bài viết với ID ${postId}`);
      }

      // Lấy danh sách hình ảnh
      const postImages = await this.prisma.postImage.findMany({
        where: { postId },
      });

      return postImages.map((image) => ({
        id: image.id,
        postId: image.postId,
        url: image.url,
      }));
    } catch (error) {
      this.logger.error(
        `Error finding images for post ${postId}: ${error.message}`,
        error.stack,
      );
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException('Không thể lấy danh sách hình ảnh');
    }
  }

  async remove(id: number, gardenerId: number): Promise<void> {
    try {
      // Kiểm tra hình ảnh tồn tại
      const postImage = await this.prisma.postImage.findUnique({
        where: { id },
        include: {
          post: true,
        },
      });

      if (!postImage) {
        throw new NotFoundException(`Không tìm thấy hình ảnh với ID ${id}`);
      }

      // Kiểm tra người dùng có quyền xóa không
      if (postImage.post.gardenerId !== gardenerId) {
        throw new ForbiddenException('Bạn không có quyền xóa hình ảnh này');
      }

      // Xóa hình ảnh
      await this.prisma.postImage.delete({
        where: { id },
      });

      this.logger.log(`PostImage deleted: ${id}`);
    } catch (error) {
      this.logger.error(
        `Error deleting post image ${id}: ${error.message}`,
        error.stack,
      );
      if (
        error instanceof NotFoundException ||
        error instanceof ForbiddenException
      ) {
        throw error;
      }
      throw new BadRequestException('Không thể xóa hình ảnh');
    }
  }
}
