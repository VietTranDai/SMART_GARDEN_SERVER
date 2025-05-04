// src/modules/garden/dto/gardener-profile.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { GardenerDto } from './gardener.dto';

/**
 * Full gardener profile: user info, experience, and all stats
 */
export class GardenerProfileDto extends GardenerDto {
  @ApiProperty({ description: 'Total gardens count', example: 5 })
  gardens: number;

  @ApiProperty({ description: 'Total posts count', example: 12 })
  posts: number;

  @ApiProperty({ description: 'Followers count', example: 30 })
  followers: number;

  @ApiProperty({ description: 'Following count', example: 10 })
  following: number;

  @ApiProperty({ description: 'Active gardens count', example: 3 })
  activeGardens: number;

  @ApiProperty({ description: 'Inactive gardens count', example: 2 })
  inactiveGardens: number;

  @ApiProperty({ description: 'Indoor gardens count', example: 1 })
  indoorGardens: number;

  @ApiProperty({ description: 'Outdoor gardens count', example: 4 })
  outdoorGardens: number;

  @ApiProperty({ description: 'Total activities count', example: 50 })
  totalActivities: number;

  @ApiProperty({ description: 'Activities grouped by type' })
  activitiesByType: Record<string, number>;

  @ApiProperty({ description: 'Completed tasks count', example: 20 })
  completedTasks: number;

  @ApiProperty({ description: 'Pending tasks count', example: 5 })
  pendingTasks: number;

  @ApiProperty({ description: 'Skipped tasks count', example: 2 })
  skippedTasks: number;

  @ApiProperty({ description: 'Task completion rate (%)', example: 80 })
  taskCompletionRate: number;

  @ApiProperty({ description: 'Total votes received on posts', example: 100 })
  totalVotesReceived: number;

  @ApiProperty({ description: 'Total comments received on posts', example: 40 })
  totalCommentsReceived: number;

  @ApiProperty({ description: 'Average post rating', example: 4.5 })
  averagePostRating: number;

  @ApiProperty({ description: 'Total photo evaluations for tasks', example: 8 })
  totalPhotoEvaluations: number;

  @ApiProperty({ description: 'Plant types count', example: 3 })
  plantTypesCount: number;

  @ApiProperty({ description: 'Most grown plant types', example: ['Tomato', 'Basil'] })
  mostGrownPlantTypes: string[];

  @ApiProperty({ description: 'XP to next level', example: 150 })
  experiencePointsToNextLevel: number;

  @ApiProperty({ description: 'Experience progress to next level (%)', example: 60 })
  experienceLevelProgress: number;

  @ApiProperty({ description: 'Joined since date', example: '2024-01-15T08:00:00Z' })
  joinedSince: string;

  @ApiProperty({ description: 'Whether current user is following this gardener', example: false })
  isFollowing: boolean;
}

/**
 * Helper to map database entities and computed stats into GardenerProfileDto
 */
export function mapToGardenerProfileDto(
  user: {
    id: number;
    firstName: string;
    lastName: string;
    email: string;
    username: string;
    phoneNumber?: string;
    dateOfBirth?: Date;
    lastLogin?: Date;
    profilePicture?: string;
    address?: string;
    bio?: string;
    createdAt: Date;
    updatedAt: Date;
    role: { id: number; name: string; description?: string };
  },
  gardener: {
    experiencePoints: number;
    experienceLevel: {
      id: number;
      level: number;
      minXP: number;
      maxXP: number;
      title: string;
      description: string;
      icon: string;
    };
  },
  stats: {
    gardens: number;
    posts: number;
    followers: number;
    following: number;
    activeGardens: number;
    inactiveGardens: number;
    indoorGardens: number;
    outdoorGardens: number;
    totalActivities: number;
    activitiesByType: Record<string, number>;
    completedTasks: number;
    pendingTasks: number;
    skippedTasks: number;
    taskCompletionRate: number;
    totalVotesReceived: number;
    totalCommentsReceived: number;
    averagePostRating: number;
    totalPhotoEvaluations: number;
    plantTypesCount: number;
    mostGrownPlantTypes: string[];
    experiencePointsToNextLevel: number;
    experienceLevelProgress: number;
    joinedSince: string;
    isFollowing: boolean;
  }
): GardenerProfileDto {
  const dto = new GardenerProfileDto();

  // Map User fields
  dto.id = user.id;
  dto.firstName = user.firstName;
  dto.lastName = user.lastName;
  dto.email = user.email;
  dto.username = user.username;
  dto.phoneNumber = user.phoneNumber;
  dto.dateOfBirth = user.dateOfBirth?.toISOString();
  dto.lastLogin = user.lastLogin?.toISOString();
  dto.profilePicture = user.profilePicture;
  dto.address = user.address;
  dto.bio = user.bio;
  dto.createdAt = user.createdAt.toISOString();
  dto.updatedAt = user.updatedAt.toISOString();
  dto.role = user.role;

  // Map Gardener fields
  dto.experiencePoints = gardener.experiencePoints;
  dto.experienceLevel = gardener.experienceLevel;

  // Map Stats fields
  dto.gardens = stats.gardens;
  dto.posts = stats.posts;
  dto.followers = stats.followers;
  dto.following = stats.following;
  dto.activeGardens = stats.activeGardens;
  dto.inactiveGardens = stats.inactiveGardens;
  dto.indoorGardens = stats.indoorGardens;
  dto.outdoorGardens = stats.outdoorGardens;
  dto.totalActivities = stats.totalActivities;
  dto.activitiesByType = stats.activitiesByType;
  dto.completedTasks = stats.completedTasks;
  dto.pendingTasks = stats.pendingTasks;
  dto.skippedTasks = stats.skippedTasks;
  dto.taskCompletionRate = stats.taskCompletionRate;
  dto.totalVotesReceived = stats.totalVotesReceived;
  dto.totalCommentsReceived = stats.totalCommentsReceived;
  dto.averagePostRating = stats.averagePostRating;
  dto.totalPhotoEvaluations = stats.totalPhotoEvaluations;
  dto.plantTypesCount = stats.plantTypesCount;
  dto.mostGrownPlantTypes = stats.mostGrownPlantTypes;
  dto.experiencePointsToNextLevel = stats.experiencePointsToNextLevel;
  dto.experienceLevelProgress = stats.experienceLevelProgress;
  dto.joinedSince = stats.joinedSince;
  dto.isFollowing = stats.isFollowing;

  return dto;
}