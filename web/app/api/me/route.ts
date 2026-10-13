import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, clearAuthCookie, getAccessToken } from '@/lib/server-auth';

export async function GET(req: NextRequest) {
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ user: null }, { status: 401 });
  }

  try {
    const response = await backendFetch('/auth/me', { token, cache: 'no-store' });

    if (response.status === 401) {
      // Token was revoked or expired on the backend, so drop the stale session
      const res = NextResponse.json({ user: null }, { status: 401 });
      clearAuthCookie(res);
      return res;
    }

    if (!response.ok) {
      return NextResponse.json({ error: 'Gagal memuat data pengguna' }, { status: response.status });
    }

    const data = await response.json();

    return NextResponse.json({ user: data.user });
  } catch (error) {
    console.error('Get user info error:', error);

    return NextResponse.json({ error: 'Tidak dapat terhubung ke server' }, { status: 502 });
  }
}
