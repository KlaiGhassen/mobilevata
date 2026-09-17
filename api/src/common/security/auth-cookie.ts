import type { Response } from 'express';

export const AUTH_COOKIE = 'access_token';
const MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000;

export function setAuthCookie(res: Response, token: string) {
  res.cookie(AUTH_COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    maxAge: MAX_AGE_MS,
    path: '/',
  });
}

export function clearAuthCookie(res: Response) {
  res.clearCookie(AUTH_COOKIE, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.COOKIE_SECURE === 'true',
    path: '/',
  });
}

export function readCookie(
  cookieHeader: string | undefined,
  name: string,
): string | null {
  if (!cookieHeader) return null;
  for (const part of cookieHeader.split(';')) {
    const [k, ...rest] = part.trim().split('=');
    if (k === name) return decodeURIComponent(rest.join('=') || '');
  }
  return null;
}
