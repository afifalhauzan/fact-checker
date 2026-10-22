import { NextRequest, NextResponse } from 'next/server';
import { backendFetch, getAccessToken } from '@/lib/server-auth';
import { MAX_ATTACHMENT_BYTES } from '@/lib/attachments';

type RouteContext = { params: Promise<{ conversationId: string }> };

const NO_CACHE = { 'Cache-Control': 'no-cache' };

// What Laravel stores (ChatAttachment::MIMES); anything else is kept only as a text note
const STORABLE_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/heic', 'image/heif', 'application/pdf']);
const DATA_URL = /^data:([^;,]+);base64,([A-Za-z0-9+/=]*)$/;

/**
 * Turns the attachments the browser sent inline into file uploads: each file part's data URL
 * becomes "upload:N" next to the file itself, so its bytes never sit in a message row.
 */
function withUploads(body: any): string | FormData {
  const form = new FormData();
  let count = 0;

  for (const message of Array.isArray(body?.messages) ? body.messages : []) {
    for (const part of Array.isArray(message?.meta_data?.parts) ? message.meta_data.parts : []) {
      const match = part?.type === 'file' && typeof part.url === 'string' ? part.url.match(DATA_URL) : null;
      // Base64 takes 4 characters for every 3 bytes
      if (!match || !STORABLE_TYPES.has(match[1]) || match[2].length > Math.ceil((MAX_ATTACHMENT_BYTES * 4) / 3) + 4) continue;

      form.append(`files[${count}]`, new Blob([Buffer.from(match[2], 'base64')], { type: match[1] }), part.filename || 'lampiran');
      part.url = `upload:${count}`;
      count += 1;
    }
  }

  if (!count) return JSON.stringify(body);
  form.append('payload', JSON.stringify(body));
  return form;
}

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
      { method: 'POST', token, body: withUploads(await req.json()) }
    );

    return NextResponse.json({ saved: response.ok }, { status: response.status });
  } catch (error) {
    console.error('[ROUTE] Failed to save chat messages:', error);

    return NextResponse.json({ saved: false }, { status: 502 });
  }
}
