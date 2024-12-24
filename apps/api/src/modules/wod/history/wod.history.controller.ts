import { Controller, Get, Query } from '@nestjs/common';
import { ApiTags } from '@nestjs/swagger';
import { encodeBase64Url, safeParseOrThrow } from 'apps/api/src/essentials';
import { WodHistoryService } from './wod.history.service';
import { UserGuard } from '../../auth/jwt/jwt.user.guard';
import { User } from '../../user/user.interface';
import { UserParam } from '../../user/user.param.decorator';
import { GetWodHistoryResDto, GetWodHistoryReqDto } from '../dto';

@Controller('wod/history')
@ApiTags('Wod')
@UserGuard()
export class WodHistoryController {
  constructor(private readonly wodHistoryService: WodHistoryService) {}

  @Get()
  async getWodHistory(
    @UserParam() user: User,
    @Query() getWodHistoryDto: GetWodHistoryReqDto,
  ): Promise<GetWodHistoryResDto> {
    const wodHistory = await this.wodHistoryService.queryHistoryByUserId(
      user.id,
      getWodHistoryDto.cursor,
      getWodHistoryDto.size,
    );

    const response: GetWodHistoryResDto = {
      results: wodHistory.histories,
      cursor: encodeBase64Url(wodHistory.cursor),
    };

    return safeParseOrThrow(GetWodHistoryResDto.zodSchema.strict(), response);
  }
}
