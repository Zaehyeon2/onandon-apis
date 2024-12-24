import { createZodDto } from '@anatine/zod-nestjs';
import { wodSchema } from '../wod.interface';

export class BookWodReqDto extends createZodDto(
  wodSchema.pick({
    date: true,
    startTime: true,
    endTime: true,
  }),
) {}
