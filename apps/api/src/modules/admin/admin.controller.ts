import { Body, Controller, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiOperation, ApiTags } from '@nestjs/swagger';
import { UpdateMaintenanceDto, GetMaintenanceReqDto, UpdateIsAdminDto } from './dto';
import { safeParseOrThrow } from '../../essentials';
import { MaintenanceDto } from '../maintenance/maintenance.interface';
import { MaintenanceService } from '../maintenance/maintenance.service';
import { UserService } from '../user/user.service';

const maintenancePrefix = 'maintenance';
const userPrefix = 'user';

// TODO: ADMIN AUTH
@Controller('admin')
@ApiTags('Admin')
export class AdminController {
  constructor(
    private readonly maintenanceService: MaintenanceService,
    private readonly userService: UserService,
  ) {}

  /** ****************************************
   *                 MAINTENANCE
   **************************************** */

  @Post(maintenancePrefix)
  @ApiOperation({ summary: 'Update maintenance status' })
  async updateMaintenance(
    @Body() updateMaintenanceDto: UpdateMaintenanceDto,
  ): Promise<UpdateMaintenanceDto> {
    await this.maintenanceService.updateMaintenance(
      updateMaintenanceDto.type,
      updateMaintenanceDto.isUnderMaintenance,
      updateMaintenanceDto.updatedBy,
    );

    return safeParseOrThrow(UpdateMaintenanceDto.zodSchema.strict(), updateMaintenanceDto);
  }

  @Get(`${maintenancePrefix}/:type`)
  @ApiOperation({ summary: 'Get maintenance' })
  async getMaintenance(
    @Param() getMaintenanceReqDto: GetMaintenanceReqDto,
  ): Promise<MaintenanceDto> {
    const maintenance = await this.maintenanceService.getMaintenance(getMaintenanceReqDto.type);

    const response: MaintenanceDto = {
      type: maintenance.type,
      isUnderMaintenance: maintenance.isUnderMaintenance,
      updatedBy: maintenance.updatedBy,
      updatedAt: maintenance.updatedAt,
    };

    return safeParseOrThrow(MaintenanceDto.zodSchema.strict(), response);
  }

  @Get(maintenancePrefix)
  @ApiOperation({ summary: 'Get all maintenances' })
  async getMaintenances(): Promise<MaintenanceDto[]> {
    const maintenances = await this.maintenanceService.getMaintenances();

    const response: MaintenanceDto[] = maintenances.map((maintenance) => ({
      type: maintenance.type,
      isUnderMaintenance: maintenance.isUnderMaintenance,
      updatedBy: maintenance.updatedBy,
      updatedAt: maintenance.updatedAt,
    }));

    return response.map((maintenance) =>
      safeParseOrThrow(MaintenanceDto.zodSchema.strict(), maintenance),
    );
  }

  /** ****************************************
   *                 USER
   **************************************** */

  @Patch(`${userPrefix}/isAdmin`)
  @ApiOperation({ summary: 'Update user isAdmin status' })
  async updateIsAdmin(@Body() updateIsAdminDto: UpdateIsAdminDto): Promise<UpdateIsAdminDto> {
    await this.userService.updateIsAdmin(updateIsAdminDto.id, updateIsAdminDto.isAdmin);

    return safeParseOrThrow(UpdateIsAdminDto.zodSchema.strict(), updateIsAdminDto);
  }
}
