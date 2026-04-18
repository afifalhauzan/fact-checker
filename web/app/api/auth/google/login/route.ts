import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    const backendUrl = process.env.BACKEND_URL || 'http://api:8003/api';
    
    // Get the origin for the callback URL
    const origin = req.nextUrl.origin;
    const callbackUrl = `${origin}/api/auth/google/callback`;
    
    // Redirect to backend Google OAuth with our callback URL
    const googleAuthUrl = `${backendUrl}/auth/google/login?callback_url=${encodeURIComponent(callbackUrl)}`;
    
    return NextResponse.redirect(googleAuthUrl);

  } catch (error) {
    console.error('Google login error:', error);
    return NextResponse.redirect('/login?error=oauth_error');
  }
}