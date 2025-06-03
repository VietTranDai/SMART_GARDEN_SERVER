import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsDateString } from 'class-validator';

export interface WateringDecisionDto {
  decision: string;
  confidence: number;
  reasons: string[];
  recommended_amount: number;
  sensor_data: SensorDataForRequestModelAIDto;
  timestamp: Date;
}

export interface WateringStatsDto {
  gardenId: number;
  totalDecisions: number;
  waterRecommendations: number;
  noWaterRecommendations: number;
  averageConfidence: number;
  averageWaterAmount: number;
  fromDate: Date;
  toDate: Date;
}

export class SensorDataForRequestModelAIDto {
  @ApiProperty({ description: 'Độ ẩm đất (%)', example: 35.5 })
  soil_moisture: number;

  @ApiProperty({ description: 'Độ ẩm không khí (%)', example: 65.2 })
  air_humidity: number;

  @ApiProperty({ description: 'Nhiệt độ (°C)', example: 28.3 })
  temperature: number;

  @ApiProperty({ description: 'Cường độ ánh sáng (lux)', example: 15000 })
  light_intensity: number;

  @ApiProperty({ description: 'Mức nước trong bể (%)', example: 50 })
  water_level: number;
}

export class WateringDecisionDto {
  @ApiProperty({ description: 'Quyết định tưới nước', example: 'water_now' })
  decision: string;

  @ApiProperty({ description: 'Độ tin cậy (%)', example: 85.3 })
  confidence: number;

  @ApiProperty({ description: 'Lý do quyết định', type: [String] })
  reasons: string[];

  @ApiProperty({ description: 'Lượng nước đề xuất (lít)', example: 2.5 })
  recommended_amount: number;

  @ApiProperty({ description: 'Dữ liệu cảm biến đầu vào' })
  sensor_data: SensorDataForRequestModelAIDto;

  @ApiProperty({ description: 'Thời gian phân tích', type: String, format: 'date-time' })
  timestamp: Date;
}

export class WateringStatsDto {
  @ApiProperty({ description: 'ID vườn', example: 1 })
  gardenId: number;

  @ApiProperty({ description: 'Tổng số quyết định trong khoảng thời gian', example: 45 })
  totalDecisions: number;

  @ApiProperty({ description: 'Số lần đề xuất tưới', example: 20 })
  waterRecommendations: number;

  @ApiProperty({ description: 'Số lần đề xuất không tưới', example: 25 })
  noWaterRecommendations: number;

  @ApiProperty({ description: 'Độ tin cậy trung bình (%)', example: 78.5 })
  averageConfidence: number;

  @ApiProperty({ description: 'Lượng nước đề xuất trung bình (lít)', example: 2.8 })
  averageWaterAmount: number;

  @ApiProperty({ description: 'Thời gian bắt đầu thống kê', type: String, format: 'date-time' })
  fromDate: Date;

  @ApiProperty({ description: 'Thời gian kết thúc thống kê', type: String, format: 'date-time' })
  toDate: Date;
}

export class WateringDecisionRequestDto {
  @ApiPropertyOptional({ 
    description: 'Thời gian dự định tưới nước (ISO 8601 format). Nếu không truyền sẽ dùng thời gian hiện tại',
    example: '2024-01-15T14:30:00.000Z',
    type: String,
    format: 'date-time'
  })
  @IsOptional()
  @IsDateString()
  wateringTime?: string;

  @ApiPropertyOptional({ 
    description: 'Ghi chú bổ sung cho quyết định tưới nước',
    example: 'Kiểm tra tưới nước buổi chiều'
  })
  @IsOptional()
  notes?: string;
} 