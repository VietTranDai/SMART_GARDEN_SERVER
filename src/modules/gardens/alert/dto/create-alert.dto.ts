// src/modules/alerts/dto/create-alert.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { AlertStatus, Severity, AlertType } from '@prisma/client';

export class CreateAlertDto {
  @ApiPropertyOptional({ description: 'ID của garden (nếu áp dụng)', example: 10 })
  gardenId?: number;

  @ApiProperty({ description: 'ID của user tạo alert', example: 5 })
  userId: number;

  @ApiProperty({ description: 'Loại alert', enum: AlertType })
  type: AlertType;

  @ApiProperty({ description: 'Nội dung thông báo', example: 'Temperature too high' })
  message: string;

  @ApiPropertyOptional({ description: 'Gợi ý xử lý', example: 'Turn on the fan' })
  suggestion?: string;

  @ApiPropertyOptional({ description: 'Trạng thái khởi tạo', enum: AlertStatus, example: AlertStatus.PENDING })
  status?: AlertStatus;

  @ApiPropertyOptional({ description: 'Mức độ ưu tiên', enum: Severity, example: Severity.LOW })
  severity?: Severity;
}
