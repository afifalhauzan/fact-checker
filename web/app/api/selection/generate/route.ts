import { NextRequest, NextResponse } from 'next/server';

interface GenerateRequestBody {
  database_id: number;
  table_name: string;
  metrics: string[];
  dimensions: string[];
  chart_type: string;
  time_granularity?: string;
  custom_title?: string;
}

function getBackendAuthHeaders(req: NextRequest): Record<string, string> | null {
  const apiKey =
    req.cookies.get('X-API-Key')?.value ||
    req.headers.get('X-API-Key') ||
    req.headers.get('x-api-key');
  const authHeader = req.headers.get('Authorization') || req.headers.get('authorization');

  if (!apiKey && !authHeader) {
    return null;
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };

  if (apiKey && apiKey.trim().length > 0) {
    headers['X-API-Key'] = apiKey;
  }

  if (authHeader && authHeader.trim().length > 0) {
    headers['Authorization'] = authHeader;
  }

  return headers;
}

export async function POST(req: NextRequest) {
  try {
    const headers = getBackendAuthHeaders(req);

    if (!headers) {
      return NextResponse.json(
        { error: 'Authorization required (X-API-Key or Authorization)' },
        { status: 401 }
      );
    }

    const backendUrl = process.env.BACKEND_URL || 'http://api:8000/api';
    const body = (await req.json()) as GenerateRequestBody;

    if (!body.database_id || !body.table_name || !Array.isArray(body.metrics) || !body.chart_type) {
      return NextResponse.json(
        {
          error:
            'Invalid payload. Required: database_id, table_name, metrics, chart_type.',
        },
        { status: 400 }
      );
    }

    const response = await fetch(`${backendUrl}/selection/generate`, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const text = await response.text();
    let payload: any = {};
    if (text) {
      try {
        payload = JSON.parse(text);
      } catch {
        payload = { error: text };
      }
    }

    if (!response.ok) {
      return NextResponse.json(
        { error: payload?.detail || payload?.error || 'Failed to generate dashboard' },
        { status: response.status }
      );
    }

    return NextResponse.json(payload, {
      status: 200,
      headers: { 'Cache-Control': 'no-store' },
    });
  } catch (error) {
    return NextResponse.json(
      {
        error: 'Internal server error',
        details: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
}
