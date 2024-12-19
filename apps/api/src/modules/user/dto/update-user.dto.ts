import { createZodDto } from '@anatine/zod-nestjs';
import { userSchema } from '../user.interface';

export class UpdateUserDto extends createZodDto(
  userSchema
    .pick({
      id: true,
      email: true,
      name: true,
      phoneNumber: true,
      gender: true,
      birthDate: true,
      profileImage: true,
    })
    .partial()
    .required({
      id: true,
    }),
) {}
