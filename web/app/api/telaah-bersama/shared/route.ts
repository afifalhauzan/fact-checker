import { NextRequest, NextResponse } from "next/server";
import { backendFetch, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, NO_STORE } from "@/lib/telaah-bersama/proxy";
import { readSignedShare, shareKeyOf } from "@/langchain/agents/telaah-bersama/share-payload";

/**
 * The post already published from this analysis, if any. Takes the signed share in the body
 * (not the URL): only someone holding that chat can ask.
 */
export async function POST(req: NextRequest) {
  const share = await req.json().catch(() => null);
  if (!readSignedShare(share)) return errorResponse("Hasil telaah ini tidak valid.", 400);

  try {
    const response = await backendFetch(`/telaah-bersama/shared/${shareKeyOf(share.signature)}`, {
      headers: internalKeyHeader(),
      cache: "no-store",
    });
    if (response.status === 404) return NextResponse.json({ post: null }, { headers: NO_STORE });
    if (!response.ok) return errorResponse("Status post tidak bisa diperiksa.", 502);
    return NextResponse.json({ post: await response.json() }, { headers: NO_STORE });
  } catch (error) {
    return backendUnavailable(error);
  }
}
