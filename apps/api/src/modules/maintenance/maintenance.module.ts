import { Module } from '@nestjs/common';
import { MaintenanceRepository } from './maintenance.repository';
import { MaintenanceService } from './maintenance.service';
import { DynamoDBModule } from '../dynamoDB';

@Module({
  imports: [DynamoDBModule],
  providers: [MaintenanceRepository, MaintenanceService],
  exports: [MaintenanceService],
})
export class MaintenanceModule {}
