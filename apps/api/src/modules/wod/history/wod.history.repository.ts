import { Injectable } from '@nestjs/common';
import { parseDDBCursor, parseDDBItems, serviceLogger as slog } from '../../../essentials';
import { DynamoDBService } from '../../dynamoDB';
import { ExternalWod } from '../wod.interface';
import {
  getWodHistorySortKey,
  WOD_HISTORY_SORT_KEY,
  WodHistoryCursor,
  wodHistoryCursorSchema,
  wodHistorySchema,
} from './wod.history.interface';
import { User } from '../../user/user.interface';

@Injectable()
export class WodHistoryRepository {
  private wodHistoryTableName: string;

  constructor(private readonly dynamoDBService: DynamoDBService) {
    if (!process.env.DDB_WOD_HISTORY_TABLE_NAME) {
      slog.error('Configuration not found', {
        DDB_LOG_TABLE_NAME: !!process.env.DDB_WOD_HISTORY_TABLE_NAME,
      });
      throw new Error('Configuration not found');
    }
    this.wodHistoryTableName = process.env.DDB_WOD_HISTORY_TABLE_NAME;
  }

  async putHistory(user: User, wod: ExternalWod) {
    await this.dynamoDBService.putItem(this.wodHistoryTableName, {
      item: {
        userId: user.id,
        [WOD_HISTORY_SORT_KEY]: getWodHistorySortKey(wod),
        wod,
      },
    });
  }

  async deleteHistory(user: User, wod: ExternalWod) {
    await this.dynamoDBService.deleteItem(this.wodHistoryTableName, {
      key: {
        userId: user.id,
        [WOD_HISTORY_SORT_KEY]: getWodHistorySortKey(wod),
      },
    });
  }

  async queryHistoryByUserId(userId: string, cursor?: WodHistoryCursor, limit: number = 10) {
    const result = await this.dynamoDBService.queryItems(this.wodHistoryTableName, {
      keyConditionExpression: '#userId = :userId',
      expressionAttributeValues: { ':userId': userId },
      expressionAttributeNames: { '#userId': 'userId' },
      limit,
      exclusiveStartKey: cursor,
      scanIndexForward: false,
    });

    return {
      histories: parseDDBItems(result.Items, wodHistorySchema),
      cursor: parseDDBCursor(result.LastEvaluatedKey, wodHistoryCursorSchema),
    };
  }
}
