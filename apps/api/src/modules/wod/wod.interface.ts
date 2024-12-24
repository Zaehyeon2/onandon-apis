import z from 'zod';
import { userSchema } from '../user/user.interface';

export const wodSchema = z.object({
  date: z.coerce.number().describe('The date (day) of the WOD (Date / 1000 / 60 / 60 / 24)'),
  'startTime#endTime': z
    .string()
    .describe('The start and end time of the WOD (sortKey for DynamoDB)'),
  startTime: z.coerce.number().describe('The start time (minutes) of the WOD (Date / 1000 / 60)'),
  endTime: z.coerce.number().describe('The end time (minutes) of the WOD (Date / 1000 / 60)'),
  title: z.string().describe('The title of the WOD'),
  description: z.string().describe('The description of the WOD'),
  capacity: z.coerce.number().describe('The capacity of the WOD'),
  participants: z
    .record(z.string().describe('The id of participant'), userSchema)
    .describe('The participants of the WOD'),
  coach: z.string().describe('The coach of the WOD'),
});

export type Wod = z.infer<typeof wodSchema>;

export const externalWodSchema = wodSchema
  .omit({
    'startTime#endTime': true,
    participants: true,
  })
  .extend({
    participantsCount: z.coerce.number().describe('The count of participants of the WOD'),
    isBooked: z.boolean().describe('The flag if the WOD is booked by the user'),
  });

export type ExternalWod = z.infer<typeof externalWodSchema>;
