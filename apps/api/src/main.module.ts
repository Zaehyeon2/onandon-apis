import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AccessLoggerMiddleware,
  AllExceptionsFilter,
  ContextStorageMiddleware,
  RawBodyParserMiddleware,
  ResponseInterceptor,
} from './essentials';
import { AdminModule } from './modules/admin/admin.module';
import { LoginModule } from './modules/login/login.module';
import { UserModule } from './modules/user/user.module';

@Module({
  imports: [AdminModule, UserModule, LoginModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
  ],
})
export class UserMainModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextStorageMiddleware, AccessLoggerMiddleware, RawBodyParserMiddleware)
      .forRoutes('*');
  }
}
