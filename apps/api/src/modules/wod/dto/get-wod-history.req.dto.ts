import { createZodDto } from '@anatine/zod-nestjs';
import { reqCursorSchema } from 'apps/api/src/essentials';
import { wodHistoryCursorSchema } from '../history/wod.history.interface';

export class GetWodHistoryReqDto extends createZodDto(reqCursorSchema(wodHistoryCursorSchema)) {}
