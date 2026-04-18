import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  try {
    // Extract authorization header for the new X-API-Key or legacy Authorization schemes
    const authHeader = req.headers.get('X-API-Key') || req.headers.get('Authorization');
    
    if (!authHeader) {
      return NextResponse.json(
        { error: 'Authorization header required' },
        { status: 401 }
      );
    }

    const token = authHeader.split(' ')[1];
    const backendUrl = process.env.BACKEND_URL || 'http://api:8003/api';

    // Forward request to backend /me endpoint
    const response = await fetch(`${backendUrl}/auth/me`, {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('[ROUTE] Backend /me error response:', errorText);
      
      let errorMessage = 'Failed to get user info';
      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.detail || errorMessage;
      } catch {
        errorMessage = errorText || errorMessage;
      }
      
      return NextResponse.json(
        { error: errorMessage },
        { status: response.status }
      );
    }

    const userData = await response.json();
    console.log('[ROUTE] User info retrieved successfully:', userData?.data);
    
    return NextResponse.json(userData);

  } catch (error) {
    console.error('Get user info error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}