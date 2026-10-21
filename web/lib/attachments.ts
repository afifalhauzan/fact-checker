// Attachment rules shared by the composer (client) and the extraction stage (server), so both
// accept the same files. Imported with a relative path by extraction.ts because eval runs it with jiti.

export const MAX_ATTACHMENTS = 4;
export const MAX_ATTACHMENT_MB = 7;
export const MAX_ATTACHMENT_BYTES = MAX_ATTACHMENT_MB * 1024 * 1024;
export const ATTACHMENT_LIMITS_TEXT = `maksimal ${MAX_ATTACHMENTS} lampiran, ${MAX_ATTACHMENT_MB} MB per lampiran`;
export const ACCEPTED_ATTACHMENT_TYPES = "image/*,application/pdf";

/** File types the extraction step can read: images (posters, screenshots) and PDF documents. */
export function isSupportedAttachment(mediaType: string): boolean {
  return mediaType.startsWith("image/") || mediaType === "application/pdf";
}

export interface PreparedAttachment {
  id: string;
  filename?: string;
  mediaType: string;
  url: string;
  size?: number;
}

function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function createAttachmentId(): string {
  if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") {
    return crypto.randomUUID();
  }
  return `attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

// Clipboard images arrive as "image.png"; a readable name helps when several are pasted.
function displayName(file: File, index: number): string {
  if (file.name && file.name !== "image.png") return file.name;
  const extension = file.type.split("/")[1] || "png";
  return `Gambar tempelan ${index + 1}.${extension}`;
}

/**
 * Reads the files the composer accepts and explains, in Indonesian, why the rest were skipped.
 * `existingCount` is how many attachments are already in the composer.
 */
export async function prepareAttachments(
  files: File[],
  existingCount: number
): Promise<{ attachments: PreparedAttachment[]; rejections: string[] }> {
  const rejections: string[] = [];
  const supported = files.filter((file) => isSupportedAttachment(file.type));
  if (supported.length < files.length) {
    rejections.push("Hanya gambar (poster, screenshot) dan PDF yang bisa diperiksa.");
  }

  const withinSize = supported.filter((file) => file.size <= MAX_ATTACHMENT_BYTES);
  if (withinSize.length < supported.length) {
    rejections.push(`Ukuran lampiran maksimal ${MAX_ATTACHMENT_MB} MB per file.`);
  }

  const room = Math.max(0, MAX_ATTACHMENTS - existingCount);
  const accepted = withinSize.slice(0, room);
  if (accepted.length < withinSize.length) {
    rejections.push(`Maksimal ${MAX_ATTACHMENTS} lampiran per pesan.`);
  }

  const attachments = await Promise.all(
    accepted.map(async (file, index) => ({
      id: createAttachmentId(),
      filename: displayName(file, existingCount + index),
      mediaType: file.type,
      url: await fileToDataUrl(file),
      size: file.size,
    }))
  );

  return { attachments, rejections };
}

/** Files from a paste event (screenshots copied with Ctrl+C / Print Screen, or files copied in Explorer). */
export function filesFromClipboard(data: DataTransfer | null): File[] {
  if (!data) return [];
  return Array.from(data.items)
    .filter((item) => item.kind === "file")
    .map((item) => item.getAsFile())
    .filter((file): file is File => file !== null);
}
