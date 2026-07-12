/**
 * src/types/index.ts
 *
 * Global type augmentations and shared types.
 * Extends Express's Request interface to carry the authenticated user.
 */

import { Role } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  role: Role;
}

declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      /** Set by the `authenticate` middleware after JWT verification. */
      user?: AuthUser;
    }
  }
}

export {};
