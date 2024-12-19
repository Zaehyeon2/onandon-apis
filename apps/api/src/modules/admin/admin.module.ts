import { Module } from '@nestjs/common';
import { MaintenanceModule } from '../maintenance';
import { AdminController } from './admin.controller';
import { UserModule } from '../user/user.module';

@Module({
  imports: [MaintenanceModule, UserModule],
  controllers: [AdminController],
})
export class AdminModule {}
