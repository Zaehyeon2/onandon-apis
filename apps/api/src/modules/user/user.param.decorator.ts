import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { User, userSchema } from './user.interface';
import { safeParseOrThrow } from '../../essentials';

export const UserParam = createParamDecorator((data: unknown, ctx: ExecutionContext): User => {
  const request = ctx.switchToHttp().getRequest();
  return safeParseOrThrow(userSchema, request.user);
});
