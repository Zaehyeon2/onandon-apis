import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';
import { MaintenanceType } from '../../maintenance';

export class GetMaintenanceReqDto extends createZodDto(
  z.object({
    type: z
      .nativeEnum(MaintenanceType)
      .describe('The type of maintenance, if not provided, all maintenance will be returned'),
  }),
) {}
