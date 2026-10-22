import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, getAccessToken } from '@/lib/server-auth';

type RouteContext = { params: Promise<{ conversationId: string; messageId: string }> };

/** Rates one assistant answer ("baik" / "buruk", or null to withdraw), for evaluating TelaahKarier. */
export async function PUT(req: NextRequest, { params }: RouteContext) {
  const { conversationId, messageId } = await params;
  const token = getAccessToken(req);

  if (!token) {
    return NextResponse.json({ saved: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const rating = body?.rating === 'baik' || body?.rating === 'buruk' ? body.rating : null;
  const reason = typeof body?.reason === 'string' ? body.reason.trim().slice(0, 500) || null : null;

  try {
    const response = await backendFetch(
      `/conversations/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/feedback`,
      { method: 'PUT', token, body: JSON.stringify({ rating, reason }) }
    );

    return NextResponse.json({ saved: response.ok }, { status: response.status });
  } catch (error) {
    console.error('[ROUTE] Failed to save message feedback:', error);
    return NextResponse.json({ saved: false }, { status: 502 });
  }
}
