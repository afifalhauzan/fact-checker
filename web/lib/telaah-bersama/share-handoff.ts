"use client";

import type { TelaahSharePartData } from "@/types/streaming";

// Carries a signed analysis from the chat's "Buat post?" button to /telaah-bersama/buat.
// The signed payload is small and survives a reload in sessionStorage; the analyzed images can be
// megabytes, so they stay in memory and are re-uploaded after a reload (design doc 6.5).

const STORAGE_KEY = "telaah-share-draft-v1";

export interface ShareFile {
  filename?: string;
  mediaType: string;
  url: string;
}

let pendingFiles: ShareFile[] = [];

export function startShareDraft(share: TelaahSharePartData, files: ShareFile[]): void {
  pendingFiles = files;
  try {
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(share));
  } catch {
    // Storage can be unavailable (private mode); the page then asks to start from the chat again.
  }
}

export function readShareDraft(): { share: TelaahSharePartData; files: ShareFile[] } | null {
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    const share = raw ? (JSON.parse(raw) as TelaahSharePartData) : null;
    return share?.payload && share.signature ? { share, files: pendingFiles } : null;
  } catch {
    return null;
  }
}

export function clearShareDraft(): void {
  pendingFiles = [];
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Nothing to clear
  }
}

export async function sha256Hex(bytes: ArrayBuffer): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export async function dataUrlToFile(file: ShareFile): Promise<File> {
  const blob = await (await fetch(file.url)).blob();
  return new File([blob], file.filename ?? "lampiran", { type: file.mediaType });
}
