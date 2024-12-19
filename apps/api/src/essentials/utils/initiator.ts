import serverlessExpress from '@codegenie/serverless-express';
import { NestExpressApplication } from '@nestjs/platform-express';
// aws-lambda package 가 아니라 @types/aws-lambda package 만 필요함
// https://docs.aws.amazon.com/lambda/latest/dg/typescript-handler.html
import {
  APIGatewayProxyHandler,
  APIGatewayProxyResult,
  Context,
  EventBridgeEvent,
  ScheduledHandler,
  SQSBatchResponse,
  SQSEvent,
  SQSHandler,
} from 'aws-lambda';
import { getEnvName } from './env-utils';
import { serviceLogger as slog } from '../loggers/service-logger';
import { ContextStorageMiddleware as CtxStorage } from '../middlewares/context-storage.middleware';

export type ScheduledEventCallback = (
  app: NestExpressApplication,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  event: EventBridgeEvent<'Scheduled Event', any>,
) => Promise<void>;

export type SqsEventCallback = (
  app: NestExpressApplication,
  event: SQSEvent,
) => Promise<SQSBatchResponse | void>;

export type LambdaEventCallback = (app: NestExpressApplication, event: unknown) => Promise<void>;

let cachedApp: NestExpressApplication | undefined;
let lastFunctionName: string | undefined;
let lastLogGroupName: string | undefined;

function setContextInfo(context: Context) {
  const ctxStorage = CtxStorage.getCurrentStorage();

  const { awsRequestId, functionName, logGroupName, memoryLimitInMB } = context;
  if (!ctxStorage.awsRequestId) {
    ctxStorage.awsRequestId = awsRequestId;
  }

  if (!ctxStorage.functionName) {
    lastFunctionName = functionName;
    ctxStorage.functionName = functionName;
  }

  if (!ctxStorage.logGroupName) {
    lastLogGroupName = logGroupName;
    ctxStorage.logGroupName = logGroupName;
  }

  if (!ctxStorage.memoryLimitInMB) {
    ctxStorage.memoryLimitInMB = memoryLimitInMB;
  }
}

async function handleSignal(signal: NodeJS.Signals) {
  await CtxStorage.runInContext(async () => {
    slog.warn(`signal received ${signal}`, { signal });

    const ctxStorage = CtxStorage.getCurrentStorage();
    ctxStorage.functionName = lastFunctionName;
    ctxStorage.logGroupName = lastLogGroupName;

    // nest application 종료
    slog.warn('stopping applications...');

    if (cachedApp) {
      await cachedApp.close();
      slog.warn('applications stopped, shutting down process...');
    } else {
      slog.warn('no applications to stop, shutting down process...');
    }
  });

  process.exit(0);
}

async function initializeApp(
  bootstrap: () => Promise<NestExpressApplication>,
): Promise<NestExpressApplication> {
  slog.info('initiating app...', {
    env: getEnvName(),
    configName: process.env.CONFIG_NAME,
    runMode: process.env.RUN_MODE,
    nodeEnv: process.env.NODE_ENV,
  });
  const app = await bootstrap();
  await app.init();

  process.on('SIGINT', async (signal: NodeJS.Signals): Promise<void> => {
    try {
      await handleSignal(signal);
    } catch (reason) {
      slog.crit('SIGINT handling failed.', { reason: JSON.stringify(reason) });
    }
  });

  process.on('SIGTERM', async (signal: NodeJS.Signals): Promise<void> => {
    try {
      await handleSignal(signal);
    } catch (reason) {
      slog.crit('SIGTERM handling failed.', { reason: JSON.stringify(reason) });
    }
  });

  // global error handler
  process.on('unhandledRejection', (reason, promise) => {
    slog.crit('unhandled rejection event', {
      promise,
      reason: JSON.stringify(reason, Object.getOwnPropertyNames(reason)),
    });

    process.kill(process.pid, 'SIGINT');
  });

  process.on('uncaughtException', (error) => {
    slog.crit('uncaught exception event', { error: JSON.stringify(error) });

    process.kill(process.pid, 'SIGINT');
  });

  return app;
}

export function generateApiHandler(
  bootstrap: () => Promise<NestExpressApplication>,
): APIGatewayProxyHandler {
  return async (event, context, callback) => {
    return CtxStorage.runInContext(async () => {
      try {
        setContextInfo(context);
        if (!cachedApp) {
          cachedApp = await initializeApp(bootstrap);
        }

        const instance = cachedApp.getHttpAdapter().getInstance();
        const server = serverlessExpress({ app: instance });

        let response: APIGatewayProxyResult;
        const res = await server(event, context, callback);

        if (res === undefined) {
          response = { statusCode: 500, body: 'Internal Server Error' };
        } else {
          response = res;
        }

        return response;
      } catch (error) {
        slog.crit('unhandled error in apiHandler', { error });
        return { statusCode: 500, body: 'Internal Api Handler Error' };
      }
    });
  };
}

export function generateSqsHandler(
  bootstrap: () => Promise<NestExpressApplication>,
  sqsHandlerCallback: SqsEventCallback,
): SQSHandler {
  return async (event, context) => {
    return CtxStorage.runInContext(async () => {
      try {
        setContextInfo(context);
        if (!cachedApp) {
          cachedApp = await initializeApp(bootstrap);
        }

        slog.info('sqsHandler', { event });

        const response = await sqsHandlerCallback(cachedApp, event);
        return response;
      } catch (error) {
        // handler가 실패할 경우 기본적으로 모든 message에 대해 batchItemFailures를 반환
        slog.crit('unhandled error in sqsHandler', { error });
        return {
          batchItemFailures: event.Records.map((record) => ({ itemIdentifier: record.messageId })),
        };
      }
    });
  };
}

export function generateScheduleHandler(
  bootstrap: () => Promise<NestExpressApplication>,
  scheduleHandlerCallback: ScheduledEventCallback,
): ScheduledHandler {
  return async (event, context) => {
    return CtxStorage.runInContext(async () => {
      try {
        setContextInfo(context);
        if (!cachedApp) {
          cachedApp = await initializeApp(bootstrap);
        }

        await scheduleHandlerCallback(cachedApp, event);
      } catch (error) {
        slog.crit('unhandled error in scheduledHandler', { error });
      }
    });
  };
}

export function generateLambdaHandler(
  bootstrap: () => Promise<NestExpressApplication>,
  lambdaHandlerCallback: LambdaEventCallback,
) {
  return async (event: unknown, context: Context) => {
    return CtxStorage.runInContext(async () => {
      try {
        setContextInfo(context);
        if (!cachedApp) {
          cachedApp = await initializeApp(bootstrap);
        }

        await lambdaHandlerCallback(cachedApp, event);
      } catch (error) {
        slog.crit('unhandled error in lambdaHandler', { error });
      }
    });
  };
}

export async function runApp(port: number, bootstrap: () => Promise<NestExpressApplication>) {
  if (process.env.RUN_MODE === 'standalone') {
    if (!cachedApp) {
      cachedApp = await initializeApp(bootstrap);
    }
    await cachedApp.listen(port);
  }
}
