import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Patch,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiOperation } from '@nestjs/swagger';
import { GetUserByPhoneReqDto, GetUserResDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { MaintenanceGuard, MaintenanceType } from '../maintenance';
import { User } from './user.interface';
import { UserParam } from './user.param.decorator';
import { safeParseOrThrow } from '../../essentials';
import { UserGuard } from '../auth/jwt/jwt.user.guard';

@Controller('user')
@UseGuards(MaintenanceGuard([MaintenanceType.GLOBAL]))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  @ApiOperation({ summary: 'Update user' })
  @UserGuard()
  async updateUser(
    @UserParam() user: User,
    @Query() updateUserParams: UpdateUserDto,
  ): Promise<UpdateUserDto> {
    if (user.id !== updateUserParams.id) {
      throw new BadRequestException('Invalid user id');
    }

    await this.userService.updateUser(updateUserParams);

    return safeParseOrThrow(UpdateUserDto.zodSchema.strict(), updateUserParams);
  }

  @Get('my-info')
  @ApiOperation({ summary: 'Get my info' })
  @UserGuard()
  async getMyInfo(@UserParam() user: User): Promise<GetUserResDto> {
    return safeParseOrThrow(GetUserResDto.zodSchema.strict(), user);
  }

  @Get()
  @ApiOperation({ summary: 'Get a user by phoneNumber' })
  async getUserByPhoneNumber(@Query() query: GetUserByPhoneReqDto): Promise<GetUserResDto> {
    const user = await this.userService.getUserByPhoneNumber(query.phoneNumber);

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return safeParseOrThrow(GetUserResDto.zodSchema.strict(), user);
  }
}
