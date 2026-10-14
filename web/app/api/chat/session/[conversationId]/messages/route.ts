import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, getAccessToken } from '@/lib/server-auth';

type RouteContext = { params: Promise<{ conversationId: string }> };

const NO_CACHE = { 'Cache-Control': 'no-cache' };

export async function GET(req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;
  const token = getAccessToken(req);

  // Guests can chat, but nothing is stored for them
  if (!token) {
    return NextResponse.json({ data: [] }, { headers: NO_CACHE });
  }

  try {
    const response = await backendFetch(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      { token, cache: 'no-store' }
    );

    if (!response.ok) {
      return NextResponse.json({ data: [] }, { headers: NO_CACHE });
    }

    return NextResponse.json(await response.json(), { headers: NO_CACHE });
  } catch (error) {
    console.error('[ROUTE] Failed to load chat history:', error);

    return NextResponse.json({ data: [] }, { headers: NO_CACHE });
  }
}

export async function POST(req: NextRequest, { params }: RouteContext) {
  const { conversationId } = await params;
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ saved: false }, { status: 401 });
  }

  try {
    const response = await backendFetch(
      `/conversations/${encodeURIComponent(conversationId)}/messages`,
      { method: 'POST', token, body: JSON.stringify(await req.json()) }
    );

    return NextResponse.json({ saved: response.ok }, { status: response.status });
  } catch (error) {
    console.error('[ROUTE] Failed to save chat messages:', error);

    return NextResponse.json({ saved: false }, { status: 502 });
  }
}
