// {
//   "access_token":"AAAAQosjWDJieBiQZc3to9YQp6HDLvrmyKC+6+iZ3gq7qrkqf50ljZC+Lgoqrg",
//   "refresh_token":"c8ceMEJisO4Se7uGisHoX0f5JEii7JnipglQipkOn5Zp3tyP7dHQoP0zNKHUq2gY",
//   "token_type":"bearer",
//   "expires_in":"3600"

import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

// }
export class NaverTokenResDto extends createZodDto(
  z.object({
    access_token: z.string(),
    refresh_token: z.string(),
    token_type: z.string(),
    expires_in: z.string(),
  }),
) {}
