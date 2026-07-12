/**
 * src/modules/auth/auth.controller.ts
 */

import { Request, Response, NextFunction } from 'express';
import { loginUser, refreshUserToken, logoutUser, getMe } from './auth.service';
import { sendSuccess } from '../../utils/response';
import { env } from '../../config/env';

const COOKIE_NAME = 'odkon_refresh';

const cookieOptions = {
  httpOnly: true,
  secure: env.NODE_ENV === 'production',
  sameSite: 'strict' as const,
  maxAge: 7 * 24 * 60 * 60 * 1000,
  path: '/api/v1/auth',
};

export async function login(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const result = await loginUser(req.body);
    res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);
    sendSuccess(res, { accessToken: result.accessToken, user: result.user }, 200);
  } catch (err) { next(err); }
}

export async function refresh(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME] as string | undefined;
    const result = await refreshUserToken(refreshToken);
    res.cookie(COOKIE_NAME, result.refreshToken, cookieOptions);
    sendSuccess(res, { accessToken: result.accessToken }, 200);
  } catch (err) { next(err); }
}

export async function logout(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const refreshToken = req.cookies?.[COOKIE_NAME] as string | undefined;
    await logoutUser(refreshToken);
    res.clearCookie(COOKIE_NAME, { path: '/api/v1/auth' });
    sendSuccess(res, { message: 'Logged out successfully' }, 200);
  } catch (err) { next(err); }
}

export async function me(req: Request, res: Response, next: NextFunction): Promise<void> {
  try {
    const user = await getMe(req.user!.id);
    sendSuccess(res, user, 200);
  } catch (err) { next(err); }
}
