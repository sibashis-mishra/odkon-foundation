/**
 * src/modules/clients/clients.routes.ts
 */

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { validate } from '../../middleware/validate';
import { createClientSchema, updateClientSchema, listClientsQuerySchema, idParamSchema } from './clients.schema';
import * as ClientController from './clients.controller';

const router = Router();
router.use(authenticate);

router.get('/',    authorize(Role.STAFF),   validate({ query: listClientsQuerySchema }), ClientController.list);
router.get('/:id', authorize(Role.STAFF),   validate({ params: idParamSchema }), ClientController.getOne);
router.post('/',   authorize(Role.MANAGER), validate({ body: createClientSchema }), ClientController.create);
router.patch('/:id', authorize(Role.MANAGER), validate({ params: idParamSchema, body: updateClientSchema }), ClientController.update);
router.delete('/:id', authorize(Role.ADMIN), validate({ params: idParamSchema }), ClientController.remove);

export default router;
