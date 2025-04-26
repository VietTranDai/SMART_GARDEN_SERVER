import { ApiProperty } from '@nestjs/swagger';
import { ExperienceLevelDto } from '../../experience_level/dto';

export class GardenerUserDto {
  @ApiProperty({ description: 'First name', example: 'John' })
  firstName: string;

  @ApiProperty({ description: 'Last name', example: 'Doe' })
  lastName: string;

  @ApiProperty({ description: 'Username', example: 'johndoe' })
  username: string;

  @ApiProperty({ description: 'Email address', example: 'john@example.com' })
  email: string;

  @ApiProperty({
    description: 'Profile picture URL',
    example: 'https://example.com/images/profile.jpg',
    required: false,
  })
  profilePicture?: string;
}

export class GardenerDto {
  @ApiProperty({ description: 'User ID', example: 1 })
  userId: number;

  @ApiProperty({ description: 'Experience points', example: 150 })
  experiencePoints: number;

  @ApiProperty({ description: 'Experience level ID', example: 2 })
  experienceLevelId: number;

  @ApiProperty({
    description: 'Experience level information',
    type: ExperienceLevelDto,
  })
  experienceLevel: ExperienceLevelDto;

  @ApiProperty({
    description: 'User information',
    type: GardenerUserDto,
  })
  user: GardenerUserDto;
}

export class ExperienceAddedResponseDto {
  @ApiProperty({
    description: 'Gardener information after XP update',
    type: GardenerDto,
  })
  gardener: GardenerDto;

  @ApiProperty({
    description: 'Whether the gardener leveled up',
    example: true,
  })
  levelUp: boolean;

  @ApiProperty({
    description: 'Previous experience level',
    type: ExperienceLevelDto,
  })
  oldLevel: ExperienceLevelDto;

  @ApiProperty({
    description: 'New experience level',
    type: ExperienceLevelDto,
  })
  newLevel: ExperienceLevelDto;

  @ApiProperty({
    description: 'Experience points added',
    example: 50,
  })
  pointsAdded: number;

  @ApiProperty({
    description: 'Total experience points after update',
    example: 200,
  })
  totalPoints: number;
}

export class LevelProgressDto {
  @ApiProperty({
    description: 'Current experience level',
    type: ExperienceLevelDto,
  })
  currentLevel: ExperienceLevelDto;

  @ApiProperty({
    description: 'Next experience level',
    type: ExperienceLevelDto,
    nullable: true,
  })
  nextLevel: ExperienceLevelDto | null;

  @ApiProperty({
    description: 'Current experience points',
    example: 150,
  })
  currentXP: number;

  @ApiProperty({
    description: 'Experience points needed to reach next level',
    example: 50,
  })
  xpToNextLevel: number;

  @ApiProperty({
    description: 'Progress percentage towards next level',
    example: 75,
  })
  progress: number;

  @ApiProperty({
    description: 'Whether gardener is at maximum level',
    example: false,
  })
  isMaxLevel: boolean;
}
