// src/modules/alerts/dto/update-alert.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateAlertDto } from './create-alert.dto';

export class UpdateAlertDto extends PartialType(CreateAlertDto) {}