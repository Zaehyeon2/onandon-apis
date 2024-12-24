import z from 'zod';
import { decodeBase64Url } from './utils';
import { serviceLogger as slog } from '../loggers/service-logger';

export function isValidCursor<T extends z.ZodRawShape>(value: string, schema: z.ZodObject<T>) {
  try {
    schema.parse(decodeBase64Url(value));
    return true;
  } catch {
    return false;
  }
}

export function transformCursor<T extends z.ZodRawShape>(value: string, schema: z.ZodObject<T>) {
  const { success, data } = schema.safeParse(decodeBase64Url(value));

  if (!success) {
    throw new Error(`Failed to transform cursor`);
  }

  return data;
}

export function safeParseOrThrow<T extends z.ZodRawShape>(schema: z.ZodObject<T>, value: unknown) {
  const { success, error, data } = schema.safeParse(value);

  if (!success) {
    slog.error('Failed to parse', { error, value });
    throw new Error(`Failed to parse`);
  }

  return data;
}

export function parseDDBItems<T extends z.ZodRawShape>(
  value: Record<string, unknown>[] | undefined,
  schema: z.ZodObject<T>,
) {
  if (!value || value.length === 0) {
    return [];
  }

  return value.map((item) => {
    return safeParseOrThrow(schema, item);
  });
}

export function parseDDBCursor<T extends z.ZodRawShape>(
  value: Record<string, unknown> | undefined,
  schema: z.ZodObject<T>,
) {
  if (!value) {
    return undefined;
  }

  return safeParseOrThrow(schema, value);
}

export function parseDDBItem<T extends z.ZodRawShape>(
  value: Record<string, unknown> | undefined,
  schema: z.ZodObject<T>,
) {
  if (!value) {
    return null;
  }

  return safeParseOrThrow(schema, value);
}

export function reqCursorSchema<T extends z.ZodRawShape>(schema: z.ZodObject<T>) {
  return z.object({
    cursor: z
      .string()
      .min(10)
      .max(400)
      .refine((v) => isValidCursor(v, schema))
      .transform((v) => transformCursor(v, schema))
      .optional()
      .describe('The next index to get items'),
    size: z.coerce
      .number()
      .min(1)
      .max(100)
      .optional()
      .default(50)
      .describe('The number of items to get'),
  });
}

export function resCursorWithResultSchema<T extends z.ZodRawShape, U extends z.ZodRawShape>(
  resultSchema: z.ZodObject<T>,
  cursorSchema: z.ZodObject<U>,
) {
  return z.object({
    results: z.array(resultSchema),
    cursor: z
      .string()
      .refine((v: string) => {
        try {
          cursorSchema.parse(decodeBase64Url(v));
          return true;
        } catch {
          return false;
        }
      })
      .optional()
      .describe('The next index to get results if there are more results'),
  });
}
