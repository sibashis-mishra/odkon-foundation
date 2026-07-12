/**
 * src/modules/users/users.routes.ts
 */

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createUserSchema, updateUserSchema, listUsersQuerySchema, idParamSchema } from './users.schema';
import * as UserController from './users.controller';

const router = Router();
router.use(authenticate);

router.get('/',    authorize(Role.MANAGER), validate({ query: listUsersQuerySchema }), UserController.list);
router.get('/:id', authorize(Role.MANAGER), validate({ params: idParamSchema }), UserController.getOne);
router.post('/',   authorize(Role.ADMIN),   validate({ body: createUserSchema }), UserController.create);
router.patch('/:id', authorize(Role.ADMIN), validate({ params: idParamSchema, body: updateUserSchema }), UserController.update);
router.delete('/:id', authorize(Role.ADMIN), validate({ params: idParamSchema }), UserController.remove);

export default router;
