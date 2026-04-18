import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    
    // Extract auth data from query parameters (sent by backend)
    const token = searchParams.get('token');
    const tokenType = searchParams.get('token_type') || 'bearer';
    const userDataParam = searchParams.get('user');
    const error = searchParams.get('error');
    
    // Handle OAuth error
    if (error) {
      console.error('OAuth error:', error);
      
      // Map specific OAuth errors  
      let redirectError = 'oauth_failed';
      switch (error) {
        case 'access_denied':
          redirectError = 'access_denied';
          break;
        case 'invalid_request':
        case 'invalid_client':
        case 'invalid_grant':
        case 'unauthorized_client':
        case 'unsupported_grant_type':
          redirectError = 'oauth_error';
          break;
        default:
          redirectError = 'oauth_failed';
      }
      
      return NextResponse.redirect(`/login?error=${redirectError}`);
    }
    
    // Validate required data
    if (!token || !userDataParam) {
      console.error('Missing auth data in callback');
      return NextResponse.redirect('/login?error=oauth_incomplete');
    }
    
    // Parse user data
    let user;
    try {
      user = JSON.parse(decodeURIComponent(userDataParam));
    } catch (e) {
      console.error('Failed to parse user data:', e);
      return NextResponse.redirect('/login?error=oauth_invalid');
    }
    
    // Create auth storage object for cookie
    const authData = {
      accessToken: token,
      tokenType,
      user,
      isAuthenticated: true,
    };
    
    // Set cookie for proxy middleware
    const cookieStore = await cookies();
    cookieStore.set('auth-storage', JSON.stringify(authData), {
      httpOnly: false, // Needs to be accessible by client-side
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: '/'
    });
    
    console.log('[OAUTH] Google login successful for user:', user.email);
    
    // Redirect to chat page
    const response = NextResponse.redirect('/');
    
    // Also set client-accessible cookie for immediate auth state
    response.cookies.set('auth-storage', JSON.stringify(authData), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production', 
      sameSite: 'lax',
      maxAge: 7 * 24 * 60 * 60,
      path: '/'
    });
    
    return response;

  } catch (error) {
    console.error('Google OAuth callback error:', error);
    return NextResponse.redirect('/login?error=oauth_callback_failed');
  }
}