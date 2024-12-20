import { applyDecorators, ExecutionContext, Injectable, UseGuards } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { ApiBearerAuth } from '@nestjs/swagger';
import { Observable } from 'rxjs';

@Injectable()
export class UserGuardInner extends AuthGuard('jwt') {
  override canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    return super.canActivate(context);
  }
}

export function UserGuard() {
  return applyDecorators(UseGuards(UserGuardInner), ApiBearerAuth());
}
