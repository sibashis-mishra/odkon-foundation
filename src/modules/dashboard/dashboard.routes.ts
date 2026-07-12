/**
 * src/modules/dashboard/dashboard.routes.ts
 */

import { Router } from 'express';
import { Role } from '@prisma/client';
import { authenticate } from '../../middleware/authenticate';
import { authorize } from '../../middleware/authorize';
import { kpis } from './dashboard.controller';

const router = Router();
router.use(authenticate);
router.get('/kpis', authorize(Role.STAFF), kpis);

export default router;
