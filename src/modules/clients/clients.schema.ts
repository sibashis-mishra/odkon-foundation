/**
 * src/modules/clients/clients.schema.ts
 */

import { z } from 'zod';
import { ClientStatus } from '@prisma/client';

export const createClientSchema = z.object({
  companyName:  z.string({ required_error: 'Company name is required' }).min(1).max(200).trim(),
  contactName:  z.string({ required_error: 'Contact name is required' }).min(1).max(100).trim(),
  contactEmail: z.string({ required_error: 'Contact email is required' }).email().toLowerCase().trim(),
  contactPhone: z.string().max(20).trim().optional(),
  notes:        z.string().max(2000).trim().optional(),
  status:       z.nativeEnum(ClientStatus).default(ClientStatus.LEAD),
});

export const updateClientSchema = createClientSchema
  .partial()
  .refine((data: Record<string, unknown>) => Object.keys(data).length > 0, {
    message: 'At least one field must be provided for update',
  });

export const listClientsQuerySchema = z.object({
  page: z.string().optional(),
  limit: z.string().optional(),
  sort: z.string().optional(),
  search: z.string().optional(),
  status: z.nativeEnum(ClientStatus).optional(),
});

export const idParamSchema = z.object({
  id: z.string().min(1, 'ID is required'),
});

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;
