import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsString,
  IsOptional,
  IsEnum,
  MaxLength,
  Min,
  Max,
  IsNumber,
  IsLatitude,
  IsLongitude,
} from 'class-validator';
import { GardenType } from '@prisma/client';

export class CreateGardenDto {
  @ApiProperty({
    description: 'Name of the garden',
    example: 'My Balcony Garden',
    maxLength: 100,
  })
  @IsString()
  @MaxLength(100)
  name: string;

  @ApiPropertyOptional({
    description: 'Street address of the garden',
    example: '123 Garden Street',
    maxLength: 200,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(200)
  street?: string;

  @ApiPropertyOptional({
    description: 'Ward/neighborhood of the garden',
    example: 'Ward 10',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  ward?: string;

  @ApiPropertyOptional({
    description: 'District of the garden',
    example: 'District 1',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  district?: string;

  @ApiPropertyOptional({
    description: 'City of the garden',
    example: 'Ho Chi Minh City',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  city?: string;

  @ApiPropertyOptional({
    description: 'Latitude coordinate of the garden',
    example: 10.762622,
    required: false,
  })
  @IsLatitude()
  @IsOptional()
  lat?: number;

  @ApiPropertyOptional({
    description: 'Longitude coordinate of the garden',
    example: 106.660172,
    required: false,
  })
  @IsLongitude()
  @IsOptional()
  lng?: number;

  @ApiPropertyOptional({
    description: 'Type of garden',
    enum: GardenType,
    example: 'BALCONY',
    default: 'OUTDOOR',
    required: false,
  })
  @IsEnum(GardenType)
  @IsOptional()
  type?: GardenType;

  @ApiPropertyOptional({
    description: 'Name of the plant in this garden',
    example: 'Tomato',
    maxLength: 100,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(100)
  plantName?: string;

  @ApiPropertyOptional({
    description: 'Current growth stage of the plant',
    example: 'Seedling',
    maxLength: 50,
    required: false,
  })
  @IsString()
  @IsOptional()
  @MaxLength(50)
  plantGrowStage?: string;
}
