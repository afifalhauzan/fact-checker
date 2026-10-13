import { NextRequest, NextResponse } from 'next/server';

function getAccessToken(req: NextRequest): string | null {
  const authHeader = req.headers.get('Authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.split(' ')[1];
  }

  try {
    const cookie = req.cookies.get('auth-storage')?.value;
    return cookie ? JSON.parse(cookie).accessToken ?? null : null;
  } catch {
    return null;
  }
}

export async function POST(req: NextRequest) {
  const token = getAccessToken(req);

  if (token) {
    const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000/api';

    try {
      await fetch(`${backendUrl}/auth/logout`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: 'application/json',
        },
      });
    } catch (error) {
      // Ignore backend logout errors - still clear frontend session
      console.warn('Backend logout failed:', error);
    }
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });

  response.cookies.set('auth-storage', '', {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 0,
    path: '/',
  });

  return response;
}
