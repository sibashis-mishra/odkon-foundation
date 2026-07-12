/**
 * src/utils/pagination.ts
 *
 * Sort format: ?sort=field:asc or ?sort=field:desc
 */

import { Request } from 'express';
import { PaginationMeta } from './response';

export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
  sort?: { field: string; order: 'asc' | 'desc' };
}

export function parsePagination(req: Request): PaginationParams {
  const page = Math.max(1, parseInt(req.query.page as string, 10) || 1);
  const limit = Math.min(100, Math.max(1, parseInt(req.query.limit as string, 10) || 20));
  const skip = (page - 1) * limit;

  let sort: PaginationParams['sort'];
  const sortParam = req.query.sort as string | undefined;
  if (sortParam) {
    const parts = sortParam.split(':');
    const field = parts[0];
    const order = parts[1];
    if (field && (order === 'asc' || order === 'desc')) {
      sort = { field, order };
    }
  }

  return { page, limit, skip, sort };
}

export function buildPaginationMeta(
  total: number,
  page: number,
  limit: number,
): PaginationMeta {
  return {
    page,
    limit,
    total,
    totalPages: Math.ceil(total / limit),
  };
}
