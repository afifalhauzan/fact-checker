import { NextRequest, NextResponse } from "next/server";
import { getAccessToken } from "@/lib/server-auth";
import { errorResponse, NO_STORE, signInRequired } from "@/lib/telaah-bersama/proxy";
import { draftPostAttributes, signAttributes } from "@/langchain/agents/telaah-bersama/draft";
import { readSignedShare } from "@/langchain/agents/telaah-bersama/share-payload";

/** Title and attributes for the "Buat post" form, signed so they come back unchanged on publish. */
export async function POST(req: NextRequest) {
  if (!getAccessToken(req)) return signInRequired();

  const share = await req.json().catch(() => null);
  const payload = readSignedShare(share);
  if (!payload) return errorResponse("Hasil telaah ini tidak bisa dipakai untuk membuat post.", 400);

  const attributes = await draftPostAttributes(payload);
  return NextResponse.json(
    { attributes, attributesSignature: signAttributes(share.signature, attributes) },
    { headers: NO_STORE }
  );
}
