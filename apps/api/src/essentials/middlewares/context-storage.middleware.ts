import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AsyncLocalStorage } from 'node:async_hooks';
import { NoContextStorageError } from '../errors/no-context-storage.error';

@Injectable()
export class ContextStorageMiddleware implements NestMiddleware {
  private static ctxStore = new AsyncLocalStorage<Storage>();

  public use(req: Request, res: Response, next: NextFunction) {
    ContextStorageMiddleware.ctxStore.run({}, () => {
      ContextStorageMiddleware.getCurrentStorage();
      next();
    });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  public static async runInContext<R, TArgs extends any[]>(
    callback: (...args: TArgs) => R,
    ...args: TArgs
  ) {
    return this.ctxStore.run({}, callback, ...args);
  }

  public static getCurrentStorage(): Storage {
    const context = this.ctxStore.getStore();
    if (!context) {
      throw new NoContextStorageError('No context storage attached to the current req');
    }
    return context;
  }
}

export interface Storage {
  tid?: string;
  requestCounter?: number;
  awsRequestId?: string;
  functionName?: string;
  memoryLimitInMB?: string;
  logGroupName?: string;
  remoteAddress?: string;
  httpStartedAt?: number;
}
