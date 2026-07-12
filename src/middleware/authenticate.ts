/**
 * src/middleware/authenticate.ts
 */

import { Request, Response, NextFunction } from 'express';
import { Role } from '@prisma/client';
import { verifyAccessToken } from '../utils/jwt';
import { sendError } from '../utils/response';

export function authenticate(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    sendError(res, 'Access token required', 401, 'UNAUTHORIZED');
    return;
  }

  const token = authHeader.slice(7);

  try {
    const payload = verifyAccessToken(token);
    req.user = {
      id: payload.sub,
      email: payload.email,
      role: payload.role as Role,
    };
    next();
  } catch {
    sendError(res, 'Invalid or expired access token', 401, 'UNAUTHORIZED');
  }
}
