import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { DynamoDBModule } from '../dynamoDB';
import { MaintenanceGuard, MaintenanceModule, MaintenanceType } from '../maintenance';
import { WodHistoryModule } from './history/wod.history.module';
import { WodController } from './wod.controller';
import { WodRepository } from './wod.repository';
import { WodService } from './wod.service';

@Module({
  imports: [DynamoDBModule, MaintenanceModule, WodHistoryModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard([MaintenanceType.GLOBAL]),
    },
    WodRepository,
    WodService,
  ],
  exports: [WodService],
  controllers: [WodController],
})
export class WodModule {}
