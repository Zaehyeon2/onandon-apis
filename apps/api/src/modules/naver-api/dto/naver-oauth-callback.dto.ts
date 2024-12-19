import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

export class NaverOAuthCallbackDto extends createZodDto(
  z.object({
    code: z.string(),
    state: z.string(),
  }),
) {}
