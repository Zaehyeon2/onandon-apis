import { ConditionalCheckFailedException } from '@aws-sdk/client-dynamodb';
import { ConflictException, Injectable, NotFoundException } from '@nestjs/common';
import { UpdateUserDto } from './dto';
import { Gender } from './user.interface';
import { UserRepository } from './user.repository';
import { serviceLogger as slog } from '../../essentials';

@Injectable()
export class UserService {
  constructor(private readonly userRepository: UserRepository) {}

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
      const user = await this.userRepository.createUser(
        id,
        email,
        name,
        phoneNumber,
        gender,
        birthDate,
        profileImage,
      );
      return user;
    } catch (error) {
      slog.error('Error creating user', { error });
      if (error instanceof ConditionalCheckFailedException) {
        throw new ConflictException('Email or PhoneNumber already exists');
      }
      throw error;
    }
  }

  async getUserById(id: string) {
    const user = await this.userRepository.getUserById(id);

    return user;
  }

  async getUserByPhoneNumber(phoneNumber: string) {
    const user = await this.userRepository.getUserByPhoneNumber(phoneNumber);

    return user;
  }

  async updateUser(updateUserParams: UpdateUserDto) {
    const user = await this.getUserById(updateUserParams.id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    // phoneNumber가 변경되었을 때, phoneNumber가 이미 존재하는지 확인
    if (updateUserParams.phoneNumber && updateUserParams.phoneNumber !== user.phoneNumber) {
      const existingUser = await this.getUserByPhoneNumber(updateUserParams.phoneNumber);

      if (existingUser) {
        throw new ConflictException('PhoneNumber already exists');
      }
    }

    await this.userRepository.updateUser(updateUserParams);
  }

  async updateIsAdmin(id: string, isAdmin: boolean) {
    const user = await this.getUserById(id);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    await this.userRepository.updateIsAdmin(id, isAdmin);
  }
}
