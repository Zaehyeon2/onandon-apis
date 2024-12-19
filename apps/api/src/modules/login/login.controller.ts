import { Controller, Get, Param, Query } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { GetOAuthUrlResDto } from './dto';
import { LoginService } from './login.service';
import { safeParseOrThrow } from '../../essentials';
import { NaverOAuthCallbackDto, NaverTokenResDto } from '../naver-api/dto';

@Controller('login')
@ApiTags('Login')
export class LoginController {
  constructor(private readonly loginService: LoginService) {}

  @Get('oauth/url')
  @ApiOperation({ summary: 'Get authorization url' })
  async getAuthorizationUrl(): Promise<GetOAuthUrlResDto> {
    const url = await this.loginService.getAuthorizationUrl();

    const response: GetOAuthUrlResDto = {
      authorizationUrl: url,
    };

    return safeParseOrThrow(GetOAuthUrlResDto.zodSchema.strict(), response);
  }

  @Get('oauth/callback')
  @ApiOperation({ summary: 'OAuth callback' })
  async oauthCallback(@Query() callbackParams: NaverOAuthCallbackDto): Promise<NaverTokenResDto> {
    const accessTokens = await this.loginService.getAccessToken(
      callbackParams.code,
      callbackParams.state,
    );
    const now = Date.now();

    await this.loginService.loginOrRegisterUser(accessTokens.access_token);

    const response: NaverTokenResDto = {
      access_token: accessTokens.access_token,
      refresh_token: accessTokens.refresh_token,
      token_type: accessTokens.token_type,
      expires_in: `${now + Number(accessTokens.expires_in) * 1000}`,
    };

    // TODO: JWT 토큰 발급

    return safeParseOrThrow(NaverTokenResDto.zodSchema.strict(), response);
  }

  @Get('test/:accessToken')
  async test(@Param('accessToken') accessToken: string) {
    return this.loginService.loginOrRegisterUser(accessToken);
  }
}
