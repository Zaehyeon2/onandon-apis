import { Injectable } from '@nestjs/common';
import { WodHistoryCursor } from './wod.history.interface';
import { WodHistoryRepository } from './wod.history.repository';
import { User } from '../../user/user.interface';
import { ExternalWod } from '../wod.interface';

@Injectable()
export class WodHistoryService {
  constructor(private readonly wodHistoryRepository: WodHistoryRepository) {}

  async putHistory(user: User, wod: ExternalWod) {
    return this.wodHistoryRepository.putHistory(user, wod);
  }

  async deleteHistory(user: User, wod: ExternalWod) {
    return this.wodHistoryRepository.deleteHistory(user, wod);
  }

  async queryHistoryByUserId(userId: string, cursor?: WodHistoryCursor, limit: number = 10) {
    return this.wodHistoryRepository.queryHistoryByUserId(userId, cursor, limit);
  }
}
