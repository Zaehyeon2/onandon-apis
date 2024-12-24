import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { serviceLogger as slog } from '../loggers/service-logger';

export async function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

export function encodeBase64Url(value?: Record<string, NativeAttributeValue>) {
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

export function getDayByDate(date = Date.now()) {
  const dayPart = 1000 * 60 * 60 * 24;
  return Math.floor(date / dayPart) * dayPart;
}

export function getWeekRangeByDate(date = Date.now()) {
  const dateCopy = new Date(date);

  const dayPart = 1000 * 60 * 60 * 24; // 하루를 밀리초로 변환
  const dayOfWeek = dateCopy.getUTCDay(); // 현재 날짜의 요일 (0: 일요일, 1: 월요일, ..., 6: 토요일)

  // 월요일을 기준으로 주의 시작일 계산
  const mondayOffset = (dayOfWeek + 6) % 7; // 월요일을 0으로 맞추기 위해 조정
  const monday = new Date(dateCopy.getTime() - mondayOffset * dayPart); // 현재 주의 월요일 자정

  // 주의 각 날의 자정 시간 배열 생성
  const weekMidnights = [];
  for (let i = 0; i < 7; i += 1) {
    const midnight = new Date(monday.getTime() + i * dayPart); // 각 날의 자정 시간 계산
    weekMidnights.push(getDayByDate(midnight.getTime())); // 각 날의 자정 시간을 배열에 추가
  }

  return weekMidnights;
}
