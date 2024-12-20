import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

export class OAuthCallbackResDto extends createZodDto(
  z.object({
    jwtToken: z.string().jwt(),
  }),
) {}
