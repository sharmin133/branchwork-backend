
import { OmitType, PartialType } from '@nestjs/swagger';
import { CreateStaffDto } from './create-staff.dto';

// Email cannot be changed.
// All other fields are optional during update.
export class UpdateStaffDto extends PartialType(
  OmitType(CreateStaffDto, ['email'] as const),
) {}
