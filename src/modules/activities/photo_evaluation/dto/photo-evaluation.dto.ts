import { ApiProperty } from '@nestjs/swagger';
import { IsOptional, IsString, IsNumber, Min, Max, IsInt } from 'class-validator';
import { Transform } from 'class-transformer';
import { PhotoEvaluation, Garden, Gardener, GardenActivity, User } from '@prisma/client';

export class CreatePhotoEvaluationDto {
  @ApiProperty({ description: 'ID của nhiệm vụ liên quan', example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  taskId: number;

  @ApiProperty({ description: 'ID của vườn', example: 1 })
  @Transform(({ value }) => parseInt(value))
  @IsInt()
  gardenId: number;

  @ApiProperty({ description: 'ID của hoạt động vườn (tùy chọn)', example: 1, required: false })
  @IsOptional()
  @Transform(({ value }) => value ? parseInt(value) : undefined)
  @IsInt()
  gardenActivityId?: number;

  @ApiProperty({ description: 'Tên cây trồng (tùy chọn)', example: 'Cà chua', required: false })
  @IsOptional()
  @IsString()
  plantName?: string;

  @ApiProperty({ description: 'Giai đoạn phát triển của cây (tùy chọn)', example: 'Berries', required: false })
  @IsOptional()
  @IsString()
  plantGrowStage?: string;

  @ApiProperty({ description: 'Ghi chú bổ sung (tùy chọn)', example: 'Cây có vẻ khỏe mạnh', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class UpdatePhotoEvaluationDto {
  @ApiProperty({ description: 'Phản hồi AI (tùy chọn)', example: 'Lá bị vàng, kiểm tra tưới quá nước', required: false })
  @IsOptional()
  @IsString()
  aiFeedback?: string;

  @ApiProperty({ description: 'Độ tin cậy của AI (0-1)', example: 0.85, required: false })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1)
  confidence?: number;

  @ApiProperty({ description: 'Ghi chú bổ sung (tùy chọn)', example: 'Cập nhật sau khi đánh giá', required: false })
  @IsOptional()
  @IsString()
  notes?: string;
}

export class PhotoEvaluationResponseDto {
  @ApiProperty({ description: 'ID của đánh giá ảnh', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của nhiệm vụ liên quan', example: 1 })
  taskId: number;

  @ApiProperty({ description: 'ID của vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'Thông tin vườn' })
  garden: {
    id: number;
    name: string;
    description?: string;
  };

  @ApiProperty({ description: 'ID của người làm vườn', example: 1 })
  gardenerId: number;

  @ApiProperty({ description: 'Thông tin người làm vườn' })
  gardener: {
    user: {
      id: number;
      username: string;
      fullName: string;
      email: string;
    };
  };

  @ApiProperty({ description: 'ID của hoạt động vườn (tùy chọn)', example: 1, required: false })
  gardenActivityId?: number;

  @ApiProperty({ description: 'Thông tin hoạt động vườn (tùy chọn)', required: false })
  gardenActivity?: {
    id: number;
    activityType: string;
    description: string;
  };

  @ApiProperty({ description: 'Tên cây trồng (tùy chọn)', example: 'Cà chua', required: false })
  plantName?: string;

  @ApiProperty({ description: 'Giai đoạn phát triển của cây (tùy chọn)', example: 'Berries', required: false })
  plantGrowStage?: string;

  @ApiProperty({ description: 'URL của ảnh đã tải lên', example: 'photo_evaluations/1234567890.jpg' })
  photoUrl: string;

  @ApiProperty({ description: 'Phản hồi AI (tùy chọn)', example: 'Lá bị vàng, kiểm tra tưới quá nước', required: false })
  aiFeedback?: string;

  @ApiProperty({ description: 'Độ tin cậy của AI (0-1)', example: 0.85, required: false })
  confidence?: number;

  @ApiProperty({ description: 'Ghi chú bổ sung (tùy chọn)', example: 'Cây có vẻ khỏe mạnh', required: false })
  notes?: string;

  @ApiProperty({ description: 'Thời gian đánh giá (tùy chọn)', example: '2024-01-15T10:30:00Z', required: false })
  evaluatedAt?: Date;

  @ApiProperty({ description: 'Thời gian tạo', example: '2024-01-15T10:00:00Z' })
  createdAt: Date;

  @ApiProperty({ description: 'Thời gian cập nhật', example: '2024-01-15T10:30:00Z' })
  updatedAt: Date;
}

export class AIEvaluationDto {
  @ApiProperty({ description: 'Kết quả dự đoán từ AI', example: 'Tomato___Bacterial_spot' })
  prediction: string;

  @ApiProperty({ description: 'Độ tin cậy của dự đoán (0-1)', example: 0.95 })
  confidence: number;

  @ApiProperty({ description: 'Tên bệnh được phát hiện', example: 'Bacterial spot' })
  disease_name: string;

  @ApiProperty({ description: 'Loại cây được nhận diện', example: 'Tomato' })
  plant_type: string;

  @ApiProperty({ description: 'Mô tả chi tiết về bệnh', example: 'Bacterial spot is a common disease affecting tomato plants...' })
  description: string;

  @ApiProperty({ description: 'Gợi ý xử lý', example: 'Apply copper-based fungicide and improve air circulation' })
  treatment_suggestion: string;

  @ApiProperty({ description: 'Mức độ nghiêm trọng (1-5)', example: 3 })
  severity_level: number;

  @ApiProperty({ description: 'Trạng thái khỏe mạnh của cây', example: false })
  is_healthy: boolean;
}

export function mapToPhotoEvaluationResponseDto(
  photoEvaluation: PhotoEvaluation & {
    garden: Garden;
    gardener: Gardener & {
      user: User;
    };
    gardenActivity?: GardenActivity;
  },
): PhotoEvaluationResponseDto {
  return {
    id: photoEvaluation.id,
    taskId: photoEvaluation.taskId,
    gardenId: photoEvaluation.gardenId,
    garden: {
      id: photoEvaluation.garden.id,
      name: photoEvaluation.garden.name,
      description: photoEvaluation.garden.description || undefined,
    },
    gardenerId: photoEvaluation.gardenerId,
    gardener: {
      user: {
        id: photoEvaluation.gardener.user.id,
        username: photoEvaluation.gardener.user.username,
        fullName: `${photoEvaluation.gardener.user.firstName} ${photoEvaluation.gardener.user.lastName}`,
        email: photoEvaluation.gardener.user.email,
      },
    },
    gardenActivityId: photoEvaluation.gardenActivityId || undefined,
    gardenActivity: photoEvaluation.gardenActivity ? {
      id: photoEvaluation.gardenActivity.id,
      activityType: photoEvaluation.gardenActivity.activityType,
      description: photoEvaluation.gardenActivity.notes || '',
    } : undefined,
    plantName: photoEvaluation.plantName || undefined,
    plantGrowStage: photoEvaluation.plantGrowStage || undefined,
    photoUrl: photoEvaluation.photoUrl,
    aiFeedback: photoEvaluation.aiFeedback || undefined,
    confidence: photoEvaluation.confidence || undefined,
    notes: photoEvaluation.notes || undefined,
    evaluatedAt: photoEvaluation.evaluatedAt || undefined,
    createdAt: photoEvaluation.createdAt,
    updatedAt: photoEvaluation.updatedAt,
  };
} 