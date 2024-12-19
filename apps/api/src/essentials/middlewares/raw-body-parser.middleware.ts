import { Injectable, NestMiddleware } from '@nestjs/common';
import parse from 'co-body';
import { NextFunction, Request, Response } from 'express';
import { serviceLogger as slog } from '../loggers/service-logger';

@Injectable()
export class RawBodyParserMiddleware implements NestMiddleware {
  public async use(req: Request, res: Response, next: NextFunction) {
    const length = Number(req.get('content-length') || '0');

    if (length > 0) {
      req.rawBody = [];

      req.on('data', (chunk) => {
        req.rawBody?.push(Buffer.from(chunk));
      });

      try {
        req.body = await parse(req, {
          limit: '1mb',
          formTypes: ['application/x-www-form-urlencoded'],
          jsonTypes: ['application/json'],
          textTypes: ['*/*'],
        });
      } catch (err) {
        slog.error('failed to parse body', { error: err });
        res.status(400).json({ error: 'syntax error in request body' });
        return;
      }
    }

    next();
  }
}
