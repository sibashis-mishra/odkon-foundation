/**
 * src/modules/dashboard/dashboard.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import { getKPIs } from './dashboard.service';
import { sendSuccess } from '../../utils/response';

export async function kpis(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try { sendSuccess(res, await getKPIs()); }
  catch (err) { next(err); }
}
