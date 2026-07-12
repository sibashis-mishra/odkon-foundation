/**
 * src/modules/projects/projects.schema.ts
 */

import { z } from 'zod';
import { ProjectStatus } from '@prisma/client';

// Base object — no refinements, allows .partial() for update schema
const projectBaseSchema = z.object({
  name:        z.string({ required_error: 'Project name is required' }).min(1).max(200).trim(),
  description: z.string().max(2000).trim().optional(),
  status:      z.nativeEnum(ProjectStatus).default(ProjectStatus.PLANNING),
  startDate:   z.string({ required_error: 'Start date is required' }).datetime({ message: 'startDate must be ISO 8601' }),
  endDate:     z.string().datetime({ message: 'endDate must be ISO 8601' }).optional(),
  budget:      z.number().positive('Budget must be positive').max(999_999_999_99).optional(),
  clientId:    z.string({ required_error: 'clientId is required' }).min(1),
});

export const createProjectSchema = projectBaseSchema.refine(
  (data) => {
    if (data.endDate && data.startDate) return new Date(data.endDate) >= new Date(data.startDate);
    return true;
  },
  { message: 'endDate must be after or equal to startDate', path: ['endDate'] },
);

export const updateProjectSchema = projectBaseSchema
  .partial()
  .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listProjectsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(ProjectStatus).optional(),
  clientId: z.string().optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'Project ID is required'),
});

export const assignmentParamsSchema = z.object({
  id:     z.string().min(1, 'Project ID is required'),
  userId: z.string().min(1, 'User ID is required'),
});

export const assignUserSchema = z.object({
  userId:        z.string({ required_error: 'userId is required' }).min(1),
  roleOnProject: z.string({ required_error: 'roleOnProject is required' }).min(1).max(100),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
export type UpdateProjectInput = z.infer<typeof updateProjectSchema>;
export type AssignUserInput    = z.infer<typeof assignUserSchema>;
