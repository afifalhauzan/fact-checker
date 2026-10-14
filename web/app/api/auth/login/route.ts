import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, setAuthCookie } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const credentials = await req.json();

    const response = await backendFetch('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      return NextResponse.json(
        { error: response.status === 422 ? 'Email atau password salah' : data.message || 'Login gagal' },
        { status: response.status }
      );
    }

    const res = NextResponse.json({ user: data.user });
    setAuthCookie(res, data.token, data.token_type);

    return res;
  } catch (error) {
    console.error('Login proxy error:', error);

    return NextResponse.json(
      { error: 'Tidak dapat terhubung ke server' },
      { status: 502 }
    );
  }
}
