import { ArgumentsHost, Catch, ExceptionFilter, HttpException, HttpStatus } from '@nestjs/common';
import { NaverApiService } from '../../modules/naver-api/naver-api.service';
import { serviceLogger as slog } from '../loggers/service-logger';
import { ContextStorageMiddleware } from '../middlewares/context-storage.middleware';

const API_ERROR_CODE = 'error';

@Catch(HttpException)
export class AllExceptionsFilter implements ExceptionFilter {
  constructor(private readonly naverApiService: NaverApiService) {}

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  catch(exception: any, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse();

    const result = {
      status: HttpStatus.INTERNAL_SERVER_ERROR,
      code: API_ERROR_CODE,
      message: exception.message ? exception.message : '',
    };

    if (exception instanceof HttpException) {
      result.status = exception.getStatus();
    }

    if (result.status === HttpStatus.UNAUTHORIZED) {
      const naverApiUrl = this.naverApiService.getAuthorizationUrl();
      response.setHeader('WWW-Authenticate', `Bearer realm="${naverApiUrl}"`);
    }

    // tid를 가져오다 에러가 발생하는 경우에 대한 처리.
    let tid;
    try {
      tid = ContextStorageMiddleware.getCurrentStorage().tid;
    } catch (e) {
      slog.error(`get tid failed.`, {
        e,
        exception,
        exceptionStack: exception.stack ?? '',
        result,
      });
      tid = 'failed get tid from context';
    }

    response.status(result.status).json({
      code: result.code,
      tid,
      ts: Date.now(),
      desc: result.message,
    } as IExceptionResponse);
  }
}

export interface IExceptionResponse {
  code: string;
  tid: string;
  ts: number;
  desc: string;
}
