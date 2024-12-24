import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { Wod } from './wod.interface';
import { WodRepository } from './wod.repository';
import { getDayByDate, serviceLogger as slog } from '../../essentials';
import { User } from '../user/user.interface';
import { WodHistoryService } from './history/wod.history.service';

@Injectable()
export class WodService {
  constructor(
    private readonly wodRepository: WodRepository,
    private readonly wodHistoryService: WodHistoryService,
  ) {}

  async getWodByDay(date: number) {
    return this.wodRepository.getWodByDay(getDayByDate(date));
  }

  async getWodByDayAndSortKey(date: number, sortKey: string) {
    return this.wodRepository.getWodByDayAndSortKeyString(date, sortKey);
  }

  async putWod(
    params: Pick<
      Wod,
      'date' | 'startTime' | 'endTime' | 'title' | 'description' | 'capacity' | 'coach'
    >,
  ) {
    return this.wodRepository.putWod(params);
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
    return this.wodRepository.updateWod(date, sortKey, params);
  }

  async deleteWod(date: number, startTime: number, endTime: number) {
    await this.wodRepository.deleteWod(date, startTime, endTime);
  }

  async bookWod(user: User, params: { date: number; startTime: number; endTime: number }) {
    const wod = await this.wodRepository.getWodByDayAndSortKey(
      params.date,
      params.startTime,
      params.endTime,
    );

    if (!wod) {
      slog.error('Wod not found', {
        date: params.date,
        startTime: params.startTime,
        endTime: params.endTime,
      });
      throw new NotFoundException('Wod not found');
    }

    if (wod.participants[user.id]) {
      slog.error('Already booked', {
        user,
        wod,
      });
      throw new ConflictException('Already booked');
    }

    const preWod = { ...wod, participants: { ...wod.participants } };

    wod.participants[user.id] = user;

    try {
      await this.wodRepository.updateParticipants(user, preWod, wod);
      await this.wodHistoryService.putHistory(user, this.convertToExternalWod(wod, user));
    } catch (error) {
      if (error instanceof ConditionalCheckFailedException) {
        throw new ConflictException('Capacity is full');
      }
      throw error;
    }
  }

  async unBookWod(user: User, params: { date: number; startTime: number; endTime: number }) {
    const wod = await this.wodRepository.getWodByDayAndSortKey(
      params.date,
      params.startTime,
      params.endTime,
    );

    if (!wod) {
      throw new NotFoundException('Wod not found');
    }

    if (!wod.participants[user.id]) {
      throw new NotFoundException('Not booked');
    }

    const preWod = { ...wod, participants: { ...wod.participants } };

    delete wod.participants[user.id];

    await this.wodRepository.updateParticipants(user, preWod, wod);
    await this.wodHistoryService.deleteHistory(user, this.convertToExternalWod(wod, user));
  }

  convertToExternalWod(wod: Wod, user: User) {
    return {
      date: wod.date,
      startTime: wod.startTime,
      endTime: wod.endTime,
      title: wod.title,
      description: wod.description,
      capacity: wod.capacity,
      participantsCount: Object.keys(wod.participants).length,
      coach: wod.coach,
      isBooked: !!wod.participants[user.id],
    };
  }
}
