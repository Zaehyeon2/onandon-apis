import { Module } from '@nestjs/common';
import { WodHistoryController } from './wod.history.controller';
import { WodHistoryRepository } from './wod.history.repository';
import { WodHistoryService } from './wod.history.service';
import { DynamoDBModule } from '../../dynamoDB';

@Module({
  imports: [DynamoDBModule],
  providers: [WodHistoryRepository, WodHistoryService],
  exports: [WodHistoryService],
  controllers: [WodHistoryController],
})
export class WodHistoryModule {}
