import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { parseDDBItem, parseDDBItems, serviceLogger as slog } from '../../essentials';
import { DynamoDBService } from '../dynamoDB';
import { Wod, wodSchema } from './wod.interface';
import { User } from '../user/user.interface';

@Injectable()
export class WodRepository {
  private wodTableName: string;

  constructor(private readonly dynamoDBService: DynamoDBService) {
    if (!process.env.DDB_WOD_TABLE_NAME) {
      slog.error('Configuration not found', {
        DDB_WOD_TABLE_NAME: !!process.env.DDB_WOD_TABLE_NAME,
      });
      throw new Error('Configuration not found');
    }
    this.wodTableName = process.env.DDB_WOD_TABLE_NAME;
  }

  async updateParticipants(user: User, preWod: Wod, wod: Wod) {
    await this.dynamoDBService.updateItem(this.wodTableName, {
      key: {
        date: wod.date,
        'startTime#endTime': this.getSortKey(wod.startTime, wod.endTime),
      },
      updateExpression: 'SET #participants = :participants',
      conditionExpression: '#participants = :preParticipants AND #capacity > :size',
      expressionAttributeNames: {
        '#participants': 'participants',
        '#capacity': 'capacity',
      },
      expressionAttributeValues: {
        ':participants': wod.participants,
        ':preParticipants': preWod.participants,
        ':size': Object.keys(preWod.participants).length,
      },
    });
  }

  async getWodByDay(date: number) {
    const { Items } = await this.dynamoDBService.queryItems(this.wodTableName, {
      keyConditionExpression: '#date = :date',
      expressionAttributeValues: { ':date': date },
      expressionAttributeNames: { '#date': 'date' },
    });

    if (!Items) {
      return [];
    }

    return parseDDBItems(Items, wodSchema);
  }

  async getWodByDayAndSortKey(date: number, startTime: number, endTime: number) {
    const { Item } = await this.dynamoDBService.getItem(this.wodTableName, {
      key: {
        date,
        'startTime#endTime': this.getSortKey(startTime, endTime),
      },
    });

    if (!Item) {
      return null;
    }

    return parseDDBItem(Item, wodSchema);
  }

  async getWodByDayAndSortKeyString(date: number, sortKey: string) {
    const { Item } = await this.dynamoDBService.getItem(this.wodTableName, {
      key: {
        date,
        'startTime#endTime': sortKey,
      },
    });

    if (!Item) {
      return null;
    }

    return parseDDBItem(Item, wodSchema);
  }

  async putWod(
    params: Pick<
      Wod,
      'date' | 'startTime' | 'endTime' | 'title' | 'description' | 'capacity' | 'coach'
    >,
  ) {
    const wod: Wod = {
      date: params.date,
      'startTime#endTime': this.getSortKey(params.startTime, params.endTime),
      startTime: params.startTime,
      endTime: params.endTime,
      title: params.title,
      description: params.description,
      capacity: params.capacity,
      participants: {},
      coach: params.coach,
    };
    await this.dynamoDBService.putItem(this.wodTableName, { item: wod });
  }

  async updateWod(
    date: number,
    sortKey: string,
    params: {
      startTime?: number;
      endTime?: number;
      title?: string;
      description?: string;
      capacity?: number;
      coach?: string;
    },
  ) {
    const updateExpression: string[] = [];
    const expressionAttributeNames: Record<string, string> = {};
    const expressionAttributeValues: Record<string, NativeAttributeValue> = {};

    if (params.startTime !== undefined) {
      updateExpression.push('#startTime = :startTime');
      expressionAttributeNames['#startTime'] = 'startTime';
      expressionAttributeValues[':startTime'] = params.startTime;
    }

    if (params.endTime !== undefined) {
      updateExpression.push('#endTime = :endTime');
      expressionAttributeNames['#endTime'] = 'endTime';
      expressionAttributeValues[':endTime'] = params.endTime;
    }

    if (params.title) {
      updateExpression.push('#title = :title');
      expressionAttributeNames['#title'] = 'title';
      expressionAttributeValues[':title'] = params.title;
    }

    if (params.description) {
      updateExpression.push('#description = :description');
      expressionAttributeNames['#description'] = 'description';
      expressionAttributeValues[':description'] = params.description;
    }

    if (params.capacity !== undefined) {
      updateExpression.push('#capacity = :capacity');
      expressionAttributeNames['#capacity'] = 'capacity';
      expressionAttributeValues[':capacity'] = params.capacity;
    }

    if (params.coach) {
      updateExpression.push('#coach = :coach');
      expressionAttributeNames['#coach'] = 'coach';
      expressionAttributeValues[':coach'] = params.coach;
    }

    const result = await this.dynamoDBService.updateItem(this.wodTableName, {
      key: {
        date,
        'startTime#endTime': sortKey,
      },
      updateExpression: `SET ${updateExpression.join(', ')}`,
      expressionAttributeNames,
      expressionAttributeValues,
    });

    return parseDDBItem(result.Attributes, wodSchema);
  }

  async deleteWod(date: number, startTime: number, endTime: number) {
    await this.dynamoDBService.deleteItem(this.wodTableName, {
      key: {
        date,
        'startTime#endTime': this.getSortKey(startTime, endTime),
      },
    });
  }

  private getSortKey(startTime: number, endTime: number) {
    return `${startTime}#${endTime}`;
  }
}
