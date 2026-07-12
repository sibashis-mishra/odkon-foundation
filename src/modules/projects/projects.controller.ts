/**
 * src/modules/projects/projects.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import * as ProjectService from './projects.service';
import { sendSuccess } from '../../utils/response';

export async function list(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { const { projects, meta } = await ProjectService.listProjects(req); sendSuccess(res, projects, 200, meta); }
  catch (err) { next(err); }
}

export async function getOne(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ProjectService.getProjectById(req.params.id)); }
  catch (err) { next(err); }
}

export async function create(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ProjectService.createProject(req.body, req.user!.id), 201); }
  catch (err) { next(err); }
}

export async function update(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ProjectService.updateProject(req.params.id, req.body)); }
  catch (err) { next(err); }
}

export async function remove(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ProjectService.deleteProject(req.params.id);
    sendSuccess(res, { message: 'Project deleted successfully' });
  } catch (err) { next(err); }
}

export async function assign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try { sendSuccess(res, await ProjectService.assignUser(req.params.id, req.body), 201); }
  catch (err) { next(err); }
}

export async function unassign(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    await ProjectService.unassignUser(req.params.id, req.params.userId);
    sendSuccess(res, { message: 'User successfully removed from project' });
  } catch (err) { next(err); }
}
