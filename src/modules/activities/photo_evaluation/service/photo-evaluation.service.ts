import { Injectable, NotFoundException, BadRequestException, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../../../../prisma/prisma.service';
import { CreatePhotoEvaluationDto, UpdatePhotoEvaluationDto, PhotoEvaluationResponseDto, AIEvaluationDto, mapToPhotoEvaluationResponseDto } from '../dto/photo-evaluation.dto';
import * as fs from 'fs';
import * as path from 'path';
import { promisify } from 'util';
import axios from 'axios';
import FormData from 'form-data';

const writeFile = promisify(fs.writeFile);
const unlink = promisify(fs.unlink);
const mkdir = promisify(fs.mkdir);

@Injectable()
export class PhotoEvaluationService {
  private readonly logger = new Logger(PhotoEvaluationService.name);
  private readonly uploadPath = 'photo_evaluations';
  private readonly aiServiceUrl: string;

  constructor(
    private readonly prisma: PrismaService,
    private readonly configService: ConfigService,
  ) {
    this.aiServiceUrl = this.configService.get<string>('AI_DISEASE_PREDICT', 'http://localhost:5000');
    this.ensureUploadDirectoryExists();
    this.checkAIServiceConnection();
  }

  /**
   * Kiểm tra kết nối với AI service
   */
  private async checkAIServiceConnection(): Promise<void> {
    try {
      this.logger.log(`Checking AI service connection at: ${this.aiServiceUrl}`);
      
      const response = await axios.get(`${this.aiServiceUrl}/health`, {
        timeout: 5000,
      });

      if (response.status === 200 && response.data.status === 'healthy') {
        this.logger.log(`✅ AI service connected successfully: ${response.data.service} v${response.data.version}`);
        this.logger.log(`📊 Model loaded: ${response.data.model_loaded ? 'Yes' : 'No'}`);
      } else {
        this.logger.warn(`⚠️ AI service responded but status is not healthy: ${response.data.status}`);
      }
    } catch (error) {
      this.logger.error(`❌ Failed to connect to AI service at ${this.aiServiceUrl}: ${error.message}`);
      this.logger.warn('🔄 AI evaluation will fail until service is available');
    }
  }

  /**
   * Test AI service với ảnh mẫu
   */
  async testAIService(): Promise<{ success: boolean; message: string; details?: any }> {
    try {
      // Kiểm tra health endpoint trước
      const healthResponse = await axios.get(`${this.aiServiceUrl}/health`, { timeout: 5000 });
      
      if (healthResponse.status !== 200 || healthResponse.data.status !== 'healthy') {
        return {
          success: false,
          message: 'AI service is not healthy',
          details: healthResponse.data,
        };
      }

      return {
        success: true,
        message: 'AI service is running and healthy',
        details: {
          service: healthResponse.data.service,
          version: healthResponse.data.version,
          model_loaded: healthResponse.data.model_loaded,
          model_path: healthResponse.data.model_path,
          url: this.aiServiceUrl,
        },
      };
    } catch (error) {
      return {
        success: false,
        message: `Failed to connect to AI service: ${error.message}`,
        details: {
          url: this.aiServiceUrl,
          error: error.message,
        },
      };
    }
  }

  /**
   * Helper function to convert Prisma result to DTO
   */
  private convertToResponseDto(photoEvaluation: any): PhotoEvaluationResponseDto {
    return mapToPhotoEvaluationResponseDto({
      ...photoEvaluation,
      gardenActivity: photoEvaluation.gardenActivity || undefined,
    });
  }

  /**
   * Tạo đánh giá ảnh mới với file upload
   */
  async createPhotoEvaluation(
    gardenerId: number,
    dto: CreatePhotoEvaluationDto,
    imageFile: Express.Multer.File,
  ): Promise<PhotoEvaluationResponseDto> {
    try {
      // Verify garden belongs to gardener
      await this.verifyGardenAccess(gardenerId, dto.gardenId);

      // Save image file
      const fileName = await this.saveImageFile(imageFile);
      const photoUrl = `photo_evaluations/${fileName}`;

      // Create photo evaluation record
      const photoEvaluation = await this.prisma.photoEvaluation.create({
        data: {
          taskId: dto.taskId,
          gardenId: dto.gardenId,
          gardenerId: gardenerId,
          gardenActivityId: dto.gardenActivityId,
          plantName: dto.plantName,
          plantGrowStage: dto.plantGrowStage,
          photoUrl: photoUrl,
          notes: dto.notes,
        },
        include: {
          garden: true,
          gardener: {
            include: {
              user: true,
            },
          },
          gardenActivity: true,
        },
      });

      // Asynchronously call AI service for evaluation (don't await to avoid blocking)
      this.performAIEvaluation(photoEvaluation.id, fileName, dto.plantName).catch((error) => {
        this.logger.error(`AI evaluation failed for photo ${photoEvaluation.id}:`, error);
      });

      return this.convertToResponseDto(photoEvaluation);
    } catch (error) {
      this.logger.error(`Error creating photo evaluation: ${error.message}`, error.stack);
      throw error;
    }
  }

  /**
   * Lấy tất cả đánh giá ảnh của một gardener
   */
  async getPhotoEvaluationsByGardener(
    gardenerId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PhotoEvaluationResponseDto[]; total: number; page: number; limit: number }> {
    const skip = (page - 1) * limit;

    const [photoEvaluations, total] = await Promise.all([
      this.prisma.photoEvaluation.findMany({
        where: { gardenerId },
        include: {
          garden: true,
          gardener: {
            include: {
              user: true,
            },
          },
          gardenActivity: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.photoEvaluation.count({
        where: { gardenerId },
      }),
    ]);

    return {
      data: photoEvaluations.map(pe => this.convertToResponseDto(pe)),
      total,
      page,
      limit,
    };
  }

  /**
   * Lấy đánh giá ảnh theo garden ID
   */
  async getPhotoEvaluationsByGarden(
    gardenerId: number,
    gardenId: number,
    page: number = 1,
    limit: number = 10,
  ): Promise<{ data: PhotoEvaluationResponseDto[]; total: number; page: number; limit: number }> {
    // Verify garden access
    await this.verifyGardenAccess(gardenerId, gardenId);

    const skip = (page - 1) * limit;

    const [photoEvaluations, total] = await Promise.all([
      this.prisma.photoEvaluation.findMany({
        where: { gardenId, gardenerId },
        include: {
          garden: true,
          gardener: {
            include: {
              user: true,
            },
          },
          gardenActivity: true,
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      this.prisma.photoEvaluation.count({
        where: { gardenId, gardenerId },
      }),
    ]);

    return {
      data: photoEvaluations.map(pe => this.convertToResponseDto(pe)),
      total,
      page,
      limit,
    };
  }

  /**
   * Lấy chi tiết đánh giá ảnh theo ID
   */
  async getPhotoEvaluationById(
    gardenerId: number,
    id: number,
  ): Promise<PhotoEvaluationResponseDto> {
    const photoEvaluation = await this.prisma.photoEvaluation.findFirst({
      where: { id, gardenerId },
      include: {
        garden: true,
        gardener: {
          include: {
            user: true,
          },
        },
        gardenActivity: true,
      },
    });

    if (!photoEvaluation) {
      throw new NotFoundException('Photo evaluation not found');
    }

    return this.convertToResponseDto(photoEvaluation);
  }

  /**
   * Cập nhật đánh giá ảnh
   */
  async updatePhotoEvaluation(
    gardenerId: number,
    id: number,
    dto: UpdatePhotoEvaluationDto,
  ): Promise<PhotoEvaluationResponseDto> {
    const existing = await this.prisma.photoEvaluation.findFirst({
      where: { id, gardenerId },
    });

    if (!existing) {
      throw new NotFoundException('Photo evaluation not found');
    }

    const updated = await this.prisma.photoEvaluation.update({
      where: { id },
      data: {
        aiFeedback: dto.aiFeedback,
        confidence: dto.confidence,
        notes: dto.notes,
        evaluatedAt: dto.aiFeedback ? new Date() : undefined,
      },
      include: {
        garden: true,
        gardener: {
          include: {
            user: true,
          },
        },
        gardenActivity: true,
      },
    });

    return this.convertToResponseDto(updated);
  }

  /**
   * Xóa đánh giá ảnh
   */
  async deletePhotoEvaluation(gardenerId: number, id: number): Promise<void> {
    const existing = await this.prisma.photoEvaluation.findFirst({
      where: { id, gardenerId },
    });

    if (!existing) {
      throw new NotFoundException('Photo evaluation not found');
    }

    // Delete image file
    try {
      const filePath = path.join(this.uploadPath, path.basename(existing.photoUrl));
      if (fs.existsSync(filePath)) {
        await unlink(filePath);
      }
    } catch (error) {
      this.logger.warn(`Failed to delete image file: ${error.message}`);
    }

    // Delete database record
    await this.prisma.photoEvaluation.delete({
      where: { id },
    });
  }

  /**
   * Thực hiện đánh giá AI
   */
  private async performAIEvaluation(photoEvaluationId: number, fileName: string, plantType?: string): Promise<void> {
    try {
      const filePath = path.join(this.uploadPath, fileName);
      
      // Create form data for API call
      const formData = new FormData();
      formData.append('image', fs.createReadStream(filePath));
      if (plantType) {
        formData.append('plant_type', plantType);
      }

      this.logger.log(`Calling AI service for photo evaluation ${photoEvaluationId}`);

      // Call AI service
      const response = await axios.post(`${this.aiServiceUrl}/predict`, formData, {
        headers: {
          ...formData.getHeaders(),
        },
        timeout: 30000, // 30 seconds timeout
      });

      // Flask app response format: { success: boolean, prediction: {...}, error?: string }
      if (!response.data.success) {
        throw new Error(response.data.error || 'AI prediction failed');
      }

      const predictionData = response.data.prediction;
      
      // Generate AI feedback from Flask response
      const aiFeedback = this.generateAIFeedbackFromFlask(predictionData, plantType);
      const confidence = predictionData.confidence || 0;

      // Update photo evaluation with AI results
      await this.prisma.photoEvaluation.update({
        where: { id: photoEvaluationId },
        data: {
          aiFeedback,
          confidence,
          evaluatedAt: new Date(),
        },
      });

      this.logger.log(`✅ AI evaluation completed for photo evaluation ${photoEvaluationId}`);
      this.logger.log(`📊 Result: ${predictionData.class_vi} (${(confidence * 100).toFixed(1)}% confidence)`);
    } catch (error) {
      this.logger.error(`❌ AI evaluation failed for photo evaluation ${photoEvaluationId}: ${error.message}`, error.stack);
      
      // Update with error message
      await this.prisma.photoEvaluation.update({
        where: { id: photoEvaluationId },
        data: {
          aiFeedback: `❌ Không thể thực hiện đánh giá AI.\n🔧 Lỗi: ${error.message}\n💡 Vui lòng thử lại sau hoặc kiểm tra kết nối AI service.`,
          confidence: 0,
          evaluatedAt: new Date(),
        },
      });
    }
  }

  /**
   * Tạo phản hồi AI từ Flask response
   */
  private generateAIFeedbackFromFlask(predictionData: any, plantType?: string): string {
    const isHealthy = predictionData.class_en.toLowerCase().includes('healthy');
    const confidence = predictionData.confidence || 0;
    const classVi = predictionData.class_vi || predictionData.class_en;
    const plantName = plantType || predictionData.plant_type || 'cây trồng';

    let feedback = `🌱 **Phân tích AI cho ${plantName}**\n\n`;
    feedback += `📅 **Thời gian**: ${new Date().toLocaleString('vi-VN')}\n`;
    feedback += `🎯 **Kết quả**: ${classVi}\n`;
    feedback += `📊 **Độ tin cậy**: ${(confidence * 100).toFixed(1)}%\n\n`;

    if (isHealthy) {
      feedback += `✅ **Trạng thái**: Cây khỏe mạnh\n\n`;
      feedback += `🎉 **Tuyệt vời!** Cây của bạn trông rất khỏe mạnh!\n`;
      feedback += `💚 Hãy tiếp tục chăm sóc như hiện tại.\n`;
      feedback += `📈 Duy trì chế độ tưới nước, ánh sáng và dinh dưỡng phù hợp.`;
    } else {
      // Extract disease name from class
      const diseaseName = classVi.replace(/.*___/, '').replace(/_/g, ' ');
      
      feedback += `⚠️ **Vấn đề phát hiện**: ${diseaseName}\n\n`;
      
      // Add general advice based on common diseases
      feedback += `🔍 **Khuyến nghị xử lý**:\n`;
      
      if (diseaseName.toLowerCase().includes('spot') || diseaseName.toLowerCase().includes('bệnh đốm')) {
        feedback += `• 🚿 Tránh tưới nước lên lá\n`;
        feedback += `• 🌬️ Đảm bảo thông gió tốt\n`;
        feedback += `• 🧽 Loại bỏ lá bị nhiễm bệnh\n`;
        feedback += `• 🧪 Xem xét sử dụng thuốc diệt nấm\n`;
      } else if (diseaseName.toLowerCase().includes('mosaic') || diseaseName.toLowerCase().includes('virus')) {
        feedback += `• 🦠 Có thể là bệnh virus, cần cách ly cây\n`;
        feedback += `• 🐛 Kiểm soát côn trùng truyền bệnh\n`;
        feedback += `• ✂️ Loại bỏ phần cây bị nhiễm\n`;
        feedback += `• 🧼 Vệ sinh dụng cụ trước khi sử dụng\n`;
      } else {
        feedback += `• 🔍 Quan sát cây thường xuyên\n`;
        feedback += `• 💧 Điều chỉnh chế độ tưới nước\n`;
        feedback += `• 🌞 Kiểm tra điều kiện ánh sáng\n`;
        feedback += `• 👨‍🌾 Tham khảo ý kiến chuyên gia nếu cần\n`;
      }
      
      feedback += `\n⚡ **Lưu ý**: Hãy xử lý sớm để tránh lây lan sang cây khác!`;
    }

    feedback += `\n\n📋 **Chi tiết kỹ thuật**:\n`;
    feedback += `• Mô hình AI: InceptionResNetV2\n`;
    feedback += `• Lớp dự đoán: ${predictionData.class_en}\n`;
    feedback += `• Độ tin cậy: ${(confidence * 100).toFixed(2)}%`;

    return feedback;
  }

  /**
   * Tạo phản hồi AI dựa trên kết quả phân tích (legacy method - giữ để tương thích)
   */
  private generateAIFeedback(aiResult: AIEvaluationDto): string {
    let feedback = `🌱 **Phân tích AI cho ${aiResult.plant_type}**\n\n`;

    if (aiResult.is_healthy) {
      feedback += `✅ **Trạng thái**: Cây khỏe mạnh\n`;
      feedback += `📊 **Độ tin cậy**: ${(aiResult.confidence * 100).toFixed(1)}%\n\n`;
      feedback += `🎉 Cây của bạn trông rất khỏe mạnh! Hãy tiếp tục chăm sóc như hiện tại.`;
    } else {
      feedback += `⚠️ **Vấn đề phát hiện**: ${aiResult.disease_name}\n`;
      feedback += `📊 **Độ tin cậy**: ${(aiResult.confidence * 100).toFixed(1)}%\n`;
      feedback += `🔍 **Mức độ nghiêm trọng**: ${aiResult.severity_level}/5\n\n`;
      
      if (aiResult.description) {
        feedback += `📝 **Mô tả**: ${aiResult.description}\n\n`;
      }
      
      if (aiResult.treatment_suggestion) {
        feedback += `💡 **Khuyến nghị xử lý**: ${aiResult.treatment_suggestion}\n\n`;
      }
      
      feedback += `⚡ Hãy xử lý sớm để tránh tình trạng nghiêm trọng hơn.`;
    }

    return feedback;
  }

  /**
   * Lưu file ảnh vào thư mục
   */
  private async saveImageFile(file: Express.Multer.File): Promise<string> {
    const timestamp = Date.now();
    const extension = path.extname(file.originalname);
    const fileName = `${timestamp}_${Math.random().toString(36).substring(7)}${extension}`;
    const filePath = path.join(this.uploadPath, fileName);

    await writeFile(filePath, file.buffer);
    return fileName;
  }

  /**
   * Đảm bảo thư mục upload tồn tại
   */
  private async ensureUploadDirectoryExists(): Promise<void> {
    try {
      if (!fs.existsSync(this.uploadPath)) {
        await mkdir(this.uploadPath, { recursive: true });
        this.logger.log(`Created upload directory: ${this.uploadPath}`);
      }
    } catch (error) {
      this.logger.error(`Failed to create upload directory: ${error.message}`, error.stack);
    }
  }

  /**
   * Xác minh quyền truy cập vườn
   */
  private async verifyGardenAccess(gardenerId: number, gardenId: number): Promise<void> {
    const garden = await this.prisma.garden.findFirst({
      where: { id: gardenId, gardenerId },
    });

    if (!garden) {
      throw new NotFoundException('Garden not found or access denied');
    }
  }

  /**
   * Lấy thống kê đánh giá ảnh
   */
  async getPhotoEvaluationStats(gardenerId: number): Promise<{
    total: number;
    evaluated: number;
    healthy: number;
    unhealthy: number;
    avgConfidence: number;
  }> {
    const [total, evaluated, healthyCount, avgConfidenceResult] = await Promise.all([
      this.prisma.photoEvaluation.count({
        where: { gardenerId },
      }),
      this.prisma.photoEvaluation.count({
        where: { gardenerId, evaluatedAt: { not: null } },
      }),
      this.prisma.photoEvaluation.count({
        where: {
          gardenerId,
          aiFeedback: { contains: 'khỏe mạnh' },
        },
      }),
      this.prisma.photoEvaluation.aggregate({
        where: { gardenerId, confidence: { not: null } },
        _avg: { confidence: true },
      }),
    ]);

    return {
      total,
      evaluated,
      healthy: healthyCount,
      unhealthy: evaluated - healthyCount,
      avgConfidence: avgConfidenceResult._avg.confidence || 0,
    };
  }
} 