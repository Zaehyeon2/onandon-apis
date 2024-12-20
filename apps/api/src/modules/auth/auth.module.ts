import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminGuard } from './jwt/jwt.admin.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserGuard } from './jwt/jwt.user.guard';
import { UserModule } from '../user/user.module';
import { JwtService } from './jwt/jwt.service';

@Module({
  imports: [UserModule, PassportModule, JwtModule],
  providers: [JwtStrategy, UserGuard, AdminGuard, JwtService],
  exports: [UserGuard, AdminGuard, JwtService],
})
export class AuthModule {}
