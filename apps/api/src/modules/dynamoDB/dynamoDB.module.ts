import { Module } from '@nestjs/common';
import { DynamoDBService } from './dynamoDB.service';

@Module({
  providers: [DynamoDBService],
  exports: [DynamoDBService],
})
export class DynamoDBModule {}
