import { getCurrentInvoke } from '@codegenie/serverless-express';
import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import * as uuid from 'uuid';
import { ContextStorageMiddleware as CtxStorage, Storage } from './context-storage.middleware';
import { BaseLoggerFactory, LogLevel } from '../loggers/base-logger-factory';

declare module 'express' {
  interface Request {
    rawBody?: Buffer[];
  }
}

/**
 * {@link Handler} context parameter.
 * See {@link https://docs.aws.amazon.com/lambda/latest/dg/nodejs-prog-model-context.html AWS documentation}.
 */
interface AwsContext {
  functionName: string;
  functionVersion: string;
  invokedFunctionArn: string;
  memoryLimitInMB: string;
  awsRequestId: string;
  logGroupName: string;
  logStreamName: string;
}

const LOGGER_NAME = 'AccessLogger';

let requestCounter = 0;

function getRemoteAddress(req: Request): string {
  let ip =
    ((req.get('x-pluto-client-ip') || req.get('x-forwarded-for') || '').split(',')[0] || req.ip) ??
    '';

  if (ip.substring(0, 7) === '::ffff:') {
    ip = ip.substring(7);
  }

  return ip;
}

@Injectable()
export class AccessLoggerMiddleware implements NestMiddleware {
  private static logger = BaseLoggerFactory.getLogger(LogLevel.INFO);

  public use(req: Request, res: Response, next: NextFunction) {
    // context storage 생성
    const ctxStorage = CtxStorage.getCurrentStorage();

    // request 시작 시간
    ctxStorage.httpStartedAt = Date.now();

    // uuid v4 로 tid 를 부여하고 context storage 에 저장
    if (!ctxStorage.tid) {
      // 없으면 새로 생성
      ctxStorage.tid = uuid.v4();
    }

    // remote address 저장
    ctxStorage.remoteAddress = getRemoteAddress(req);

    // request counter 증가
    requestCounter += 1;
    ctxStorage.requestCounter = requestCounter;

    if (process.env.RUN_MODE !== 'standalone') {
      // lambda context 와 event 정보 확인
      const { context: awsContext } = getCurrentInvoke() as { context: AwsContext };
      if (awsContext) {
        // aws lambda request id 를 context storage 에 저장
        const { awsRequestId, functionName, logGroupName, memoryLimitInMB } = awsContext;

        if (!ctxStorage.awsRequestId) {
          ctxStorage.awsRequestId = awsRequestId;
        }

        if (!ctxStorage.functionName) {
          ctxStorage.functionName = functionName;
        }

        if (!ctxStorage.logGroupName) {
          ctxStorage.logGroupName = logGroupName;
        }

        if (!ctxStorage.memoryLimitInMB) {
          ctxStorage.memoryLimitInMB = memoryLimitInMB;
        }
      }
    }

    let logged = false;

    const originalSendFunc = res.send.bind(res);
    res.send = (respBody) => {
      if (!logged) {
        this.doLogging(req, res, respBody);
        logged = true;
      }
      return originalSendFunc(respBody);
    };

    const originalWriteFunc = res.write.bind(res);
    res.write = (respBody) => {
      if (!logged) {
        this.doLogging(req, res, respBody);
        logged = false;
      }
      return originalWriteFunc(respBody);
    };

    next();
  }

  // middleware 을 global 하게 사용할 때 ( main.ts에서 app.use(new middlewareclass().use); )
  // static method가 아니면 unhandled exception 이 발생한다
  // 아마도 위에서 res.send 가 호출 될 때 context 가 맞지 않아 발생하는 것으로 추측된다
  // FYI, AppModule 에서 middleware를 사용하면 unhandled exception이 발생하지 않는다
  private doLogging(req: Request, res: Response, respBody: unknown) {
    // context storage 생성
    let ctxStorage: Storage | undefined;
    try {
      ctxStorage = CtxStorage.getCurrentStorage();
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (e) {
      //
    }

    const now = Date.now();

    let elapsedMillis: number;
    if (ctxStorage?.httpStartedAt !== undefined) {
      elapsedMillis = now - ctxStorage.httpStartedAt;
    } else {
      elapsedMillis = -1;
    }

    let rBody: unknown;
    const bodyStr = String(respBody);

    try {
      rBody = JSON.parse(bodyStr);
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
    } catch (err) {
      rBody = { _str: String(bodyStr) };
    }

    const logMessage = 'http access log';

    const meta = {
      res,
      req,
      http: {
        request: {
          body: {
            content: req.rawBody ? String(req.rawBody) : undefined,
          },
        },
        response: { body: { content: JSON.stringify(rBody) } },
      },
      url: { original: req.originalUrl },
      custom: {
        access_log: { elapsed_millis: elapsedMillis },
        url: { path_prototype: req.route?.path, path_params: req.params },
        context: ctxStorage
          ? {
              tid: ctxStorage.tid,
              request_counter: ctxStorage.requestCounter,
              aws_request_id: ctxStorage.awsRequestId,
              function_name: ctxStorage.functionName,
              memory_limit_in_mb: ctxStorage.memoryLimitInMB,
              log_group_name: ctxStorage.logGroupName,
              remote_address: ctxStorage.remoteAddress,
              http_started_at: ctxStorage.httpStartedAt,
            }
          : undefined,
      },
      ...BaseLoggerFactory.getEnvironment(LOGGER_NAME),
    };

    if (res.statusCode >= 400) {
      AccessLoggerMiddleware.logger.error(logMessage, meta);
    } else {
      AccessLoggerMiddleware.logger.info(logMessage, meta);
    }
  }
}
