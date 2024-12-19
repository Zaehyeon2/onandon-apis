import { createZodDto } from '@anatine/zod-nestjs';
import { maintenanceSchema } from '../../maintenance';

export class UpdateMaintenanceDto extends createZodDto(
  maintenanceSchema
    .omit({
      updatedAt: true,
    })
    .describe('Update maintenance request schema'),
) {}
