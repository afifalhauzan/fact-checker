import { NextRequest, NextResponse } from 'next/server';

interface BackendHealthResponse {
  message: string;
  status: string;
  docs: string;
}

export async function GET() {
  try {
    // Get backend URL from environment
    const backendUrl = process.env.BACKEND_URL || 'http://api:8003/api';
    const healthUrl = backendUrl.replace('/api', '');

    const response = await fetch(healthUrl, {
      method: 'GET',
      headers: {
        'accept': 'application/json',
      },
      // Add timeout to prevent hanging requests
      signal: AbortSignal.timeout(5000), // 5 second timeout
    });

    if (response.ok) {
      const data: BackendHealthResponse = await response.json();
      return NextResponse.json({
        isOnline: true,
        status: data.status,
        message: data.message,
        error: null,
      });
    } else {
      return NextResponse.json({
        isOnline: false,
        status: 'Offline',
        message: null,
        error: `HTTP ${response.status}`,
      });
    }
  } catch (err) {
    return NextResponse.json({
      isOnline: false,
      status: 'Offline',
      message: null,
      error: err instanceof Error ? err.message : 'Connection failed',
    });
  }
}