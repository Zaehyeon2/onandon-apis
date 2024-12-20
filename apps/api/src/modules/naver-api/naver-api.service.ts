import { HttpService } from '@nestjs/axios';
import { Injectable } from '@nestjs/common';
import { AxiosError } from 'axios';
import https from 'https';
import { catchError, firstValueFrom } from 'rxjs';
import { getEnvName, safeParseOrThrow, serviceLogger as slog } from '../../essentials';
import { NaverProfileResDto } from './dto/naver-profile.res.dto';
import { NaverTokenResDto } from './dto/naver-token.res.dto';

const NAVER_OAUTH_AUTHORIZATION_URL = 'https://nid.naver.com/oauth2.0/authorize';
const NAVER_OAUTH_TOKEN_URL = 'https://nid.naver.com/oauth2.0/token';
const NAVER_PROFILE_URL = 'https://openapi.naver.com/v1/nid/me';

@Injectable()
export class NaverApiService {
  private readonly clientId: string;

  private readonly clientSecret: string;

  private readonly redirectUri: string;

  constructor(private readonly httpService: HttpService) {
    if (
      !process.env.NAVER_CLIENT_ID ||
      !process.env.NAVER_CLIENT_SECRET ||
      !process.env.NAVER_REDIRECT_URI
    ) {
      slog.error('Configuration not found', {
        NAVER_CLIENT_ID: !!process.env.NAVER_CLIENT_ID,
        NAVER_CLIENT_SECRET: !!process.env.NAVER_CLIENT_SECRET,
        NAVER_REDIRECT_URI: !!process.env.NAVER_REDIRECT_URI,
      });
      throw new Error('Configuration not found');
    }
    this.clientId = process.env.NAVER_CLIENT_ID;
    this.clientSecret = process.env.NAVER_CLIENT_SECRET;
    this.redirectUri = process.env.NAVER_REDIRECT_URI;
  }

  getAuthorizationUrl() {
    const authorizationUrl = new URL(NAVER_OAUTH_AUTHORIZATION_URL);

    authorizationUrl.searchParams.append('response_type', 'code');
    authorizationUrl.searchParams.append('client_id', this.clientId);
    authorizationUrl.searchParams.append('redirect_uri', this.redirectUri);
    authorizationUrl.searchParams.append('state', 'STATE_STRING');

    return authorizationUrl.toString();
  }

  async getAccessToken(code: string, state: string) {
    const tokenUrl = new URL(NAVER_OAUTH_TOKEN_URL);

    tokenUrl.searchParams.append('grant_type', 'authorization_code');
    tokenUrl.searchParams.append('client_id', this.clientId);
    tokenUrl.searchParams.append('client_secret', this.clientSecret);
    tokenUrl.searchParams.append('code', code);
    tokenUrl.searchParams.append('state', state);

    const { data } = await firstValueFrom(
      this.httpService
        .get(tokenUrl.toString(), {
          headers: {
            'X-Naver-Client-Id': this.clientId,
            'X-Naver-Client-Secret': this.clientSecret,
          },
        })
        .pipe(
          catchError((error: AxiosError) => {
            slog.error('Error getting access token', { error });
            throw error;
          }),
        ),
    );

    if (data.error) {
      slog.error('Error getting access token', { data });
      throw new Error(data.error_description);
    }

    const tokens = safeParseOrThrow(NaverTokenResDto.zodSchema, data);
    return tokens;
  }

  async getProfile(accessToken: string) {
    const { data } = await firstValueFrom(
      this.httpService
        .get(NAVER_PROFILE_URL, {
          headers: { Authorization: `Bearer ${accessToken}` },
          // local 환경에서는 SSL 인증서를 무시 (self-signed certificate error 방지)
          httpsAgent:
            getEnvName() === 'local'
              ? new https.Agent({
                  rejectUnauthorized: false,
                })
              : undefined,
        })
        .pipe(
          catchError((error: AxiosError) => {
            slog.error('Error getting profile', { error });
            throw error;
          }),
        ),
    );

    if (data.error) {
      slog.error('Error getting profile', { data });
      throw new Error(data.error_description);
    }

    const { response } = safeParseOrThrow(NaverProfileResDto.zodSchema, data);

    return response;
  }
}
