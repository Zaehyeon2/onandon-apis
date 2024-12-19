import { NativeAttributeValue } from '@aws-sdk/lib-dynamodb';
import { BadRequestException, Injectable, InternalServerErrorException } from '@nestjs/common';
import { UpdateUserDto } from './dto';
import { Gender, User, userSchema } from './user.interface';
import { parseDDBItem, serviceLogger as slog } from '../../essentials';
import { DynamoDBService } from '../dynamoDB/dynamoDB.service';

@Injectable()
export class UserRepository {
  private readonly userTableName;

  constructor(private readonly dynamoDBService: DynamoDBService) {
    if (!process.env.DDB_USER_TABLE_NAME) {
      slog.error('Configurations not found', {
        DDB_USER_TABLE_NAME: !!process.env.DDB_USER_TABLE_NAME,
      });
      throw new InternalServerErrorException('Configurations not found');
    }
    this.userTableName = process.env.DDB_USER_TABLE_NAME;
  }

  async createUser(
    id: string,
    email: string,
    name: string,
    phoneNumber: string,
    gender: Gender,
    birthDate: number,
    profileImage?: string,
  ) {
    try {
      const user: User = {
        id,
        email,
        name,
        phoneNumber,
        gender,
        birthDate,
        isAdmin: false,
        createdAt: Date.now(),
        profileImage,
      };

      const result = await this.dynamoDBService.putItem(this.userTableName, {
        item: user,
        conditionExpression: 'attribute_not_exists(id) AND attribute_not_exists(phoneNumber)',
      });

      return parseDDBItem(result.Attributes, userSchema);
    } catch (error) {
      slog.error('Error creating user', { error });
      throw error;
    }
  }

  async updateUser(user: UpdateUserDto) {
    try {
      const updateExpression = [];
      const expressionAttributeNames: Record<string, string> = {};
      const expressionAttributeValues: Record<string, NativeAttributeValue> = {};

      if (user.email) {
        updateExpression.push('#email = :email');
        expressionAttributeNames['#email'] = 'email';
        expressionAttributeValues[':email'] = user.email;
      }

      if (user.name) {
        updateExpression.push('#name = :name');
        expressionAttributeNames['#name'] = 'name';
        expressionAttributeValues[':name'] = user.name;
      }

      if (user.phoneNumber) {
        updateExpression.push('#phoneNumber = :phoneNumber');
        expressionAttributeNames['#phoneNumber'] = 'phoneNumber';
        expressionAttributeValues[':phoneNumber'] = user.phoneNumber;
      }

      if (user.gender) {
        updateExpression.push('#gender = :gender');
        expressionAttributeNames['#gender'] = 'gender';
        expressionAttributeValues[':gender'] = user.gender;
      }

      if (user.birthDate) {
        updateExpression.push('#birthDate = :birthDate');
        expressionAttributeNames['#birthDate'] = 'birthDate';
        expressionAttributeValues[':birthDate'] = user.birthDate;
      }

      if (user.profileImage) {
        updateExpression.push('#profileImage = :profileImage');
        expressionAttributeNames['#profileImage'] = 'profileImage';
        expressionAttributeValues[':profileImage'] = user.profileImage;
      }

      if (updateExpression.length === 0) {
        slog.error('No fields to update', {
          user,
        });
        throw new BadRequestException('No fields to update');
      }

      const result = await this.dynamoDBService.updateItem(this.userTableName, {
        key: { id: user.id },
        updateExpression: `SET ${updateExpression.join(', ')}`,
        expressionAttributeNames,
        expressionAttributeValues,
      });

      return parseDDBItem(result.Attributes, userSchema);
    } catch (error) {
      slog.error('Error updating user', { error });
      throw error;
    }
  }

  async updateIsAdmin(id: string, isAdmin: boolean) {
    try {
      const result = await this.dynamoDBService.updateItem(this.userTableName, {
        key: { id },
        updateExpression: 'SET isAdmin = :isAdmin',
        expressionAttributeValues: {
          ':isAdmin': isAdmin,
        },
      });

      return parseDDBItem(result.Attributes, userSchema);
    } catch (error) {
      slog.error('Error updating isAdmin', { error });
      throw error;
    }
  }

  async getUserById(id: string) {
    try {
      const result = await this.dynamoDBService.getItem(this.userTableName, {
        key: { id },
      });

      return parseDDBItem(result.Item, userSchema);
    } catch (error) {
      slog.error('Error getting user by id', { error });
      throw error;
    }
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    try {
      const result = await this.dynamoDBService.queryItems(this.userTableName, {
        indexName: 'idxPhoneNumber',
        keyConditionExpression: 'phoneNumber = :phoneNumber',
        expressionAttributeValues: {
          ':phoneNumber': phoneNumber,
        },
      });

      if (!result.Items || result.Items.length === 0) {
        return null;
      }

      return parseDDBItem(result.Items[0], userSchema);
    } catch (error) {
      slog.error('Error getting user by phone number', { error });
      throw error;
    }
  }
}
