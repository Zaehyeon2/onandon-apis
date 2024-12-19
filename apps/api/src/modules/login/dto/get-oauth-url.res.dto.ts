import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

export class GetOAuthUrlResDto extends createZodDto(
  z.object({
    authorizationUrl: z.string().url(),
  }),
) {}
