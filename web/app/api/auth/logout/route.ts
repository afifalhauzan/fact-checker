import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  try {
    // Extract authorization header
    const authHeader = req.headers.get('Authorization');
    
    // Optional: Call backend logout endpoint if it exists
    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.split(' ')[1];
      const backendUrl = process.env.BACKEND_URL || 'http://api:8003/api';

      try {
        await fetch(`${backendUrl}/auth/logout`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
            'Content-Type': 'application/json',
          },
        });
      } catch (error) {
        // Ignore backend logout errors - still clear frontend session
        console.warn('Backend logout failed:', error);
      }
    }

    // Create response to clear auth cookies
    const response = NextResponse.json({ message: 'Logged out successfully' });
    
    // Clear auth cookie
    response.cookies.set('auth-storage', '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 0,
      path: '/'
    });

    console.log('[ROUTE] User logged out successfully');
    
    return response;

  } catch (error) {
    console.error('Logout error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}