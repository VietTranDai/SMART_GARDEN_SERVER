import { PartialType } from '@nestjs/swagger';
import { CreateAdminDto } from './create-admin.dto';

// This is an empty class since there are no specific fields
// to update for the Admin entity besides the user fields,
// which are handled by the UserService

export class UpdateAdminDto extends PartialType(CreateAdminDto) {}
