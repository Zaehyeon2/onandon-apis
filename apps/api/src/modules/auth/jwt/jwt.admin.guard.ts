import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
  UseGuards,
  applyDecorators,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { ApiBearerAuth } from '@nestjs/swagger';
import { serviceLogger as slog } from '../../../essentials';

@Injectable()
export class AdminGuardInner implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const { user } = context.switchToHttp().getRequest();
    const isAdmin = !!user?.isAdmin;
    if (!isAdmin) {
      slog.error('Only admin can access', { user });
      throw new UnauthorizedException('Only admin can access');
    }
    return true;
  }
}

export function AdminGuard() {
  return applyDecorators(UseGuards(AdminGuardInner), ApiBearerAuth());
}
