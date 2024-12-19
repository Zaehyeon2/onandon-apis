import { CallHandler, ExecutionContext, NestInterceptor } from '@nestjs/common';
import { Response } from 'express';
import { Observable, map } from 'rxjs';
import { serviceLogger as slog } from '../loggers/service-logger';
import { ContextStorageMiddleware } from '../middlewares/context-storage.middleware';

interface IApiResponse<T> {
  code: string;
  tid?: string;
  ts: number;
  result: T;
}

const API_SUCCESS_CODE = 'success';

export class ResponseInterceptor<T> implements NestInterceptor<T, IApiResponse<T>> {
  intercept(
    context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<IApiResponse<T>> | Promise<Observable<IApiResponse<T>>> {
    const ctx = context.switchToHttp();
    const response = ctx.getResponse<Response>();

    // Cache-Control 헤더 추가
    response.set('Cache-Control', 'no-store');

    return next.handle().pipe(
      map((data) => {
        const code = API_SUCCESS_CODE;
        return this.valueConverter(code, data);
      }),
    );
  }

  valueConverter(code: string, recvData: T): IApiResponse<T> {
    // tid를 가져오다 에러가 발생하는 경우에 대한 처리.
    let tid;
    try {
      tid = ContextStorageMiddleware.getCurrentStorage().tid;
    } catch (error) {
      slog.error(`get tid failed.`, { error });
      tid = 'failed get tid from context';
    }

    return {
      code,
      tid,
      ts: Date.now(),
      result: recvData,
    };
  }
}
