import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOAuthUrlResDto, OAuthCallbackResDto } from './dto';
import { LoginService } from './login.service';
import { safeParseOrThrow } from '../../essentials';
import { JwtService } from '../auth/jwt/jwt.service';
import { NaverOAuthCallbackDto } from '../naver-api/dto';

@Controller('login')
@ApiTags('Login')
export class LoginController {
  constructor(
    private readonly loginService: LoginService,
    private readonly jwtService: JwtService,
  ) {}

  @Get('oauth/url')
  @ApiOperation({ summary: 'Get authorization url' })
  async getAuthorizationUrl(): Promise<GetOAuthUrlResDto> {
    const response: GetOAuthUrlResDto = {
      authorizationUrl: this.loginService.getAuthorizationUrl(),
    };

    return safeParseOrThrow(GetOAuthUrlResDto.zodSchema.strict(), response);
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth callback' })
  async oauthCallback(
    @Query() callbackParams: NaverOAuthCallbackDto,
  ): Promise<OAuthCallbackResDto> {
    const accessTokens = await this.loginService.getAccessToken(
      callbackParams.code,
      callbackParams.state,
    );

    const user = await this.loginService.loginOrRegisterUser(accessTokens.access_token);

    const jwtToken = await this.jwtService.createToken(user);

    const response: OAuthCallbackResDto = {
      jwtToken,
    };

    return safeParseOrThrow(OAuthCallbackResDto.zodSchema.strict(), response);
  }

  @Get('test/:accessToken')
  async test(@Param('accessToken') accessToken: string) {
    return this.loginService.loginOrRegisterUser(accessToken);
  }
}
