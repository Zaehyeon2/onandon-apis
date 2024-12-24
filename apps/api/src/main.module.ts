import { MiddlewareConsumer, Module } from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import {
  AccessLoggerMiddleware,
  ContextStorageMiddleware,
  RawBodyParserMiddleware,
  ResponseInterceptor,
} from './essentials';
import { AllExceptionsFilter } from './essentials/filters/all-exception.filter';
import { AdminModule } from './modules/admin/admin.module';
import { AuthModule } from './modules/auth/auth.module';
import { AdminGuardInner } from './modules/auth/jwt/jwt.admin.guard';
import { UserGuardInner } from './modules/auth/jwt/jwt.user.guard';
import { LoginModule } from './modules/login/login.module';
import { NaverApiModule } from './modules/naver-api/naver-api.modules';
import { UserModule } from './modules/user/user.module';
import { WodModule } from './modules/wod/wod.module';

@Module({
  imports: [AdminModule, UserModule, LoginModule, NaverApiModule, AuthModule, WodModule],
  providers: [
    {
      provide: APP_INTERCEPTOR,
      useClass: ResponseInterceptor,
    },
    { provide: APP_FILTER, useClass: AllExceptionsFilter },
    UserGuardInner,
    AdminGuardInner,
  ],
})
export class MainModule {
  configure(consumer: MiddlewareConsumer) {
    consumer
      .apply(ContextStorageMiddleware, AccessLoggerMiddleware, RawBodyParserMiddleware)
      .forRoutes('*');
  }
}
