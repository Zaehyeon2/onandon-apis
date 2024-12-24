import { createZodDto } from '@anatine/zod-nestjs';
import { resCursorWithResultSchema } from 'apps/api/src/essentials';
import { wodHistoryCursorSchema, wodHistorySchema } from '../history/wod.history.interface';

export class GetWodHistoryResDto extends createZodDto(
  resCursorWithResultSchema(wodHistorySchema, wodHistoryCursorSchema),
) {}
