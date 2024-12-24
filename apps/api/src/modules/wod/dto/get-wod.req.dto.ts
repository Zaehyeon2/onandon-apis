import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

export class GetWodReqDto extends createZodDto(
  z.object({
    date: z.coerce.number().describe('The date of the WOD'),
  }),
) {}
