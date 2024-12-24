import { Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GetWodResDto, GetWodReqDto } from './dto';
import { BookWodReqDto } from './dto/book-wod.req.dto';
import { WodService } from './wod.service';
import { getDayByDate, getWeekRangeByDate, safeParseOrThrow } from '../../essentials';
import { UserGuard } from '../auth/jwt/jwt.user.guard';
import { User } from '../user/user.interface';
import { UserParam } from '../user/user.param.decorator';

@Controller('wod')
@UserGuard()
export class WodController {
  constructor(private readonly wodService: WodService) {}

  @Get('day/:date')
  @ApiOperation({ summary: 'Get WOD by day' })
  async getWodByDay(
    @UserParam() user: User,
    @Param() getWodReqDto: GetWodReqDto,
  ): Promise<GetWodResDto> {
    const wod = await this.wodService.getWodByDay(getWodReqDto.date);

    const response: GetWodResDto = {
      results: [
        {
          date: getDayByDate(getWodReqDto.date),
          wod: wod.map((w) => this.wodService.convertToExternalWod(w, user)),
        },
      ],
    };

    return safeParseOrThrow(GetWodResDto.zodSchema.strict(), response);
  }

  @Get('week/:date')
  @ApiOperation({ summary: 'Get WOD by week' })
  async getWodByWeek(
    @UserParam() user: User,
    @Param() getWodReqDto: GetWodReqDto,
  ): Promise<GetWodResDto> {
    const weekRange = getWeekRangeByDate(getWodReqDto.date);

    const wods = await Promise.all(
      weekRange.map((date) => {
        return this.wodService.getWodByDay(date);
      }),
    );

    const response: GetWodResDto = {
      results: weekRange.map((date, index) => {
        return {
          date: getDayByDate(date),
          wod: wods[index]!.map((w) => this.wodService.convertToExternalWod(w, user)),
        };
      }),
    };

    return safeParseOrThrow(GetWodResDto.zodSchema.strict(), response);
  }

  @Post('book')
  @ApiOperation({ summary: 'Book WOD' })
  async bookWod(
    @UserParam() user: User,
    @Query() bookWodReqDto: BookWodReqDto,
  ): Promise<BookWodReqDto> {
    // TODO: 수강권 체크
    await this.wodService.bookWod(user, bookWodReqDto);
    return safeParseOrThrow(BookWodReqDto.zodSchema.strict(), bookWodReqDto);
  }

  @Post('un-book')
  @ApiOperation({ summary: 'UnBook WOD' })
  async unBookWod(
    @UserParam() user: User,
    @Query() bookWodReqDto: BookWodReqDto,
  ): Promise<BookWodReqDto> {
    // TODO: 수강권 체크
    await this.wodService.unBookWod(user, bookWodReqDto);
    return safeParseOrThrow(BookWodReqDto.zodSchema.strict(), bookWodReqDto);
  }
}
