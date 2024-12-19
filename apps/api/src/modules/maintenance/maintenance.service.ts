import { Injectable } from '@nestjs/common';
import { MaintenanceType } from './maintenance.interface';
import { MaintenanceRepository } from './maintenance.repository';

const maintenanceCache: {
  [key: string]: {
    isUnderMaintenance: boolean;
    lastUpdated: number;
  };
} = {};

@Injectable()
export class MaintenanceService {
  private readonly cacheTTL = 30000;

  constructor(private readonly maintenanceRepository: MaintenanceRepository) {}

  public async updateMaintenance(
    type: MaintenanceType,
    isUnderMaintenance: boolean,
    updatedBy: string,
  ) {
    await this.maintenanceRepository.updateMaintenance(type, isUnderMaintenance, updatedBy);
  }

  public async getMaintenance(type: MaintenanceType) {
    const maintenance = await this.maintenanceRepository.getMaintenance(type);
    if (!maintenance) {
      return {
        type,
        isUnderMaintenance: false,
        updatedBy: '',
        updatedAt: 0,
      };
    }
    return maintenance;
  }

  public async getMaintenances() {
    const maintenanceTypes = Object.values(MaintenanceType);
    let maintenances = await Promise.all(maintenanceTypes.map((type) => this.getMaintenance(type)));

    maintenances = maintenances.filter((maintenance) => maintenance);

    // DDB에 없는 type은 default 값으로 추가
    maintenanceTypes.forEach((type) => {
      if (!maintenances.find((maintenance) => maintenance.type === type)) {
        maintenances.push({
          type,
          isUnderMaintenance: false,
          updatedBy: '',
          updatedAt: 0,
        });
      }
    });

    return maintenances;
  }

  public async isUnderMaintenance(type: MaintenanceType): Promise<boolean> {
    // cache가 있고, cache가 만료되지 않았다면 cache를 사용
    if (maintenanceCache[type] && maintenanceCache[type].lastUpdated + this.cacheTTL > Date.now()) {
      return maintenanceCache[type].isUnderMaintenance;
    }
    // cache가 없거나 만료되었다면 repository에서 가져와서 cache에 저장
    const maintenance = await this.maintenanceRepository.getMaintenance(type);
    const isUnderMaintenance = maintenance ? maintenance.isUnderMaintenance : false;
    maintenanceCache[type] = {
      isUnderMaintenance,
      lastUpdated: Date.now(),
    };

    return isUnderMaintenance;
  }
}
