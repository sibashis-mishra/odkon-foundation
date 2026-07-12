/**
 * src/middleware/errorHandler.ts
 *
 * Global Express error handler. Handles AppError, Prisma errors, and unknowns.
 */

import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import { AppError } from '../utils/response';
import { env } from '../config/env';

export function errorHandler(
  err: Error,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: { message: err.message, code: err.code },
    });
    return;
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    switch (err.code) {
      case 'P2002':
        res.status(409).json({
          error: { message: 'A record with this value already exists', code: 'CONFLICT', fields: err.meta?.target },
        });
        return;
      case 'P2025':
        res.status(404).json({
          error: { message: 'Record not found', code: 'NOT_FOUND' },
        });
        return;
      case 'P2003':
        res.status(400).json({
          error: { message: 'Referenced record does not exist', code: 'FOREIGN_KEY_VIOLATION' },
        });
        return;
      default:
        console.error('[Prisma Error]', err.code, err.message);
    }
  }

  if (err instanceof Prisma.PrismaClientValidationError) {
    res.status(400).json({
      error: { message: 'Invalid data provided', code: 'VALIDATION_ERROR' },
    });
    return;
  }

  console.error('[Unhandled Error]', err);

  res.status(500).json({
    error: {
      message:
        env.NODE_ENV === 'production'
          ? 'An unexpected error occurred. Please try again later.'
          : err.message,
      code: 'INTERNAL_SERVER_ERROR',
    },
  });
}
