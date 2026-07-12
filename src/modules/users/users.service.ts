/**
 * src/modules/users/users.service.ts
 */

import { Request } from 'express';
import { Role } from '@prisma/client';
import { prisma } from '../../config/db';
import { AppError } from '../../utils/response';
import { hashPassword } from '../../utils/password';
import { parsePagination, buildPaginationMeta } from '../../utils/pagination';
import type { CreateUserInput, UpdateUserInput } from './users.schema';

const SAFE_SELECT = {
  id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true,
} as const;

export async function listUsers(req: Request) {
  const { page, limit, skip, sort } = parsePagination(req);
  const search = req.query.search as string | undefined;
  const role = req.query.role as Role | undefined;
  const isActiveRaw = req.query.isActive as string | undefined;

  const where = {
    ...(role ? { role } : {}),
    ...(isActiveRaw !== undefined ? { isActive: isActiveRaw === 'true' } : {}),
    ...(search ? {
      OR: [
        { name:  { contains: search, mode: 'insensitive' as const } },
        { email: { contains: search, mode: 'insensitive' as const } },
      ],
    } : {}),
  };

  const orderBy = sort ? { [sort.field]: sort.order } : { createdAt: 'desc' as const };
  const [users, total] = await Promise.all([
    prisma.user.findMany({ where, skip, take: limit, orderBy, select: SAFE_SELECT }),
    prisma.user.count({ where }),
  ]);
  return { users, meta: buildPaginationMeta(total, page, limit) };
}

export async function getUserById(id: string) {
  const user = await prisma.user.findUnique({ where: { id }, select: SAFE_SELECT });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
}

export async function createUser(input: CreateUserInput) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } });
  if (existing) throw new AppError('A user with this email already exists', 409, 'CONFLICT');

  const passwordHash = await hashPassword(input.password);
  const user = await prisma.user.create({
    data: { name: input.name, email: input.email, passwordHash, role: input.role },
    select: SAFE_SELECT,
  });

  prisma.activityLog
    .create({ data: { type: 'USER_ADDED', relatedId: user.id, relatedType: 'User' } })
    .catch((e) => console.error('[ActivityLog] USER_ADDED:', e));

  return user;
}

export async function updateUser(id: string, input: UpdateUserInput) {
  await getUserById(id);
  if (input.email) {
    const existing = await prisma.user.findUnique({ where: { email: input.email } });
    if (existing && existing.id !== id) {
      throw new AppError('Email already in use by another user', 409, 'CONFLICT');
    }
  }

  const user = await prisma.user.update({ where: { id }, data: input, select: SAFE_SELECT });

  prisma.activityLog
    .create({ data: { type: 'USER_UPDATED', relatedId: id, relatedType: 'User' } })
    .catch((e) => console.error('[ActivityLog] USER_UPDATED:', e));

  return user;
}

export async function deleteUser(id: string, requestingUserId: string) {
  if (id === requestingUserId) throw new AppError('You cannot delete your own account', 400, 'BAD_REQUEST');
  await getUserById(id);
  await prisma.user.delete({ where: { id } });
}
