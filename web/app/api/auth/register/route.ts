import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, clientIpHeader, internalKeyHeader, setAuthCookie } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  try {
    const { name, email, password, passwordConfirmation } = await req.json();

    const response = await backendFetch('/auth/register', {
      method: 'POST',
      // Laravel limits sign-ups per visitor, so it needs the visitor's IP (believed with the key only)
      headers: { ...internalKeyHeader(), ...clientIpHeader(req) },
      body: JSON.stringify({
        name,
        email,
        password,
        password_confirmation: passwordConfirmation,
      }),
    });

    const data = await response.json().catch(() => ({}));

    if (!response.ok) {
      const error =
        response.status === 429
          ? 'Terlalu banyak pendaftaran akun dari jaringan ini. Coba lagi nanti.'
          : response.status === 422 && data.errors?.email
          ? 'Email sudah terdaftar atau tidak valid'
          : response.status === 422
            ? 'Data pendaftaran tidak valid. Periksa lagi isian kamu.'
            : data.message || 'Pendaftaran gagal';

      return NextResponse.json({ error }, { status: response.status });
    }

    const res = NextResponse.json({ user: data.user }, { status: 201 });
    setAuthCookie(res, data.token, data.token_type);

    return res;
  } catch (error) {
    console.error('Register proxy error:', error);

    return NextResponse.json(
      { error: 'Tidak dapat terhubung ke server' },
      { status: 502 }
    );
  }
}
