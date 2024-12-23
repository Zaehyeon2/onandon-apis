import { createZodDto } from '@anatine/zod-nestjs';
import { userSchema } from '../../user/user.interface';

export class UpdateIsAdminDto extends createZodDto(
  userSchema.pick({
    id: true,
    isAdmin: true,
  }),
) {}
