import { applyDecorators, CanActivate, Injectable, mixin } from '@nestjs/common';
import { ApiForbiddenResponse } from '@nestjs/swagger';
import { MaintenanceType } from './maintenance.interface';
import { MaintenanceService } from './maintenance.service';

const MAINTENANCE_API_RESPONSE_DESCRIPTION = 'In maintenance';

export const MaintenanceGuard = (types: MaintenanceType[]) => {
  @Injectable()
  class MaintenanceGuardMixin implements CanActivate {
    constructor(public readonly maintenanceService: MaintenanceService) {}

    public async canActivate() {
      const isUnderMaintenance = await Promise.all(
        types.map((t) => this.maintenanceService.isUnderMaintenance(t)),
      );
      if (isUnderMaintenance.some((v) => v)) {
        return false;
      }
      return true;
    }
  }
  return mixin(MaintenanceGuardMixin);
};

export function MaintenanceForbiddenResponse() {
  return applyDecorators(
    ApiForbiddenResponse({ description: MAINTENANCE_API_RESPONSE_DESCRIPTION }),
  );
}
