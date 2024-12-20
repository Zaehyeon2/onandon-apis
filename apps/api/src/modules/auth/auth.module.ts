import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { AdminGuardInner } from './jwt/jwt.admin.guard';
import { JwtStrategy } from './jwt/jwt.strategy';
import { UserGuardInner } from './jwt/jwt.user.guard';
import { UserModule } from '../user/user.module';
import { JwtService } from './jwt/jwt.service';

@Module({
  imports: [UserModule, PassportModule, JwtModule],
  providers: [JwtStrategy, UserGuardInner, AdminGuardInner, JwtService],
  exports: [UserGuardInner, AdminGuardInner, JwtService],
})
export class AuthModule {}
