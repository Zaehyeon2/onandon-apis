import { LoggerService } from '@nestjs/common';
import { BaseLoggerFactory, LogLevel } from './base-logger-factory';
import {
  ContextStorageMiddleware as CtxStorage,
  Storage,
} from '../middlewares/context-storage.middleware';

export class NestLogger implements LoggerService {
  private logger = BaseLoggerFactory.getLogger(LogLevel.DEBUG);

  public setLevel(level: LogLevel) {
    return BaseLoggerFactory.setLogLevel(this.logger, level);
  }

  public verbose(message: string, ...optionalParams: unknown[]) {
    this.print('verbose', message, ...optionalParams);
  }

  public debug(message: string, ...optionalParams: unknown[]) {
    this.print('debug', message, ...optionalParams);
  }

  public log(message: string, ...optionalParams: unknown[]) {
    this.print('info', message, ...optionalParams);
  }

  public warn(message: string, ...optionalParams: unknown[]) {
    this.print('warn', message, ...optionalParams);
  }

  public error(message: string, ...optionalParams: unknown[]) {
    this.print('error', message, ...optionalParams);
  }

  public crit(message: string, ...optionalParams: unknown[]) {
    this.print('crit', message, ...optionalParams);
  }

  private print(level: string, message: string, ...optionalParams: unknown[]): void {
    let ctxStorage: Storage | undefined;
    try {
      ctxStorage = CtxStorage.getCurrentStorage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //
    }

    const meta: { custom: { context: object | undefined; next: object | undefined } } = {
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
        next: undefined,
      },
      ...BaseLoggerFactory.getEnvironment(NestLogger.name),
    };

    if (optionalParams.length === 0) {
      this.logger.log(level, message, meta);
    } else if (optionalParams.length === 1) {
      meta.custom.next = { module: optionalParams[0] };
      this.logger.log(level, message, meta);
    } else if (optionalParams.length > 1) {
      meta.custom.next = { module: optionalParams.pop(), params: optionalParams };
      this.logger.log(level, message, meta);
    }
  }
}
