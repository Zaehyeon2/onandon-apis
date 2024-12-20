import { Module } from '@nestjs/common';
import { LoginController } from './login.controller';
import { LoginService } from './login.service';
import { AuthModule } from '../auth/auth.module';
import { NaverApiModule } from '../naver-api/naver-api.modules';
import { UserModule } from '../user/user.module';

@Module({
  imports: [UserModule, NaverApiModule, AuthModule],
  providers: [LoginService],
  controllers: [LoginController],
})
export class LoginModule {}
