import { PartialType } from '@nestjs/mapped-types';
import { CreateGardenDto } from './create-garden.dto';
import { ApiPropertyOptional } from '@nestjs/swagger';

// UpdateGardenDto extends CreateGardenDto but makes all properties optional
export class UpdateGardenDto extends PartialType(CreateGardenDto) {
  // All fields are inherited from CreateGardenDto but are optional through PartialType
}
