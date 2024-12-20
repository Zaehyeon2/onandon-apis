import { Injectable } from '@nestjs/common';
import { NaverApiService } from '../naver-api/naver-api.service';
import { User } from '../user/user.interface';
import { UserService } from '../user/user.service';

@Injectable()
export class LoginService {
  constructor(
    private readonly naverApiService: NaverApiService,
    private readonly userService: UserService,
  ) {}

  getAuthorizationUrl() {
    return this.naverApiService.getAuthorizationUrl();
  }

  async getAccessToken(code: string, state: string) {
    return this.naverApiService.getAccessToken(code, state);
  }

  async loginOrRegisterUser(accessToken: string): Promise<User> {
    const profile = await this.naverApiService.getProfile(accessToken);

    const user = await this.userService.getUserById(profile.id);

    if (!user) {
      const birthDate = new Date(`${profile.birthyear}-${profile.birthday}`).getTime();
      await this.userService.createUser(
        profile.id,
        profile.email,
        profile.name,
        profile.mobile,
        profile.gender,
        birthDate,
        profile.profile_image,
      );

      return {
        id: profile.id,
        email: profile.email,
        name: profile.name,
        phoneNumber: profile.mobile,
        gender: profile.gender,
        birthDate,
        isAdmin: false,
        profileImage: profile.profile_image,
        createdAt: Date.now(),
      };
    }

    return user;
  }
}
