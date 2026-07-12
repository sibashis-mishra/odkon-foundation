/**
 * src/modules/projects/projects.routes.ts
 */

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import {
  createProjectSchema, updateProjectSchema, listProjectsQuerySchema,
  idParamSchema, assignUserSchema, assignmentParamsSchema,
} from './projects.schema';
import * as ProjectController from './projects.controller';

const router = Router();
router.use(authenticate);

router.get('/',    authorize(Role.STAFF),   validate({ query: listProjectsQuerySchema }), ProjectController.list);
router.get('/:id', authorize(Role.STAFF),   validate({ params: idParamSchema }), ProjectController.getOne);
router.post('/',   authorize(Role.MANAGER), validate({ body: createProjectSchema }), ProjectController.create);
router.patch('/:id',  authorize(Role.MANAGER), validate({ params: idParamSchema, body: updateProjectSchema }), ProjectController.update);
router.delete('/:id', authorize(Role.ADMIN),   validate({ params: idParamSchema }), ProjectController.remove);

router.post('/:id/assignments',             authorize(Role.MANAGER), validate({ params: idParamSchema, body: assignUserSchema }), ProjectController.assign);
router.delete('/:id/assignments/:userId',   authorize(Role.MANAGER), validate({ params: assignmentParamsSchema }), ProjectController.unassign);

export default router;
