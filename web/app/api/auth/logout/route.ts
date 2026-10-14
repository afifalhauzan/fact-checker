import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, clearAuthCookie, getAccessToken } from '@/lib/server-auth';

export async function POST(req: NextRequest) {
  const token = getAccessToken(req);

  if (token) {
    try {
      await backendFetch('/auth/logout', { method: 'POST', token });
    } catch (error) {
      // Ignore backend logout errors - still clear frontend session
      console.warn('Backend logout failed:', error);
    }
  }

  const response = NextResponse.json({ message: 'Logged out successfully' });
  clearAuthCookie(response);

  return response;
}
