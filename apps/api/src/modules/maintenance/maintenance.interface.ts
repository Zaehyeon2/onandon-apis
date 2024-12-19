import { createZodDto } from '@anatine/zod-nestjs';
import z from 'zod';

export enum MaintenanceType {
  GLOBAL = 'GLOBAL',
}

export const maintenanceSchema = z.object({
  type: z.nativeEnum(MaintenanceType).describe('The type of maintenance'),
  isUnderMaintenance: z.boolean().describe('Whether the maintenance is under maintenance'),
  updatedAt: z.coerce.number().describe('The timestamp when the maintenance was updated'),
  updatedBy: z.string().describe('The user who updated the maintenance'),
});

export class MaintenanceDto extends createZodDto(maintenanceSchema) {}
