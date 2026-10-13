import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  const backendUrl = process.env.BACKEND_URL || 'http://localhost:8000/api';

  try {
    const credentials = await req.json();

    const response = await fetch(`${backendUrl}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
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

    // Same cookie shape proxy.ts already checks; httpOnly keeps the token away from client JS
    res.cookies.set(
      'auth-storage',
      JSON.stringify({
        isAuthenticated: true,
        accessToken: data.token,
        tokenType: data.token_type,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 7,
        path: '/',
      }
    );

    return res;
  } catch (error) {
    console.error('Login proxy error:', error);

    return NextResponse.json(
      { error: 'Tidak dapat terhubung ke server' },
      { status: 502 }
    );
  }
}
