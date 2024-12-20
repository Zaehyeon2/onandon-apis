import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy, VerifiedCallback } from 'passport-jwt';
import { JwtPayload } from './jwt.payload.interface';
import { serviceLogger as slog } from '../../../essentials';
import { UserService } from '../../user/user.service';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private readonly userService: UserService) {
    if (!process.env.JWT_SECRET) {
      slog.error('Configuration not found', { JWT_SECRET: !!process.env.JWT_SECRET });
      throw new Error('Configuration not found');
    }
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: process.env.JWT_SECRET,
    });
  }

  async validate(payload: JwtPayload, done: VerifiedCallback) {
    const user = await this.userService.getUserById(payload.user.id);

    if (!user) {
      slog.error('User not found', { payload });
      throw new UnauthorizedException('User not found');
    }

    return done(null, user);
  }
}
