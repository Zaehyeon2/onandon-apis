import { ecsFormat } from '@elastic/ecs-winston-format';
import * as os from 'os';
import * as util from 'util';
import * as winston from 'winston';
import { Env, getEnvName } from '../utils/env-utils';

util.inspect.defaultOptions.depth = null;

export enum LogLevel {
  CRIT = 'crit',
  ERROR = 'error',
  WARN = 'warn',
  INFO = 'info',
  DEBUG = 'debug',
  VERBOSE = 'verbose',
}

export function parseLogLevel(level: string | undefined) {
  switch (level) {
    case LogLevel.CRIT:
    case LogLevel.ERROR:
    case LogLevel.WARN:
    case LogLevel.INFO:
    case LogLevel.DEBUG:
    case LogLevel.VERBOSE:
      return level;
    default:
      return LogLevel.DEBUG;
  }
}

export class BaseLoggerFactory {
  public static getLogger(defaultLevel: LogLevel): winston.Logger {
    const customLevel = BaseLoggerFactory.initCustomLevel();

    const baseTransports = BaseLoggerFactory.initBaseTransport(defaultLevel);

    const loggerOption = {
      transports: baseTransports,
      levels: customLevel.levels,
    };

    return winston.createLogger(loggerOption);
  }

  public static getEnvironment(loggerName: string) {
    return {
      host: {
        hostname: os.hostname(),
      },
      service: {
        environment: getEnvName(),
        name: process.env.SERVICE_NAME ?? 'unknown',
      },
      log: {
        logger: loggerName,
      },
    };
  }

  public static setLogLevel(logger: winston.Logger, level: LogLevel) {
    for (let i = 0; i < logger.transports.length; i += 1) {
      const transport = logger.transports[i];
      if (transport) {
        transport.level = level;
      }
    }
  }

  private static initBaseTransport(level: string) {
    const env = getEnvName();

    const transports: winston.transport[] = [];

    if (env === Env.LOCAL) {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(
            ecsFormat({ convertReqRes: true }),
            winston.format.prettyPrint(),
            winston.format.colorize({ all: true }),
          ),
          level,
        }),
      );
    } else {
      transports.push(
        new winston.transports.Console({
          format: winston.format.combine(ecsFormat({ convertReqRes: true })),
          level,
        }),
      );
    }

    return transports;
  }

  private static initCustomLevel(): winston.config.AbstractConfigSet {
    return {
      colors: {
        crit: 'red',
        error: 'pink',
        warn: 'yellow',
        info: 'green',
        debug: 'white',
        verbose: 'cyan',
      },
      levels: {
        crit: 0,
        error: 1,
        warn: 2,
        info: 3,
        debug: 4,
        verbose: 5,
      },
    };
  }
}
