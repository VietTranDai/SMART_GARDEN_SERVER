import { ApiProperty } from '@nestjs/swagger';
import { GardenActivityDto } from './garden-activity.dto';

export class PaginationMetaDto {
  @ApiProperty({ description: 'Tổng số mục' })
  totalItems: number;

  @ApiProperty({ description: 'Số mục trên mỗi trang' })
  itemsPerPage: number;

  @ApiProperty({ description: 'Trang hiện tại' })
  currentPage: number;

  @ApiProperty({ description: 'Tổng số trang' })
  totalPages: number;
}

export class PaginatedGardenActivitiesResultDto {
  @ApiProperty({
    type: [GardenActivityDto],
    description: 'Danh sách hoạt động',
  })
  items: GardenActivityDto[];

  @ApiProperty({ type: PaginationMetaDto, description: 'Thông tin phân trang' })
  meta: PaginationMetaDto;
}
