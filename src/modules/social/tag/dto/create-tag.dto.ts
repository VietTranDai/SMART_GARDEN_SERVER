import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, MaxLength } from 'class-validator';

export class CreateTagDto {
  @ApiProperty({ description: 'Tên thẻ', example: 'Cà chua' })
  @IsNotEmpty()
  @IsString()
  @MaxLength(50)
  name: string;
}
