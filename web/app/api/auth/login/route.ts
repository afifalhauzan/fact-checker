import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // Use 8000 for internal Docker communication!
  const backendUrl = process.env.BACKEND_URL || 'http://api:8000/api'; 
  const fullTargetUrl = `${backendUrl}/auth/login`;

  try {
    const credentials = await req.json();
    
    // 1. LOG TO SERVER CONSOLE (See this in 'docker logs')
    console.log(`>>> PROXYING: Fetching from ${fullTargetUrl}`);

    const response = await fetch(fullTargetUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    // 2. LOG RESPONSE STATUS TO SERVER
    console.log(`<<< BACKEND STATUS: ${response.status} for ${fullTargetUrl}`);

    const data = await response.json();
    
    if (!response.ok) {
      return NextResponse.json(
        { 
          error: data.detail || 'Login failed',
          debug: { url: fullTargetUrl, status: response.status } 
        },
        { status: response.status }
      );
    }

    return NextResponse.json(data);

  } catch (error) {
    // 3. LOG ERROR TO SERVER
    console.error('CRITICAL PROXY ERROR:', error);

    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Internal server error',
        debug: { 
          url: fullTargetUrl, 
          hint: "Is the 'api' container running and listening on port 8000?" 
        } 
      },
      { status: 500 }
    );
  }
}