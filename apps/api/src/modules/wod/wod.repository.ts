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

  private getSortKey(startTime: number, endTime: number) {
    return `${startTime}#${endTime}`;
  }
}
