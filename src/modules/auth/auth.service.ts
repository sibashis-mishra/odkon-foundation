/**
 * src/modules/auth/auth.service.ts
 */

import { randomUUID } from 'crypto';
import { prisma } from '../../config/db';
import { comparePassword } from '../../utils/password';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../utils/response';
import type { LoginInput } from './auth.schema';

const REFRESH_TOKEN_TTL_DAYS = 7;

type SafeUser = {
  id: string;
  name: string;
  email: string;
  role: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
};

function makeTokenPair(userId: string, email: string, role: string) {
  const tokenId = randomUUID();
  const expiresAt = new Date();
  expiresAt.setDate(expiresAt.getDate() + REFRESH_TOKEN_TTL_DAYS);
  const accessToken = signAccessToken({ sub: userId, email, role });
  const refreshToken = signRefreshToken({ sub: userId, tokenId });
  return { tokenId, accessToken, refreshToken, expiresAt };
}

export async function loginUser(
  input: LoginInput,
): Promise<{ accessToken: string; refreshToken: string; user: SafeUser }> {
  const user = await prisma.user.findUnique({ where: { email: input.email } });

  if (!user || !user.isActive) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const isValid = await comparePassword(input.password, user.passwordHash);
  if (!isValid) {
    throw new AppError('Invalid email or password', 401, 'INVALID_CREDENTIALS');
  }

  const { tokenId, accessToken, refreshToken, expiresAt } = makeTokenPair(
    user.id, user.email, user.role,
  );

  await prisma.refreshToken.create({
    data: { id: tokenId, token: refreshToken, userId: user.id, expiresAt },
  });

  const { passwordHash: _omit, ...safeUser } = user;
  return { accessToken, refreshToken, user: safeUser };
}

export async function refreshUserToken(
  incomingRefreshToken: string | undefined,
): Promise<{ accessToken: string; refreshToken: string }> {
  if (!incomingRefreshToken) {
    throw new AppError('Refresh token not provided', 401, 'UNAUTHORIZED');
  }

  let payload: ReturnType<typeof verifyRefreshToken>;
  try {
    payload = verifyRefreshToken(incomingRefreshToken);
  } catch {
    throw new AppError('Invalid or expired refresh token', 401, 'UNAUTHORIZED');
  }

  const stored = await prisma.refreshToken.findUnique({
    where: { token: incomingRefreshToken },
    include: { user: true },
  });

  if (!stored || stored.expiresAt < new Date()) {
    if (payload.sub) {
      await prisma.refreshToken.deleteMany({ where: { userId: payload.sub } });
    }
    throw new AppError('Refresh token is expired or has been revoked', 401, 'UNAUTHORIZED');
  }

  if (!stored.user.isActive) {
    throw new AppError('Account is inactive', 401, 'ACCOUNT_INACTIVE');
  }

  await prisma.refreshToken.delete({ where: { token: incomingRefreshToken } });

  const { tokenId, accessToken, refreshToken, expiresAt } = makeTokenPair(
    stored.user.id, stored.user.email, stored.user.role,
  );

  await prisma.refreshToken.create({
    data: { id: tokenId, token: refreshToken, userId: stored.user.id, expiresAt },
  });

  return { accessToken, refreshToken };
}

export async function logoutUser(refreshToken: string | undefined): Promise<void> {
  if (!refreshToken) return;
  await prisma.refreshToken.deleteMany({ where: { token: refreshToken } });
}

export async function getMe(userId: string): Promise<SafeUser> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { id: true, name: true, email: true, role: true, isActive: true, createdAt: true, updatedAt: true },
  });
  if (!user) throw new AppError('User not found', 404, 'NOT_FOUND');
  return user;
}
