"use client";

import type { ReportType, TelaahComment, TelaahPost } from "./types";
import type { TelaahSharePartData } from "@/types/streaming";

// Browser-side calls to app/api/telaah-bersama. Errors carry a message that can be shown as-is.

export class TelaahApiError extends Error {
  constructor(message: string, readonly status: number) {
    super(message);
  }
}

const FRIENDLY_ERRORS: Record<number, string> = {
  401: "Masuk dulu untuk melakukan ini.",
  404: "Telaah tidak ditemukan atau sudah dihapus.",
  429: "Terlalu banyak percobaan. Coba lagi nanti.",
};

async function request<T>(url: string, init?: RequestInit): Promise<T> {
  const response = await fetch(url, { cache: "no-store", ...init });
  const body = await response.json().catch(() => null);
  if (!response.ok) {
    // Laravel's own messages are English and technical outside validation errors
    const message =
      FRIENDLY_ERRORS[response.status] ??
      ([400, 409, 422].includes(response.status) ? body?.message : null) ??
      "Terjadi kesalahan. Coba lagi sebentar lagi.";
    throw new TelaahApiError(message, response.status);
  }
  return body as T;
}

const json = (method: string, data?: unknown): RequestInit => ({
  method,
  headers: { "Content-Type": "application/json" },
  body: data === undefined ? undefined : JSON.stringify(data),
});

export interface ListParams {
  sort?: "ramai" | "terbaru";
  risk?: string | null;
  modus?: string | null;
  q?: string;
  year?: string;
  from?: string;
  to?: string;
  mine?: boolean;
  limit?: number;
  page?: number;
}

export function listPosts(params: ListParams): Promise<{ data: TelaahPost[]; hasMore: boolean }> {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "" || value === false) continue;
    search.set(key, value === true ? "1" : String(value));
  }
  return request(`/api/telaah-bersama?${search.toString()}`);
}

export const getPost = (id: number | string) => request<TelaahPost>(`/api/telaah-bersama/${id}`);

export const toggleReaction = (id: number) =>
  request<{ reacted: boolean; reactionCount: number }>(`/api/telaah-bersama/${id}/reactions`, json("POST"));

export const addComment = (id: number, body: string, parentId?: number) =>
  request<TelaahComment>(`/api/telaah-bersama/${id}/comments`, json("POST", { body, parentId }));

export const reportPost = (id: number, type: ReportType) =>
  request<{ reported: boolean }>(`/api/telaah-bersama/${id}/reports`, json("POST", { type }));

export interface PostEdit {
  title: string;
  story: string;
  materialLines: string[];
  links: string[];
  attachmentIds: number[];
}

export const updatePost = (id: number, edit: PostEdit) => request<TelaahPost>(`/api/telaah-bersama/${id}`, json("PATCH", edit));

export const deletePost = (id: number) => request<{ message: string }>(`/api/telaah-bersama/${id}`, json("DELETE"));

export interface DraftAttributes {
  title: string;
  modus: TelaahPost["modus"];
  company: string | null;
  position: string | null;
  location: string | null;
  salary: string | null;
  openDate: string | null;
  closeDate: string | null;
  sourcePlatform: string | null;
  sourceAccount: string | null;
}

export const draftPost = (share: TelaahSharePartData) =>
  request<{ attributes: DraftAttributes; attributesSignature: string }>("/api/telaah-bersama/draft", json("POST", share));

/** The post already published from this analysis, or null. */
export const findSharedPost = (share: TelaahSharePartData) =>
  request<{ post: { id: number } | null }>("/api/telaah-bersama/shared", json("POST", share)).then((result) => result.post);

export function publishPost(form: FormData): Promise<TelaahPost> {
  return request<TelaahPost>("/api/telaah-bersama", { method: "POST", body: form });
}
