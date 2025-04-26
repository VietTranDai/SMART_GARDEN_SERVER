import { ApiProperty } from '@nestjs/swagger';

export class PostImageDto {
  @ApiProperty({ description: 'ID của hình ảnh', example: 1 })
  id: number;

  @ApiProperty({ description: 'ID của bài viết', example: 1 })
  postId: number;

  @ApiProperty({
    description: 'URL của hình ảnh',
    example: 'https://example.com/images/tomato.jpg',
  })
  url: string;
}
