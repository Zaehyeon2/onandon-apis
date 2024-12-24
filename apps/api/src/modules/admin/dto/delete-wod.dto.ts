import { createZodDto } from '@anatine/zod-nestjs';
import { wodSchema } from '../../wod/wod.interface';

export class DeleteWodDto extends createZodDto(
  wodSchema.pick({ date: true, startTime: true, endTime: true }),
) {}
