// src/gardener/dto/gardener.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { UserDto } from '../../user/dto';
import { ExperienceLevelDto, mapToExperienceLevelDto } from '../../experience_level';
import { ExperienceLevel, Gardener, Role, User } from '@prisma/client';
import { mapToRoleDto } from '../../role/dto/role.dto';

export class GardenerDto extends UserDto {
  @ApiProperty({
    description: 'Total experience points accumulated by the gardener',
    example: 150,
  })
  experiencePoints: number;

  @ApiProperty({
    description: 'Detailed experience level information',
    type: () => ExperienceLevelDto,
  })
  experienceLevel: ExperienceLevelDto;
}

/**
 * Chuyển đổi entity Gardener thành GardenerDto
 */
export function mapToGardenerDto(
  gardener: Gardener & {
    user: User & { role: Role };
    experienceLevel: ExperienceLevel;
  }
): GardenerDto {
  const dto = new GardenerDto();

  // Map các trường UserDto
  dto.id = gardener.user.id;
  dto.username = gardener.user.username;
  dto.firstName = gardener.user.firstName;
  dto.lastName = gardener.user.lastName;
  dto.email = gardener.user.email;
  dto.phoneNumber = gardener.user.phoneNumber ?? undefined;
  dto.dateOfBirth = gardener.user.dateOfBirth
    ? gardener.user.dateOfBirth.toISOString().split('T')[0]
    : undefined;
  dto.profilePicture = gardener.user.profilePicture ?? undefined;
  dto.address = gardener.user.address ?? undefined;
  dto.bio = gardener.user.bio ?? undefined;
  dto.roleId = gardener.user.roleId;
  dto.role = mapToRoleDto(gardener.user.role);
  dto.lastLogin = gardener.user.lastLogin
    ? gardener.user.lastLogin.toISOString()
    : undefined;
  dto.createdAt = gardener.user.createdAt.toISOString();
  dto.updatedAt = gardener.user.updatedAt.toISOString();

  // Map các trường riêng của Gardener
  dto.experiencePoints = gardener.experiencePoints;
  dto.experienceLevel = mapToExperienceLevelDto(gardener.experienceLevel);

  return dto;
}