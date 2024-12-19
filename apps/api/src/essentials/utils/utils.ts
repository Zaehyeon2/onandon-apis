import { serviceLogger as slog } from '../loggers/service-logger';

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function encodeBase64Url(value?: Record<string, unknown>) {
  if (!value) {
    return undefined;
  }
  try {
    return Buffer.from(JSON.stringify(value)).toString('base64url');
  } catch (error) {
    slog.error('Failed to encode base64url', { error, value });
    throw new Error('Failed to encode base64url');
  }
}

export function decodeBase64Url(value: string) {
  try {
    return JSON.parse(Buffer.from(value, 'base64url').toString('utf-8'));
  } catch (error) {
    slog.error('Failed to decode base64url', { error, value });
    throw new Error('Failed to decode base64url');
  }
}

export function nowInSeconds(timestampInMs = Date.now()) {
  return Math.floor(timestampInMs / 1000);
}

export function chunk<T>(array: T[], size: number) {
  return Array.from({ length: Math.ceil(array.length / size) }, (_, index) =>
    array.slice(index * size, index * size + size),
  );
}
