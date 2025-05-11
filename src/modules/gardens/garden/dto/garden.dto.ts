// src/garden/dto/garden.dto.ts
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  GardenStatus,
  GardenType,
  Garden as GardenModel,
  Gardener,
  User,
  Role,
  ExperienceLevel,
} from '@prisma/client';
import { GardenerDto, mapToGardenerDto } from '../../../users/gardener/dto';

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
    type: () => GardenerDto,
  })
  gardener: GardenerDto;

  @ApiProperty({
    description: 'Type of garden',
    enum: GardenType,
    example: GardenType.BALCONY,
  })
  type: GardenType;

  @ApiProperty({
    description: 'Current status of the garden',
    enum: GardenStatus,
    example: GardenStatus.ACTIVE,
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

  @ApiPropertyOptional({
    description:
      'Number of days until the plant is expected to be ready for harvest',
    example: 45,
  })
  daysUntilHarvest: number;

  @ApiPropertyOptional({
    description: 'Percentage of growth progress from planting to harvest',
    example: 50,
  })
  growthProgress: number;

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

  @ApiProperty({
    description: 'Number of sensors in the garden',
    example: 1,
  })
  sensorCount: number;
}

/**
 * Chuyển đổi entity Garden thành GardenDto
 */
export function mapToGardenDto(
  garden: GardenModel & {
    gardener: Gardener & {
      user: User & { role: Role };
      experienceLevel: ExperienceLevel;
    };
  },
  sensorCounts: number | null,
): GardenDto {
  const dto = new GardenDto();

  dto.id = garden.id;
  dto.gardenKey = garden.gardenKey;
  dto.name = garden.name;
  dto.profilePicture = garden.profilePicture;
  dto.description = garden.description;
  dto.street = garden.street;
  dto.ward = garden.ward;
  dto.district = garden.district;
  dto.city = garden.city;
  dto.lat = garden.lat;
  dto.lng = garden.lng;

  dto.gardenerId = garden.gardenerId;
  dto.gardener = mapToGardenerDto(garden.gardener as any);

  dto.type = garden.type;
  dto.status = garden.status;

  dto.plantName = garden.plantName;
  dto.plantGrowStage = garden.plantGrowStage;
  dto.plantStartDate = garden.plantStartDate;
  dto.plantDuration = garden.plantDuration;

  // Calculate garden statistics
  const { daysUntilHarvest, growthProgress } =
    calculateGardenStatistics(garden);
  dto.daysUntilHarvest = daysUntilHarvest;
  dto.growthProgress = growthProgress;

  dto.createdAt = garden.createdAt;
  dto.updatedAt = garden.updatedAt;

  if (sensorCounts) {
    dto.sensorCount = sensorCounts;
  } else {
    dto.sensorCount = 0;
  }

  return dto;
}

/**
 * Calculate garden statistics
 * @param garden Garden object
 * @returns Object containing days until harvest and growth progress
 */
function calculateGardenStatistics(garden: GardenModel): {
  daysUntilHarvest: number;
  growthProgress: number;
} {
  let daysUntilHarvest = 0;
  let growthProgress = 0;

  // plantDuration in Garden model should represent the sum of durations
  // from all growth stages of the plant being grown
  if (garden.plantStartDate && garden.plantDuration) {
    const currentDate = new Date();
    const startDate = new Date(garden.plantStartDate);

    // The total duration is stored directly in garden.plantDuration
    // This value should be populated from the Plant model's growthStages
    // when the plant is added to the garden
    const totalDuration = garden.plantDuration;

    // Calculate days elapsed since planting
    const elapsed = Math.floor(
      (currentDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Calculate days until harvest (min is 0) and round to 2 decimal places
    daysUntilHarvest = parseFloat(
      Math.max(0, totalDuration - elapsed).toFixed(2),
    );

    // Calculate growth progress percentage (cap at 100%) and round to 2 decimal places
    growthProgress = parseFloat(
      Math.min(100, Math.max(0, (elapsed / totalDuration) * 100)).toFixed(2),
    );
  }

  return { daysUntilHarvest, growthProgress };
}
