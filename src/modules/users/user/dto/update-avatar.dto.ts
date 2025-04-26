import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class UpdateAvatarDto {
  @ApiProperty({
    description: 'URL of the uploaded avatar image',
    example: 'https://example.com/avatars/user123.jpg',
  })
  @IsNotEmpty()
  @IsString()
  @IsUrl()
  imageUrl: string;
}
