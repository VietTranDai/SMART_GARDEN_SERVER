import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  IsNumber,
  IsDateString,
  IsUUID,
  MaxLength,
} from 'class-validator';
import { GardenStatus, GardenType } from '@prisma/client';

export class CreateGardenDto {
  @ApiProperty({ description: 'Garden name', example: 'My Tomato Garden' })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Garden key for IoT devices',
    example: 'garden-001',
  })
  @IsString()
  @IsOptional()
  gardenKey?: string;

  @ApiPropertyOptional({
    description: 'Garden description',
    example: 'A small garden for growing tomatoes',
  })
  @IsString()
  @IsOptional()
  @MaxLength(500)
  description?: string;

  @ApiPropertyOptional({
    description: 'Garden street',
    example: '123 Garden Street',
  })
  @IsString()
  @IsOptional()
  street?: string;

  @ApiPropertyOptional({ description: 'Garden ward', example: 'Green Ward' })
  @IsString()
  @IsOptional()
  ward?: string;

  @ApiPropertyOptional({
    description: 'Garden district',
    example: 'Garden District',
  })
  @IsString()
  @IsOptional()
  district?: string;

  @ApiPropertyOptional({ description: 'Garden city', example: 'Garden City' })
  @IsString()
  @IsOptional()
  city?: string;

  @ApiPropertyOptional({ description: 'Garden latitude', example: 10.762622 })
  @IsNumber()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({ description: 'Garden longitude', example: 106.660172 })
  @IsNumber()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Garden profile picture URL',
    example: 'https://example.com/garden.jpg',
  })
  @IsString()
  @IsOptional()
  profilePicture?: string;

  @ApiPropertyOptional({
    description: 'Garden type',
    enum: GardenType,
    example: GardenType.OUTDOOR,
  })
  @IsEnum(GardenType)
  @IsOptional()
  type?: GardenType;

  @ApiPropertyOptional({
    description: 'Garden status',
    enum: GardenStatus,
    example: GardenStatus.ACTIVE,
  })
  @IsEnum(GardenStatus)
  @IsOptional()
  status?: GardenStatus;

  @ApiPropertyOptional({ description: 'Plant name', example: 'Tomato' })
  @IsString()
  @IsOptional()
  plantName?: string;

  @ApiPropertyOptional({
    description: 'Plant growth stage',
    example: 'Seeding',
  })
  @IsString()
  @IsOptional()
  plantGrowStage?: string;

  @ApiPropertyOptional({
    description: 'Plant start date (ISO format)',
    example: '2023-04-15T00:00:00Z',
  })
  @IsDateString()
  @IsOptional()
  plantStartDate?: string;

  @ApiPropertyOptional({
    description: 'Plant duration in days',
    example: 90,
  })
  @IsNumber()
  @IsOptional()
  plantDuration?: number;
}
