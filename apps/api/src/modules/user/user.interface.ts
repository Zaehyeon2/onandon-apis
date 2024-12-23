import { createZodDto } from '@anatine/zod-nestjs';
import validator from 'validator';
import z from 'zod';

export enum Gender {
  M = 'M',
  F = 'F',
  U = 'U',
}

export const userSchema = z.object({
  id: z.string().describe('The naver unique ID of the user'),
  email: z.string().email().min(1).max(255).describe('The email of the user'),
  name: z.string().min(1).max(255).describe('The name of the user'),
  phoneNumber: z
    .string()
    .min(1)
    .max(255)
    .refine(validator.isMobilePhone)
    .describe('The phone number of the user'),
  gender: z.nativeEnum(Gender).describe('The gender of the user'),
  birthDate: z.coerce.number().int().describe('The timestamp of the user birth date'),
  isAdmin: z.boolean().describe('Whether the user is an admin'),
  profileImage: z.string().url().optional().describe('The URL of the user profile image'),
  createdAt: z.coerce.number().int().describe('The timestamp when the user was created'),
});

export class User extends createZodDto(userSchema) {}
