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
  Request,
  BadRequestException,
  UsePipes,
  ValidationPipe,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { ApiTags, ApiOperation, ApiResponse, ApiConsumes, ApiBody, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { PhotoEvaluationService } from '../service/photo-evaluation.service';
import {
  CreatePhotoEvaluationDto,
  UpdatePhotoEvaluationDto,
  PhotoEvaluationResponseDto,
} from '../dto/photo-evaluation.dto';
import { JwtAuthGuard } from '../../../../common/guards';

@ApiTags('Photo Evaluation')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UsePipes(new ValidationPipe({ transform: true, whitelist: true }))
@Controller('photo-evaluations')
export class PhotoEvaluationController {
  constructor(private readonly photoEvaluationService: PhotoEvaluationService) {}

  @Post()
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
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 401, description: 'Không có quyền truy cập' })
  @ApiResponse({ status: 404, description: 'Vườn không tồn tại' })
  async createPhotoEvaluation(
    @Request() req: any,
    @Body() createDto: CreatePhotoEvaluationDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<PhotoEvaluationResponseDto> {
    if (!image) {
      throw new BadRequestException('Image file is required');
    }

    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.createPhotoEvaluation(gardenerId, createDto, image);
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
  async getPhotoEvaluations(
    @Request() req: any,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.getPhotoEvaluationsByGardener(gardenerId, page, limit);
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
  @ApiResponse({ status: 404, description: 'Vườn không tồn tại' })
  async getPhotoEvaluationsByGarden(
    @Request() req: any,
    @Param('gardenId', ParseIntPipe) gardenId: number,
    @Query('page', new ParseIntPipe({ optional: true })) page: number = 1,
    @Query('limit', new ParseIntPipe({ optional: true })) limit: number = 10,
  ) {
    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.getPhotoEvaluationsByGarden(gardenerId, gardenId, page, limit);
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
  async getPhotoEvaluationStats(@Request() req: any) {
    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.getPhotoEvaluationStats(gardenerId);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết đánh giá ảnh theo ID' })
  @ApiResponse({
    status: 200,
    description: 'Chi tiết đánh giá ảnh',
    type: PhotoEvaluationResponseDto,
  })
  @ApiResponse({ status: 404, description: 'Đánh giá ảnh không tồn tại' })
  async getPhotoEvaluationById(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<PhotoEvaluationResponseDto> {
    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.getPhotoEvaluationById(gardenerId, id);
  }

  @Put(':id')
  @ApiOperation({ summary: 'Cập nhật thông tin đánh giá ảnh' })
  @ApiResponse({
    status: 200,
    description: 'Đánh giá ảnh được cập nhật thành công',
    type: PhotoEvaluationResponseDto,
  })
  @ApiResponse({ status: 400, description: 'Dữ liệu không hợp lệ' })
  @ApiResponse({ status: 404, description: 'Đánh giá ảnh không tồn tại' })
  async updatePhotoEvaluation(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
    @Body() updateDto: UpdatePhotoEvaluationDto,
  ): Promise<PhotoEvaluationResponseDto> {
    const gardenerId = req.user.gardenerId;
    return this.photoEvaluationService.updatePhotoEvaluation(gardenerId, id, updateDto);
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xóa đánh giá ảnh' })
  @ApiResponse({ status: 200, description: 'Đánh giá ảnh được xóa thành công' })
  @ApiResponse({ status: 404, description: 'Đánh giá ảnh không tồn tại' })
  async deletePhotoEvaluation(
    @Request() req: any,
    @Param('id', ParseIntPipe) id: number,
  ): Promise<{ message: string }> {
    const gardenerId = req.user.gardenerId;
    await this.photoEvaluationService.deletePhotoEvaluation(gardenerId, id);
    return { message: 'Đánh giá ảnh đã được xóa thành công' };
  }

  /**
   * Test AI service connection
   */
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
  async testAIService(@Request() req: any) {
    return this.photoEvaluationService.testAIService();
  }
} 