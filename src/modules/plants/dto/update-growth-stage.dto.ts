import { PartialType, OmitType } from '@nestjs/swagger';
import { CreateGrowthStageDto } from './create-growth-stage.dto';

// Omit plantTypeId for updates as it shouldn't change
export class UpdateGrowthStageDto extends PartialType(
  OmitType(CreateGrowthStageDto, ['plantTypeId'] as const),
) {}
