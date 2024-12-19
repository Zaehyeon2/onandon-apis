import { createZodDto } from '@anatine/zod-nestjs';
import { userSchema } from 'apps/api/src/modules/user/user.interface';

export class GetUserReqDto extends createZodDto(
  userSchema
    .pick({
      id: true,
      phoneNumber: true,
    })
    .partial(),
) {}
