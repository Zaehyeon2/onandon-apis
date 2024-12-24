import { createZodDto } from '@anatine/zod-nestjs';
import { wodSchema } from '../../wod/wod.interface';

export class PatchWodDto extends createZodDto(
  wodSchema.omit({ participants: true }).partial().required({
    date: true,
    'startTime#endTime': true,
  }),
) {}
