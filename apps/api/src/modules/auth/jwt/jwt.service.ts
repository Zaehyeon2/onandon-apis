import { Injectable } from '@nestjs/common';
import { JwtService as NestJwtService } from '@nestjs/jwt';
import { JwtPayload } from './jwt.payload.interface';
import { serviceLogger as slog } from '../../../essentials';
import { User } from '../../user/user.interface';

@Injectable()
export class JwtService {
  private readonly jwtSecret;

  constructor(private readonly jwtService: NestJwtService) {
    if (!process.env.JWT_SECRET) {
      slog.error('Configuration not found', { JWT_SECRET: !!process.env.JWT_SECRET });
      throw new Error('Configuration not found');
    }
    this.jwtSecret = process.env.JWT_SECRET;
  }

  async createToken(user: User) {
    const payload: JwtPayload = { user, issuedAt: Date.now() };
    return this.jwtService.signAsync(payload, {
      secret: this.jwtSecret,
      expiresIn: '4h',
    });
  }
}
