import { createZodDto } from '@anatine/zod-nestjs';
import { wodSchema } from '../../wod/wod.interface';

export class PutWodDto extends createZodDto(
  wodSchema.omit({ 'startTime#endTime': true, participants: true }),
) {}
