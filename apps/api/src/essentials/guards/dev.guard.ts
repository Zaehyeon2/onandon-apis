import { CanActivate, Injectable } from '@nestjs/common';
import * as envUtils from '../utils/env-utils';

@Injectable()
export class DevGuard implements CanActivate {
  canActivate() {
    return !envUtils.isLive();
  }
}
