import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { externalWodSchema, wodSchema } from '../wod.interface';

export class GetWodResDto extends createZodDto(
  z.object({
    results: z.array(
      z.object({
        date: wodSchema.shape.date,
        wod: z.array(externalWodSchema),
      }),
    ),
  }),
) {}
