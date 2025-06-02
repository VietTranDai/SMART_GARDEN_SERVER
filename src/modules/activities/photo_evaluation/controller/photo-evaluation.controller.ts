import {
  Controller,
  Post,
  Get,
  Put,
  Delete,
  Body,
  Param,
  Query,
  UseInterceptors,
  UploadedFile,
  ParseIntPipe,
  UseGuards,
  BadRequestException,
  UsePipes,
  ValidationPipe,
  InternalServerErrorException,
  NotFoundException,
  ForbiddenException,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { 
  ApiTags, 
  ApiOperation, 
  ApiResponse, 
  ApiConsumes, 
  ApiBody, 
  ApiBearerAuth, 
  ApiQuery,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiNotFoundResponse,
  ApiInternalServerErrorResponse,
  ApiForbiddenResponse,
} from '@nestjs/swagger';
import { PhotoEvaluationService } from '../service/photo-evaluation.service';
import {
  CreatePhotoEvaluationDto,
  UpdatePhotoEvaluationDto,
  PhotoEvaluationResponseDto,
} from '../dto/photo-evaluation.dto';
import { GetUser } from 'src/common/decorators/get-user.decorator';

@ApiTags('Photo Evaluation')
@ApiBearerAuth()
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('photo-evaluations')
export class PhotoEvaluationController {
  constructor(private readonly photoEvaluationService: PhotoEvaluationService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseInterceptors(FileInterceptor('image', {
    limits: {
      fileSize: 10 * 1024 * 1024, // 10MB
    },
    fileFilter: (req, file, callback) => {
      const allowedMimeTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
      if (!allowedMimeTypes.includes(file.mimetype)) {
        return callback(new BadRequestException('Only image files (JPEG, PNG, GIF, WebP) are allowed'), false);
      }
      callback(null, true);
    },
  }))
  @ApiOperation({ summary: 'Tạo đánh giá ảnh mới với upload ảnh' })
  @ApiConsumes('multipart/form-data')
  @ApiBody({
    description: 'Dữ liệu tạo đánh giá ảnh và file ảnh',
    schema: {
      type: 'object',
      properties: {
        image: {
          type: 'string',
          format: 'binary',
          description: 'File ảnh cần đánh giá (tối đa 10MB)',
        },
        taskId: {
          type: 'string',
          description: 'ID của nhiệm vụ liên quan',
          example: '1',
        },
        gardenId: {
          type: 'string',
          description: 'ID của vườn',
          example: '1',
        },
        gardenActivityId: {
          type: 'string',
          description: 'ID của hoạt động vườn (tùy chọn)',
          example: '1',
        },
        plantName: {
          type: 'string',
          description: 'Tên cây trồng (tùy chọn)',
          example: 'Cà chua',
        },
        plantGrowStage: {
          type: 'string',
          description: 'Giai đoạn phát triển của cây (tùy chọn)',
          example: 'Berries',
        },
        notes: {
          type: 'string',
          description: 'Ghi chú bổ sung (tùy chọn)',
          example: 'Cây có vẻ khỏe mạnh',
        },
      },
      required: ['image', 'taskId', 'gardenId'],
    },
  })
  @ApiResponse({
    status: 201,
    description: 'Đánh giá ảnh được tạo thành công',
    type: PhotoEvaluationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu không hợp lệ hoặc thiếu file ảnh' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Vườn hoặc nhiệm vụ không tồn tại' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async createPhotoEvaluation(
    @GetUser('id') userId: number,
    @Body() createDto: CreatePhotoEvaluationDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<PhotoEvaluationResponseDto> {
    try {
      if (!image) {
        throw new BadRequestException('Image file is required');
      }

      return await this.photoEvaluationService.createPhotoEvaluation(userId, createDto, image);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404) {
        throw error;
      }
      console.error('Error in createPhotoEvaluation controller:', error);
      throw new InternalServerErrorException('Failed to create photo evaluation');
    }
  }

  @Get()
  @ApiOperation({ summary: 'Lấy danh sách đánh giá ảnh của người dùng' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đánh giá ảnh',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PhotoEvaluationResponseDto' },
        },
        total: { type: 'number', description: 'Tổng số bản ghi' },
        page: { type: 'number', description: 'Trang hiện tại' },
        limit: { type: 'number', description: 'Số lượng mỗi trang' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Tham số phân trang không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getPhotoEvaluations(
    @GetUser('id') userId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    try {
      if (page < 1) {
        throw new BadRequestException('Page must be greater than 0');
      }

      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }

      return await this.photoEvaluationService.getPhotoEvaluationsByGardener(userId, page, limit);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in getPhotoEvaluations controller:', error);
      throw new InternalServerErrorException('Failed to fetch photo evaluations');
    }
  }

  @Get('garden/:gardenId')
  @ApiOperation({ summary: 'Lấy danh sách đánh giá ảnh theo vườn' })
  @ApiQuery({ name: 'page', required: false, type: Number, description: 'Số trang (mặc định: 1)' })
  @ApiQuery({ name: 'limit', required: false, type: Number, description: 'Số lượng mỗi trang (mặc định: 10)' })
  @ApiResponse({
    status: 200,
    description: 'Danh sách đánh giá ảnh theo vườn',
    schema: {
      type: 'object',
      properties: {
        data: {
          type: 'array',
          items: { $ref: '#/components/schemas/PhotoEvaluationResponseDto' },
        },
        total: { type: 'number', description: 'Tổng số bản ghi' },
        page: { type: 'number', description: 'Trang hiện tại' },
        limit: { type: 'number', description: 'Số lượng mỗi trang' },
      },
    },
  })
  @ApiBadRequestResponse({ description: 'Garden ID hoặc tham số phân trang không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Vườn không tồn tại' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập vườn này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getPhotoEvaluationsByGarden(
    @GetUser('id') userId: number,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    try {
      if (isNaN(gardenId) || gardenId < 1) {
        throw new BadRequestException('Invalid garden ID');
      }

      if (page < 1) {
        throw new BadRequestException('Page must be greater than 0');
      }

      if (limit < 1 || limit > 100) {
        throw new BadRequestException('Limit must be between 1 and 100');
      }

      return await this.photoEvaluationService.getPhotoEvaluationsByGarden(userId, gardenId, page, limit);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in getPhotoEvaluationsByGarden controller:', error);
      throw new InternalServerErrorException('Failed to fetch photo evaluations by garden');
    }
  }

  @Get('stats')
  @ApiOperation({ summary: 'Lấy thống kê đánh giá ảnh của người dùng' })
  @ApiResponse({
    status: 200,
    description: 'Thống kê đánh giá ảnh',
    schema: {
      type: 'object',
      properties: {
        total: { type: 'number', description: 'Tổng số đánh giá' },
        evaluated: { type: 'number', description: 'Số đánh giá đã được AI phân tích' },
        healthy: { type: 'number', description: 'Số đánh giá có kết quả khỏe mạnh' },
        unhealthy: { type: 'number', description: 'Số đánh giá có vấn đề' },
        avgConfidence: { type: 'number', description: 'Độ tin cậy trung bình' },
      },
    },
  })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getPhotoEvaluationStats(@GetUser('id') userId: number) {
    try {
      return await this.photoEvaluationService.getPhotoEvaluationStats(userId);
    } catch (error) {
      if (error instanceof BadRequestException) {
        throw error;
      }
      console.error('Error in getPhotoEvaluationStats controller:', error);
      throw new InternalServerErrorException('Failed to fetch photo evaluation statistics');
    }
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đánh giá ảnh theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết đánh giá ảnh',
    type: PhotoEvaluationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Photo evaluation ID không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Đánh giá ảnh không tồn tại' })
  @ApiForbiddenResponse({ description: 'Không có quyền truy cập đánh giá này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async getPhotoEvaluationById(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PhotoEvaluationResponseDto> {
    try {
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid photo evaluation ID');
      }

      return await this.photoEvaluationService.getPhotoEvaluationById(userId, id);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in getPhotoEvaluationById controller:', error);
      throw new InternalServerErrorException('Failed to fetch photo evaluation');
    }
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đánh giá ảnh' })
  @ApiResponse({
    status: 200,
    description: 'Đánh giá ảnh được cập nhật thành công',
    type: PhotoEvaluationResponseDto,
  })
  @ApiBadRequestResponse({ description: 'Dữ liệu hoặc Photo evaluation ID không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Đánh giá ảnh không tồn tại' })
  @ApiForbiddenResponse({ description: 'Không có quyền cập nhật đánh giá này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async updatePhotoEvaluation(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePhotoEvaluationDto,
  ): Promise<PhotoEvaluationResponseDto> {
    try {
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid photo evaluation ID');
      }

      return await this.photoEvaluationService.updatePhotoEvaluation(userId, id, updateDto);
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in updatePhotoEvaluation controller:', error);
      throw new InternalServerErrorException('Failed to update photo evaluation');
    }
  }

  @Delete(':id')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Xóa đánh giá ảnh' })
  @ApiResponse({ 
    status: 200, 
    description: 'Đánh giá ảnh được xóa thành công',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string', example: 'Đánh giá ảnh đã được xóa thành công' }
      }
    }
  })
  @ApiBadRequestResponse({ description: 'Photo evaluation ID không hợp lệ' })
  @ApiUnauthorizedResponse({ description: 'Không có quyền truy cập' })
  @ApiNotFoundResponse({ description: 'Đánh giá ảnh không tồn tại' })
  @ApiForbiddenResponse({ description: 'Không có quyền xóa đánh giá này' })
  @ApiInternalServerErrorResponse({ description: 'Lỗi server nội bộ' })
  async deletePhotoEvaluation(
    @GetUser('id') userId: number,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    try {
      if (isNaN(id) || id < 1) {
        throw new BadRequestException('Invalid photo evaluation ID');
      }

      await this.photoEvaluationService.deletePhotoEvaluation(userId, id);
      return { message: 'Đánh giá ảnh đã được xóa thành công' };
    } catch (error) {
      if (error instanceof BadRequestException || error.status === 404 || error.status === 403) {
        throw error;
      }
      console.error('Error in deletePhotoEvaluation controller:', error);
      throw new InternalServerErrorException('Failed to delete photo evaluation');
    }
  }

  @Get('test-ai-service')
  @ApiOperation({ summary: 'Test AI service connection' })
  @ApiResponse({
    status: 200,
    description: 'AI service test result',
    schema: {
      type: 'object',
      properties: {
        success: { type: 'boolean' },
        message: { type: 'string' },
        details: { type: 'object' },
      },
    },
  })
  @ApiInternalServerErrorResponse({ description: 'Lỗi kết nối AI service' })
  async testAIService() {
    try {
      return await this.photoEvaluationService.testAIService();
    } catch (error) {
      console.error('Error in testAIService controller:', error);
      throw new InternalServerErrorException('Failed to test AI service connection');
    }
  }
} 