/**
 * src/modules/auth/auth.routes.ts
 */

import { Router } from 'express';
import rateLimit from 'express-rate-limit';
import { login, refresh, logout, me } from './auth.controller';
import { authenticate } from '../../middleware/authenticate';
import { validate } from '../../middleware/validate';
import { loginSchema } from './auth.schema';

const router = Router();

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    error: { message: 'Too many requests from this IP. Please try again later.', code: 'TOO_MANY_REQUESTS' },
  },
});

router.post('/login',   authLimiter, validate({ body: loginSchema }), login);
router.post('/refresh', authLimiter, refresh);
router.post('/logout',  authLimiter, logout);
router.get('/me',       authLimiter, authenticate, me);

export default router;
