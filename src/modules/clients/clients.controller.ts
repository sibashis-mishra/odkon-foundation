/**
 * src/modules/clients/clients.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as ClientService from './clients.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const { clients, meta } = await ClientService.listClients(req); sendSuccess(res, clients, 200, meta); }
  catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ClientService.getClientById(req.params.id)); }
  catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ClientService.createClient(req.body), 201); }
  catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ClientService.updateClient(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ClientService.deleteClient(req.params.id);
    sendSuccess(res, { message: 'Client deleted successfully' });
  } catch (err) { next(err); }
}
