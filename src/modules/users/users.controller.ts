/**
 * src/modules/users/users.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as UserService from './users.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const { users, meta } = await UserService.listUsers(req); sendSuccess(res, users, 200, meta); }
  catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await UserService.getUserById(req.params.id)); }
  catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await UserService.createUser(req.body), 201); }
  catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await UserService.updateUser(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await UserService.deleteUser(req.params.id, req.user!.id);
    sendSuccess(res, { message: 'User deleted successfully' });
  } catch (err) { next(err); }
}
