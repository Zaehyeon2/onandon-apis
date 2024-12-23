import { createZodDto } from '@anatine/zod-nestjs';
import { userSchema } from 'apps/api/src/modules/user/user.interface';

export class GetUserByPhoneReqDto extends createZodDto(
  userSchema.pick({
    phoneNumber: true,
  }),
) {}
