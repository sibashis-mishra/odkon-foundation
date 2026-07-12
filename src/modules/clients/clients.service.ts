/**
 * src/modules/clients/clients.service.ts
 */

import { Request } from 'express';
import { ClientStatus, Prisma } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/response';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateClientInput, UpdateClientInput } from './clients.schema';

export async function listClients(req: Request) {
  const { page, limit, skip, sort } = parsePagination(req);
  const search = req.query.search as string | undefined;
  const status = req.query.status as ClientStatus | undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search ? {
      OR: [
        { companyName:  { contains: search, mode: 'insensitive' as const } },
        { contactName:  { contains: search, mode: 'insensitive' as const } },
        { contactEmail: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const orderBy = sort ? { [sort.field]: sort.order } : { createdAt: 'desc' as const };
  const [clients, total] = await Promise.all([
    prisma.client.findMany({ where, skip, take: limit, orderBy }),
    prisma.client.count({ where }),
  ]);
  return { clients, meta: buildPaginationMeta(total, page, limit) };
}

export async function getClientById(id: string) {
  const client = await prisma.client.findUnique({
    where: { id },
    include: {
      projects: {
        select: { id: true, name: true, status: true, startDate: true, endDate: true },
        orderBy: { createdAt: 'desc' },
      },
    },
  });
  if (!client) throw new AppError('Client not found', 404, 'NOT_FOUND');
  return client;
}

export async function createClient(input: CreateClientInput) {
  const client = await prisma.client.create({ data: input });
  prisma.activityLog
    .create({ data: { type: 'CLIENT_ADDED', relatedId: client.id, relatedType: 'Client' } })
    .catch((e) => console.error('[ActivityLog] CLIENT_ADDED:', e));
  return client;
}

export async function updateClient(id: string, input: UpdateClientInput) {
  await getClientById(id);
  const client = await prisma.client.update({ where: { id }, data: input as Prisma.ClientUpdateInput });
  prisma.activityLog
    .create({ data: { type: 'CLIENT_UPDATED', relatedId: id, relatedType: 'Client' } })
    .catch((e) => console.error('[ActivityLog] CLIENT_UPDATED:', e));
  return client;
}

export async function deleteClient(id: string) {
  await getClientById(id);
  const projectCount = await prisma.project.count({ where: { clientId: id } });
  if (projectCount > 0) {
    throw new AppError(
      `Cannot delete client with ${projectCount} associated project(s). Reassign or delete the projects first.`,
      400, 'HAS_DEPENDENCIES',
    );
  }
  await prisma.client.delete({ where: { id } });
}
