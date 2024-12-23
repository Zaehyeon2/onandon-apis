import z from 'zod';
import { userSchema } from '../../user/user.interface';

export const jwtPayloadSchema = z.object({
  user: userSchema,
  issuedAt: z.coerce.number(),
});

export type JwtPayload = z.infer<typeof jwtPayloadSchema>;
