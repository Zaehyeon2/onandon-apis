import { Injectable } from '@nestjs/common';
import { maintenanceSchema, MaintenanceType } from './maintenance.interface';
import { parseDDBItem, serviceLogger as slog } from '../../essentials';
import { DynamoDBService } from '../dynamoDB/dynamoDB.service';

@Injectable()
export class MaintenanceRepository {
  private maintenanceTableName: string;

  constructor(private readonly dynamoDBService: DynamoDBService) {
    if (!process.env.DDB_MAINTENANCE_TABLE_NAME) {
      slog.error('Configuration not found', {
        DDB_MAINTENANCE_TABLE_NAME: !!process.env.DDB_MAINTENANCE_TABLE_NAME,
      });
      throw new Error('Configuration not found');
    }
    this.maintenanceTableName = process.env.DDB_MAINTENANCE_TABLE_NAME;
  }

  public async updateMaintenance(
    type: MaintenanceType,
    isUnderMaintenance: boolean,
    updatedBy: string,
  ) {
    try {
      await this.dynamoDBService.updateItem(this.maintenanceTableName, {
        key: { type },
        updateExpression:
          'SET isUnderMaintenance = :isUnderMaintenance, updatedBy = :updatedBy, updatedAt = :updatedAt',
        expressionAttributeValues: {
          ':isUnderMaintenance': isUnderMaintenance,
          ':updatedBy': updatedBy,
          ':updatedAt': Date.now(),
        },
      });
    } catch (error) {
      slog.error('updateMaintenance', { error });
      throw error;
    }
  }

  public async getMaintenance(type: MaintenanceType) {
    try {
      const result = await this.dynamoDBService.getItem(this.maintenanceTableName, {
        key: { type },
      });

      return parseDDBItem(result.Item, maintenanceSchema);
    } catch (error) {
      slog.error('getMaintenance', { error });
      throw error;
    }
  }
}
