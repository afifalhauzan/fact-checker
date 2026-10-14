import { NextRequest, NextResponse } from 'next/server';

// Server-only helpers shared by the app/api route handlers that talk to the Laravel API.

const AUTH_COOKIE = 'auth-storage';

export const BACKEND_URL = process.env.BACKEND_URL || 'http://localhost:8000/api';

export function getAccessToken(req: NextRequest): string | null {
  try {
    const cookie = req.cookies.get(AUTH_COOKIE)?.value;
    return cookie ? JSON.parse(cookie).accessToken ?? null : null;
  } catch {
    return null;
  }
}

export function backendFetch(path: string, init: RequestInit & { token?: string | null } = {}) {
  const { token, headers, ...rest } = init;

  return fetch(`${BACKEND_URL}${path}`, {
    ...rest,
    headers: {
      Accept: 'application/json',
      ...(rest.body ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

// Same cookie shape proxy.ts checks; httpOnly keeps the token away from client JS
export function setAuthCookie(res: NextResponse, token: string, tokenType = 'Bearer') {
  res.cookies.set(
    AUTH_COOKIE,
    JSON.stringify({ isAuthenticated: true, accessToken: token, tokenType }),
    {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 60 * 60 * 24 * 7,
      path: '/',
    }
  );
}

export function clearAuthCookie(res: NextResponse) {
  res.cookies.set(AUTH_COOKIE, '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });
}
