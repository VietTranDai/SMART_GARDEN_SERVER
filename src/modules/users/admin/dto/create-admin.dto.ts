import { ApiProperty } from '@nestjs/swagger';
import { IsNumber } from 'class-validator';

export class CreateAdminDto {
  @ApiProperty({
    description: 'The ID of the user to be assigned as admin',
    example: 1,
  })
  @IsNumber()
  userId: number;
}
