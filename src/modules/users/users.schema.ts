/**
 * src/modules/users/users.schema.ts
 */

import { z } from 'zod';
import { Role } from '@prisma/client';

export const createUserSchema = z.object({
  name: z.string({ required_error: 'Name is required' }).min(1).max(100).trim(),
  email: z.string({ required_error: 'Email is required' }).email().toLowerCase().trim(),
  password: z.string({ required_error: 'Password is required' }).min(8).max(128),
  role: z.nativeEnum(Role).default(Role.STAFF),
});

export const updateUserSchema = z
  .object({
    name: z.string().min(1).max(100).trim().optional(),
    email: z.string().email().toLowerCase().trim().optional(),
    role: z.nativeEnum(Role).optional(),
    isActive: z.boolean().optional(),
  })
  .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listUsersQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  role: z.nativeEnum(Role).optional(),
  isActive: z.enum(['true', 'false']).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type CreateUserInput = z.infer<typeof createUserSchema>;
export type UpdateUserInput = z.infer<typeof updateUserSchema>;
