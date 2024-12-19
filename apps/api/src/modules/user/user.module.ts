import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { UserController } from './user.controller';
import { UserRepository } from './user.repository';
import { UserService } from './user.service';
import { DynamoDBModule } from '../dynamoDB';
import { MaintenanceGuard, MaintenanceModule, MaintenanceType } from '../maintenance';

@Module({
  imports: [DynamoDBModule, MaintenanceModule],
  providers: [
    {
      provide: APP_GUARD,
      useClass: MaintenanceGuard([MaintenanceType.GLOBAL]),
    },
    UserService,
    UserRepository,
  ],
  controllers: [UserController],
  exports: [UserService],
})
export class UserModule {}
