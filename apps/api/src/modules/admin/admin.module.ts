import { Module } from '@nestjs/common';
import { MaintenanceModule } from '../maintenance';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';
import { WodModule } from '../wod/wod.module';

@Module({
  imports: [MaintenanceModule, UserModule, WodModule],
  controllers: [AdminController],
})
export class AdminModule {}
