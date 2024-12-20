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
import { GetUserReqDto, GetUserResDto, UpdateUserDto } from './dto';
import { UserService } from './user.service';
import { MaintenanceGuard, MaintenanceType } from '../maintenance';
import { User } from './user.interface';
import { safeParseOrThrow } from '../../essentials';

@Controller('user')
@UseGuards(MaintenanceGuard([MaintenanceType.GLOBAL]))
export class UserController {
  constructor(private readonly userService: UserService) {}

  @Patch()
  @ApiOperation({ summary: 'Update user' })
  async updateUser(@Query() updateUserParams: UpdateUserDto): Promise<UpdateUserDto> {
    await this.userService.updateUser(updateUserParams);

    return safeParseOrThrow(UpdateUserDto.zodSchema.strict(), updateUserParams);
  }

  @Get()
  @ApiOperation({ summary: 'Get a user by id or phoneNumber' })
  async getUserByIdOrPhoneNumber(@Query() query: GetUserReqDto): Promise<GetUserResDto> {
    let user: User | null = null;

    if (query.id) {
      user = await this.userService.getUserById(query.id);
    } else if (query.phoneNumber) {
      user = await this.userService.getUserByPhoneNumber(query.phoneNumber);
    } else {
      throw new BadRequestException('id or phoneNumber is required');
    }

    if (!user) {
      throw new NotFoundException('User not found');
    }

    return safeParseOrThrow(GetUserResDto.zodSchema.strict(), user);
  }
}
