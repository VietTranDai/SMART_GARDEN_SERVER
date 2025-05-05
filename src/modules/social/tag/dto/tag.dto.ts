import { ApiProperty } from '@nestjs/swagger';
import { Tag } from '@prisma/client';

export class TagDto {
  @ApiProperty({ description: 'ID của thẻ', example: 1 })
  id: number;

  @ApiProperty({ description: 'Tên thẻ', example: 'Cà chua' })
  name: string;
}

export class TagWithPostCountDto extends TagDto {
  @ApiProperty({ description: 'Số lượng bài viết sử dụng thẻ này', example: 5 })
  postCount: number;
}

export function mapToTagDto(tag: Tag): TagDto {
  return {
    id: tag.id,
    name: tag.name,
  };
}
