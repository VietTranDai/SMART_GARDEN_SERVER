import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export class CreateEvaluationDto {
  @ApiPropertyOptional({
    description:
      'ID của người làm vườn thực hiện đánh giá (nếu khác người dùng hiện tại, ví dụ: admin đánh giá hộ). Mặc định là ID người dùng đang xác thực.',
    example: 1,
  })
  @IsOptional()
  @IsInt()
  gardenerId?: number;

  @ApiPropertyOptional({
    description:
      'Kết quả/Hậu quả của hoạt động (ví dụ: Cây phát triển tốt, Sâu bệnh giảm)',
    example: 'Cây phát triển tốt sau khi tưới nước.',
  })
  @IsOptional()
  @IsString()
  outcome?: string;

  @ApiPropertyOptional({
    description: 'Điểm đánh giá cho hoạt động (ví dụ: thang 1-5)',
    example: 5,
    minimum: 1,
    maximum: 5,
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(5)
  rating?: number;

  @ApiPropertyOptional({
    description: 'Bình luận hoặc ghi chú chi tiết về đánh giá',
    example: 'Hoạt động được thực hiện đúng kỹ thuật, đúng thời điểm.',
  })
  @IsOptional()
  @IsString()
  comments?: string;

  // Có thể thêm các metrics cụ thể khác tùy theo loại hoạt động
  // Ví dụ: @ApiPropertyOptional({ description: 'Độ ẩm đất sau khi tưới (%)', example: 60 })
  // @IsOptional() @IsNumber() soilMoistureAfter?: number;
}
