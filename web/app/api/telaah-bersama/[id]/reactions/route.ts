import { NextRequest } from "next/server";
import { backendFetch, getAccessToken, internalKeyHeader } from "@/lib/server-auth";
import { backendUnavailable, errorResponse, relay, signInRequired } from "@/lib/telaah-bersama/proxy";

/** Toggles "Saya juga menerima ini". */
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const token = getAccessToken(req);
  if (!token) return signInRequired();
  const { id } = await params;
  if (!/^\d+$/.test(id)) return errorResponse("Telaah tidak ditemukan.", 404);

  try {
    return relay(await backendFetch(`/telaah-bersama/${id}/reactions`, { method: "POST", token, headers: internalKeyHeader() }));
  } catch (error) {
    return backendUnavailable(error);
  }
}
