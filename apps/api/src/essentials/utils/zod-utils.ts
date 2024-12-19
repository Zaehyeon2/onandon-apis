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
