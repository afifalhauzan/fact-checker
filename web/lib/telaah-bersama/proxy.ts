import { NextResponse } from "next/server";

// Server-only helpers for the app/api/telaah-bersama route handlers.

export const NO_STORE = { "Cache-Control": "no-store" };

/** Passes Laravel's JSON response (and its status) through to the browser. */
export async function relay(response: Response): Promise<NextResponse> {
  const body = await response.text();
  return new NextResponse(body || null, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("Content-Type") ?? "application/json", ...NO_STORE },
  });
}

export function errorResponse(message: string, status: number): NextResponse {
  return NextResponse.json({ message }, { status, headers: NO_STORE });
}

export const signInRequired = () => errorResponse("Masuk dulu untuk melakukan ini.", 401);

export function backendUnavailable(error: unknown): NextResponse {
  console.error("[TelaahBareng] Backend request failed:", error instanceof Error ? error.message : error);
  return errorResponse("Layanan TelaahBareng sedang tidak bisa dihubungi. Coba lagi sebentar lagi.", 502);
}
