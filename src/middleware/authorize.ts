/**
 * src/middleware/authorize.ts
 *
 * Role hierarchy: ADMIN (3) > MANAGER (2) > STAFF (1)
 * authorize(Role.MANAGER) → allows MANAGER and ADMIN
 * authorizeExact(Role.ADMIN) → allows ONLY ADMIN
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { sendError } from '../utils/response';

const ROLE_HIERARCHY: Record<Role, number> = {
  [Role.ADMIN]: 3,
  [Role.MANAGER]: 2,
  [Role.STAFF]: 1,
};

export function authorize(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    const userLevel = ROLE_HIERARCHY[req.user.role];
    const requiredLevel = Math.min(...roles.map((r) => ROLE_HIERARCHY[r]));

    if (userLevel < requiredLevel) {
      sendError(res, 'Insufficient permissions', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}

export function authorizeExact(...roles: Role[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      sendError(res, 'Authentication required', 401, 'UNAUTHORIZED');
      return;
    }

    if (!roles.includes(req.user.role)) {
      sendError(res, 'Insufficient permissions', 403, 'FORBIDDEN');
      return;
    }

    next();
  };
}
