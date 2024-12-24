import z from 'zod';
import { userSchema } from '../../user/user.interface';
import { ExternalWod, externalWodSchema } from '../wod.interface';

export const WOD_HISTORY_SORT_KEY = 'wodDate#startTime#endTime';

export function getWodHistorySortKey(wod: ExternalWod) {
  return `${wod.date}#${wod.startTime}#${wod.endTime}`;
}

export const wodHistorySchema = z.object({
  userId: userSchema.shape.id.describe('The id of the user'),
  [WOD_HISTORY_SORT_KEY]: z.string().describe('The sortKey for DynamoDB'),
  wod: externalWodSchema,
});

export type WodHistory = z.infer<typeof wodHistorySchema>;

export const wodHistoryCursorSchema = wodHistorySchema.pick({
  userId: true,
  [WOD_HISTORY_SORT_KEY]: true,
});

export type WodHistoryCursor = z.infer<typeof wodHistoryCursorSchema>;
