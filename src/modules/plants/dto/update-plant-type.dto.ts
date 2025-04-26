import { PartialType } from '@nestjs/swagger';
import { CreatePlantTypeDto } from './create-plant-type.dto';

export class UpdatePlantTypeDto extends PartialType(CreatePlantTypeDto) {}
