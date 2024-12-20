import { patchNestjsSwagger, ZodValidationPipe } from '@anatine/zod-nestjs';
import { NestFactory } from '@nestjs/core';
import { NestExpressApplication } from '@nestjs/platform-express';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { configDotenv } from 'dotenv';
import {
  generateApiHandler,
  getEnvName,
  isLive,
  isStg,
  NestLogger,
  runApp,
  serviceLogger as slog,
} from './essentials';
import { MainModule } from './main.module';

configDotenv({ path: [`env/${getEnvName()}.env`, 'env/default.env'] });

export async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(MainModule, {
    logger: new NestLogger(),
    bodyParser: false, // RawBodyParserMiddleware 에서 parse를 하게 하기 위함
  });

  app.disable('etag');
  app.disable('x-powered-by');

  app.enableCors();
  app.useGlobalPipes(new ZodValidationPipe());

  if (!isLive() && !isStg()) {
    const config = new DocumentBuilder()
      .addServer('/api')
      .addServer('/')
      .setTitle('Service API')
      .setDescription('The API description')
      .setVersion('1.0')
      .build();

    patchNestjsSwagger();
    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('docs', app, document);
  }

  return app;
}

export const apiHandler = generateApiHandler(bootstrap);

runApp(8080, bootstrap).catch((err: unknown) => slog.error('error on running app', { error: err }));
