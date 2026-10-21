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
      // A FormData body sets its own multipart boundary
      ...(typeof rest.body === 'string' ? { 'Content-Type': 'application/json' } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
  });
}

/**
 * Header that lets Laravel accept TelaahBareng writes from this server only. Local development
 * uses the same fixed key as api/config/services.php, so no setup is needed.
 */
export function internalKeyHeader(): Record<string, string> {
  const key = process.env.TELAAH_INTERNAL_KEY || (process.env.NODE_ENV !== 'production' ? 'dev-telaah-internal-key' : '');
  if (!key) throw new Error('TELAAH_INTERNAL_KEY is not set');
  return { 'X-Internal-Key': key };
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
