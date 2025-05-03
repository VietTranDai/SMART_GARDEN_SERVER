import { PartialType } from '@nestjs/mapped-types';
import { CreateGrowthStageDto } from './create-growth-stage.dto';

// Omit plantTypeId for updates as it shouldn't change
export class UpdateGrowthStageDto extends PartialType(CreateGrowthStageDto) {}
