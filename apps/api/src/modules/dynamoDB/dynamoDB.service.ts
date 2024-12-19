import { DynamoDBClient, ReturnValue } from '@aws-sdk/client-dynamodb';
import {
  BatchWriteCommand,
  DeleteCommand,
  DynamoDBDocumentClient,
  PutCommand,
  GetCommand,
  QueryCommand,
  UpdateCommand,
  TransactWriteCommand,
  TransactWriteCommandInput,
  NativeAttributeValue,
} from '@aws-sdk/lib-dynamodb';
import { Injectable } from '@nestjs/common';
import { chunk, serviceLogger as slog } from '../../essentials';

const BATCH_SIZE = 25;
const COMMAND_SIZE_AT_ONCE = 10;

@Injectable()
export class DynamoDBService {
  private readonly client: DynamoDBDocumentClient;

  constructor() {
    this.client = DynamoDBDocumentClient.from(new DynamoDBClient(), {
      marshallOptions: { removeUndefinedValues: true, convertClassInstanceToMap: true },
    });
  }

  public getClient() {
    return this.client;
  }

  public async getItem(
    tableName: string,
    params: {
      key: Record<string, NativeAttributeValue>;
      expressionAttributeNames?: Record<string, string>;
    },
  ) {
    try {
      const result = await this.client.send(
        new GetCommand({
          TableName: tableName,
          Key: params.key,
          ExpressionAttributeNames: params.expressionAttributeNames,
        }),
      );

      return result;
    } catch (error) {
      slog.error('getItem', { tableName, error, params });
      throw error;
    }
  }

  public async putItem(
    tableName: string,
    params: {
      item: Record<string, NativeAttributeValue>;
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, NativeAttributeValue>;
      returnValues?: 'NONE' | 'ALL_OLD';
    },
  ) {
    try {
      const result = await this.client.send(
        new PutCommand({
          TableName: tableName,
          Item: params.item,
          ConditionExpression: params.conditionExpression,
          ExpressionAttributeNames: params.expressionAttributeNames,
          ExpressionAttributeValues: params.expressionAttributeValues,
          ReturnValues: params.returnValues,
        }),
      );

      return result;
    } catch (error) {
      slog.error('putItem', { tableName, error, params });
      throw error;
    }
  }

  public async deleteItem(
    tableName: string,
    params: {
      key: Record<string, NativeAttributeValue>;
      conditionExpression?: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, NativeAttributeValue>;
      returnValues?: 'NONE' | 'ALL_OLD';
    },
  ) {
    try {
      const result = await this.client.send(
        new DeleteCommand({
          TableName: tableName,
          Key: params.key,
          ConditionExpression: params.conditionExpression,
          ExpressionAttributeNames: params.expressionAttributeNames,
          ExpressionAttributeValues: params.expressionAttributeValues,
          ReturnValues: params.returnValues,
        }),
      );

      return result;
    } catch (error) {
      slog.error('deleteItem', { tableName, error, params });
      throw error;
    }
  }

  public async updateItem(
    tableName: string,
    params: {
      key: Record<string, NativeAttributeValue>;
      updateExpression: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, NativeAttributeValue>;
      conditionExpression?: string;
      returnValues?: ReturnValue;
    },
  ) {
    try {
      const result = await this.client.send(
        new UpdateCommand({
          TableName: tableName,
          Key: params.key,
          UpdateExpression: params.updateExpression,
          ExpressionAttributeNames: params.expressionAttributeNames,
          ExpressionAttributeValues: params.expressionAttributeValues,
          ConditionExpression: params.conditionExpression,
          ReturnValues: params.returnValues,
        }),
      );

      return result;
    } catch (error) {
      slog.error('updateItem', { tableName, error, params });
      throw error;
    }
  }

  public async queryItems(
    tableName: string,
    params: {
      keyConditionExpression: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, NativeAttributeValue>;
      filterExpression?: string;
      limit?: number;
      exclusiveStartKey?: Record<string, NativeAttributeValue>;
      scanIndexForward?: boolean;
      indexName?: string;
    },
  ) {
    try {
      const result = await this.client.send(
        new QueryCommand({
          TableName: tableName,
          KeyConditionExpression: params.keyConditionExpression,
          ExpressionAttributeNames: params.expressionAttributeNames,
          ExpressionAttributeValues: params.expressionAttributeValues,
          FilterExpression: params.filterExpression,
          Limit: params.limit,
          ExclusiveStartKey: params.exclusiveStartKey,
          ScanIndexForward: params.scanIndexForward,
          IndexName: params.indexName,
        }),
      );

      return result;
    } catch (error) {
      slog.error('queryItems', { tableName, error, params });
      throw error;
    }
  }

  public async batchWriteItems(tableName: string, items: Record<string, NativeAttributeValue>[]) {
    try {
      // batch로 나누기
      const batches = chunk(items, BATCH_SIZE);

      // COMMAND_SIZE_AT_ONCE만큼 command를 나누어 전송
      const commands = chunk(batches, COMMAND_SIZE_AT_ONCE);

      // eslint-disable-next-line no-restricted-syntax
      for (const command of commands) {
        // eslint-disable-next-line no-await-in-loop
        const results = await Promise.all(
          command.map(async (batch) => {
            const request = batch.map((item) => {
              return {
                PutRequest: {
                  Item: item,
                },
              };
            });

            return this.client.send(
              new BatchWriteCommand({
                RequestItems: {
                  [tableName]: request,
                },
              }),
            );
          }),
        );

        // eslint-disable-next-line no-await-in-loop
        await Promise.all(
          results.map((result) => {
            if (result.UnprocessedItems && result.UnprocessedItems[tableName]) {
              // UnprocessedItems가 있으면 다시 전송
              return this.client.send(
                new BatchWriteCommand({
                  RequestItems: result.UnprocessedItems,
                }),
              );
            }
            return undefined;
          }),
        );
      }
    } catch (error) {
      slog.error('batchWriteItems', { tableName, error });
      throw error;
    }
  }

  public async queryAllItems(
    tableName: string,
    params: {
      keyConditionExpression: string;
      expressionAttributeNames?: Record<string, string>;
      expressionAttributeValues?: Record<string, NativeAttributeValue>;
    },
  ) {
    try {
      const items: Record<string, NativeAttributeValue>[] = [];
      let cursor: Record<string, NativeAttributeValue> | undefined;

      do {
        // eslint-disable-next-line no-await-in-loop
        const { Items, LastEvaluatedKey } = await this.client.send(
          new QueryCommand({
            TableName: tableName,
            KeyConditionExpression: params.keyConditionExpression,
            ExpressionAttributeNames: params.expressionAttributeNames,
            ExpressionAttributeValues: params.expressionAttributeValues,
            ExclusiveStartKey: cursor,
          }),
        );

        items.push(...(Items ?? []));
        cursor = LastEvaluatedKey;
      } while (cursor);

      return items;
    } catch (error) {
      slog.error('queryAllItems', { tableName, error, params });
      throw error;
    }
  }

  public async transactWriteItems(input: TransactWriteCommandInput['TransactItems']) {
    try {
      await this.client.send(
        new TransactWriteCommand({
          TransactItems: input,
        }),
      );
    } catch (error) {
      slog.error('transactWriteItems', { error });
      throw error;
    }
  }
}
