import { ApiProperty } from '@nestjs/swagger';
import {
  IsInt,
  IsDate,
  IsString,
  IsOptional,
  IsArray,
  ValidateNested,
  Min,
  IsEmail,
} from 'class-validator';
import { Type } from 'class-transformer';
import { ExperienceLevelDto } from 'src/modules/users/experience_level/dto/experience-level.dto';

export class FollowDto {
  @ApiProperty({ description: 'ID của người theo dõi', example: 1 })
  @IsInt()
  @Min(1)
  followerId: number;

  @ApiProperty({ description: 'ID của người được theo dõi', example: 2 })
  @IsInt()
  @Min(1)
  followedId: number;

  @ApiProperty({
    description: 'Thời gian bắt đầu theo dõi',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class GardenerDto {
  @ApiProperty({ description: 'ID của người làm vườn', example: 1 })
  @IsInt()
  @Min(1)
  id: number;

  @ApiProperty({ description: 'Họ và tên', example: 'Nguyễn Văn A' })
  @IsString()
  name: string;

  @ApiProperty({
    description: 'Avatar URL',
    example: 'https://example.com/avatar.jpg',
    required: false,
  })
  @IsOptional()
  @IsString()
  avatarUrl?: string;

  @ApiProperty({
    description: 'Email của người làm vườn',
    example: 'a.nguyen@example.com',
  })
  @IsEmail()
  email: string;

  @ApiProperty({
    description: 'Tên đăng nhập (username)',
    example: 'nguyenvana',
  })
  @IsString()
  username: string;

  @ApiProperty({
    description: 'Số điện thoại',
    example: '0123456789',
    required: false,
  })
  @IsOptional()
  @IsString()
  phoneNumber?: string;

  @ApiProperty({
    description: 'Ngày sinh',
    type: String,
    format: 'date-time',
    required: false,
  })
  @IsOptional()
  @IsDate()
  @Type(() => Date)
  dateOfBirth?: Date;

  @ApiProperty({
    description: 'Tiểu sử/ngắn gọn về người làm vườn',
    example: 'Yêu thích trồng hoa và rau sạch',
    required: false,
  })
  @IsOptional()
  @IsString()
  bio?: string;

  @ApiProperty({ description: 'Số điểm kinh nghiệm', example: 150 })
  @IsInt()
  experiencePoints: number;

  @ApiProperty({ description: 'Thông tin cấp độ kinh nghiệm' })
  @ValidateNested()
  @Type(() => ExperienceLevelDto)
  experienceLevel: ExperienceLevelDto;

  @ApiProperty({
    description: 'Ngày tạo tài khoản',
    type: String,
    format: 'date-time',
  })
  @IsDate()
  @Type(() => Date)
  createdAt: Date;
}

export class FollowerListDto {
  @ApiProperty({
    description: 'Danh sách người theo dõi',
    type: [GardenerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GardenerDto)
  followers: GardenerDto[];

  @ApiProperty({ description: 'Tổng số người theo dõi', example: 42 })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Số lượng người theo dõi trên một trang',
    example: 10,
  })
  @IsInt()
  @Min(1)
  limit: number;
}

export class FollowingListDto {
  @ApiProperty({
    description: 'Danh sách người đang theo dõi',
    type: [GardenerDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => GardenerDto)
  following: GardenerDto[];

  @ApiProperty({ description: 'Tổng số người đang theo dõi', example: 35 })
  @IsInt()
  @Min(0)
  total: number;

  @ApiProperty({ description: 'Trang hiện tại', example: 1 })
  @IsInt()
  @Min(1)
  page: number;

  @ApiProperty({
    description: 'Số lượng người đang theo dõi trên một trang',
    example: 10,
  })
  @IsInt()
  @Min(1)
  limit: number;
}
