import { BaseLoggerFactory, LogLevel } from './base-logger-factory';
import {
  ContextStorageMiddleware as CtxStorage,
  Storage,
} from '../middlewares/context-storage.middleware';

type EXTRA = Record<string, unknown> & { err?: unknown; error?: unknown };

class ServiceLogger {
  private logger = BaseLoggerFactory.getLogger(LogLevel.DEBUG);

  public setLevel(level: LogLevel) {
    return BaseLoggerFactory.setLogLevel(this.logger, level);
  }

  public verbose(message: string, extra?: EXTRA) {
    this.print('verbose', message, extra);
  }

  public debug(message: string, extra?: EXTRA) {
    this.print('debug', message, extra);
  }

  public info(message: string, extra?: EXTRA) {
    this.print('info', message, extra);
  }

  public warn(message: string, extra?: EXTRA) {
    this.print('warn', message, extra);
  }

  public error(message: string, extra?: EXTRA) {
    this.print('error', message, extra);
  }

  public crit(message: string, extra?: EXTRA) {
    this.print('crit', message, extra);
  }

  private print(level: string, message: string, extra?: EXTRA): void {
    let ctxStorage: Storage | undefined;
    try {
      ctxStorage = CtxStorage.getCurrentStorage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //
    }

    const meta: {
      custom: { context: object | undefined; extra_info: EXTRA | undefined };
      err: Error | undefined;
    } = {
      custom: {
        context: ctxStorage
          ? {
              tid: ctxStorage.tid,
              aws_request_id: ctxStorage.awsRequestId,
              function_name: ctxStorage.functionName,
              memory_limit_in_mb: ctxStorage.memoryLimitInMB,
              log_group_name: ctxStorage.logGroupName,
              remote_address: ctxStorage.remoteAddress,
              http_started_at: ctxStorage.httpStartedAt,
            }
          : undefined,
        extra_info: undefined,
      },
      err: undefined,
      ...BaseLoggerFactory.getEnvironment(ServiceLogger.name),
    };

    // extra.error 와 err 이 동시에 존재하면 error 만 처리한다.
    if (extra?.error && extra.error instanceof Error) {
      // extra.err 가 있고, extra.err 가 Error 인 경우 ecs 의 error 필드에 넣어주기 위해 meta.err 에 넣어준다.
      meta.err = extra.error;
    } else if (extra && extra.err && extra.err instanceof Error) {
      // extra.error 가 있고, extra.error 가 Error 인 경우 ecs 의 error 필드에 넣어주기 위해 meta.err 에 넣어준다.
      meta.err = extra.err;
    }

    // err, error 을 제거한 값을 extra_info 에 넣어준다.
    meta.custom.extra_info = removeErrProperty(extra);

    this.logger.log(level, message, meta);
  }
}

function removeErrProperty(obj: EXTRA | undefined): Record<string, unknown> | undefined {
  if (!obj) {
    return undefined;
  }

  // 'err', 'error' 삭제
  const { err, error, ...rest } = obj;

  // 나머지 속성으로 새로운 객체를 생성
  const result = { ...rest };

  // 새로운 객체가 빈 객체이면 undefined를 반환, 그렇지 않으면 새로운 객체를 반환
  return Object.keys(result).length === 0 ? undefined : result;
}

export const serviceLogger = new ServiceLogger();
