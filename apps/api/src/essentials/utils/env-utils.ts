// function isDefined<T>(value: T | undefined | null): value is T {
//   return (value as T) !== undefined && (value as T) !== null;
// }

export enum Env {
  LOCAL = 'local',
  DQ = 'dq',
  STG = 'stg',
  LIVE = 'live',
}

export function getEnvName() {
  switch (process.env.NODE_ENV) {
    case Env.LOCAL:
    case Env.DQ:
    case Env.STG:
    case Env.LIVE:
      return process.env.NODE_ENV;
    default:
      return Env.LOCAL;
  }
}

export function isLive(): boolean {
  return process.env.NODE_ENV === Env.LIVE;
}
export function isStg(): boolean {
  return process.env.NODE_ENV === Env.STG;
}
