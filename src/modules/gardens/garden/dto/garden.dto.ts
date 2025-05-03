import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { GardenStatus, GardenType } from '@prisma/client';
import { GardenerDto } from '../../../users/gardener/dto';

export class GardenDto {
  @ApiProperty({
    description: 'Unique ID for the garden',
    example: 1,
  })
  id: number;

  @ApiProperty({
    description: 'Unique key for the garden, used for external access',
    example: 'garden_1a2b3c4d-5e6f-7g8h-9i0j-1k2l3m4n5o6p',
  })
  gardenKey: string;

  @ApiProperty({
    description: 'Name of the garden',
    example: 'My Balcony Garden',
  })
  name: string;

  @ApiProperty({
    description: 'Profile picture of the garden, used for display purposes',
    example: '/example.com/profile-picture.jpg',
  })
  profilePicture: string | null;

  @ApiProperty({
    description: 'Short description of the garden, used for display purposes',
    example: 'My Balcony Garden',
  })
  description: string | null;
  
  @ApiPropertyOptional({
    description: 'Street address of the garden',
    example: '123 Garden Street',
  })
  street: string | null;

  @ApiPropertyOptional({
    description: 'Ward/neighborhood of the garden',
    example: 'Ward 10',
  })
  ward: string | null;

  @ApiPropertyOptional({
    description: 'District of the garden',
    example: 'District 1',
  })
  district: string | null;

  @ApiPropertyOptional({
    description: 'City of the garden',
    example: 'Ho Chi Minh City',
  })
  city: string | null;

  @ApiPropertyOptional({
    description: 'Latitude coordinate of the garden',
    example: 10.762622,
  })
  lat: number | null;

  @ApiPropertyOptional({
    description: 'Longitude coordinate of the garden',
    example: 106.660172,
  })
  lng: number | null;

  @ApiProperty({
    description: 'ID of the gardener who owns this garden',
    example: 1,
  })
  gardenerId: number;

  @ApiProperty({
    description: 'Gardener information',
    type: GardenerDto,
  })
  gardener: GardenerDto;

  @ApiProperty({
    description: 'Type of garden',
    enum: GardenType,
    example: 'BALCONY',
  })
  type: GardenType;

  @ApiProperty({
    description: 'Current status of the garden',
    enum: GardenStatus,
    example: 'ACTIVE',
  })
  status: GardenStatus;

  @ApiPropertyOptional({
    description: 'Name of the plant in this garden',
    example: 'Tomato',
  })
  plantName: string | null;

  @ApiPropertyOptional({
    description: 'Current growth stage of the plant',
    example: 'Seedling',
  })
  plantGrowStage: string | null;

  @ApiPropertyOptional({
    description: 'Date when the plant was started',
    example: '2023-08-15T00:00:00.000Z',
    type: String,
    format: 'date-time',
  })
  plantStartDate: Date | null;

  @ApiPropertyOptional({
    description: 'Expected duration in days for the plant to grow to harvest',
    example: 90,
  })
  plantDuration: number | null;

  @ApiProperty({
    description: 'When the garden was created',
    example: '2023-08-15T08:30:00.000Z',
    type: String,
    format: 'date-time',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the garden was last updated',
    example: '2023-08-20T10:15:00.000Z',
    type: String,
    format: 'date-time',
  })
  updatedAt: Date;
}
