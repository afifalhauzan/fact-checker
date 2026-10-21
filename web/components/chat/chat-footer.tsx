"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { ArrowUp, FileText, Plus, Square, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { cn } from "@/utils/utils";
import { ACCEPTED_ATTACHMENT_TYPES, MAX_ATTACHMENTS, filesFromClipboard } from "@/lib/attachments";

export interface ComposerAttachment {
  type: "file";
  id: string;
  filename?: string;
  mediaType: string;
  url: string;
  size?: number;
}

interface ChatFooterProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event?: { preventDefault?: () => void }) => void;
  // True while a reply is on its way or the session is starting; sending is blocked, typing is not.
  isLoading: boolean;
  attachments: ComposerAttachment[];
  onSelectFiles: (files: File[]) => void;
  onRemoveAttachment: (id: string) => void;
  onStop?: () => void;
}

const MAX_TEXTAREA_HEIGHT = 240;

function formatFileSize(size?: number): string {
  if (!size || Number.isNaN(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

function AttachmentPreview({
  attachment,
  onOpen,
  onRemove,
}: {
  attachment: ComposerAttachment;
  onOpen: () => void;
  onRemove: () => void;
}) {
  const isImage = attachment.mediaType.startsWith("image/");
  const name = attachment.filename || (isImage ? "Gambar" : "Dokumen");

  return (
    <div className="group relative">
      {isImage ? (
        <button
          type="button"
          onClick={onOpen}
          className="block h-16 w-16 cursor-zoom-in overflow-hidden rounded-lg border border-border bg-muted"
          aria-label={`Lihat ${name}`}
        >
          <img src={attachment.url} alt={name} className="h-full w-full object-cover" />
        </button>
      ) : (
        <div className="flex h-16 w-48 items-center gap-2.5 rounded-lg border border-border bg-muted/60 px-3">
          <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-red-50 text-red-600">
            <FileText className="h-4 w-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-xs font-medium text-foreground">{name}</p>
            <p className="text-[11px] text-muted-foreground">PDF · {formatFileSize(attachment.size)}</p>
          </div>
        </div>
      )}
      <button
        type="button"
        onClick={onRemove}
        aria-label={`Hapus ${name}`}
        title="Hapus lampiran"
        className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground shadow-sm transition-opacity hover:text-foreground sm:opacity-0 sm:group-hover:opacity-100 sm:focus-visible:opacity-100"
      >
        <X className="h-3 w-3" />
      </button>
    </div>
  );
}

export function ChatFooter({
  input,
  setInput,
  onSubmit,
  isLoading,
  attachments,
  onSelectFiles,
  onRemoveAttachment,
  onStop,
}: ChatFooterProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const textareaRef = React.useRef<HTMLTextAreaElement>(null);
  const [previewImage, setPreviewImage] = React.useState<ComposerAttachment | null>(null);

  const hasContent = input.trim().length > 0 || attachments.length > 0;
  const canSend = hasContent && !isLoading;
  const isFull = attachments.length >= MAX_ATTACHMENTS;

  // Grow with the text, like the Claude composer, up to a cap after which the box scrolls.
  React.useLayoutEffect(() => {
    const element = textareaRef.current;
    if (!element) return;
    element.style.height = "auto";
    element.style.height = `${Math.min(element.scrollHeight, MAX_TEXTAREA_HEIGHT)}px`;
  }, [input]);

  // Desktop keeps the cursor in the box; on touch screens this would pop the keyboard open.
  React.useEffect(() => {
    if (window.matchMedia("(pointer: fine)").matches) {
      textareaRef.current?.focus();
    }
  }, []);

  const submit = () => {
    if (!canSend) return;
    onSubmit();
    textareaRef.current?.focus();
  };

  const handleKeyDown = (event: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (event.key === "Enter" && !event.shiftKey && !event.nativeEvent.isComposing) {
      event.preventDefault();
      submit();
    }
  };

  const handlePaste = (event: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const files = filesFromClipboard(event.clipboardData);
    if (files.length === 0) return;
    // Pasting a screenshot attaches it instead of inserting its file name as text.
    event.preventDefault();
    onSelectFiles(files);
  };

  return (
    <footer className="sticky bottom-0 left-0 right-0 w-full bg-background px-4 pb-3 pt-2 md:relative md:shrink-0">
      <form
        onSubmit={(event) => {
          event.preventDefault();
          submit();
        }}
        onClick={(event) => {
          // Clicking the empty part of the box focuses the text, as in Claude.
          if (event.target === event.currentTarget) textareaRef.current?.focus();
        }}
        className="rounded-2xl border border-border bg-card shadow-[0_2px_12px_rgba(23,35,44,0.06)] transition-colors focus-within:border-primary/50 focus-within:shadow-[0_2px_16px_rgba(23,35,44,0.09)]"
      >
        {attachments.length > 0 && (
          <div className="flex flex-wrap gap-2.5 px-3 pt-3">
            {attachments.map((attachment) => (
              <AttachmentPreview
                key={attachment.id}
                attachment={attachment}
                onOpen={() => setPreviewImage(attachment)}
                onRemove={() => onRemoveAttachment(attachment.id)}
              />
            ))}
          </div>
        )}

        <textarea
          ref={textareaRef}
          rows={1}
          value={input}
          onChange={(event) => setInput(event.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          placeholder="Tempel teks lowongan, link, atau screenshot di sini..."
          aria-label="Pesan"
          className="block max-h-60 w-full resize-none bg-transparent px-4 pb-1 pt-3.5 text-base leading-relaxed text-foreground outline-none placeholder:text-muted-foreground md:text-sm"
        />

        <div className="flex items-center justify-between gap-2 px-2.5 pb-2.5 pt-1">
          <div className="flex min-w-0 items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept={ACCEPTED_ATTACHMENT_TYPES}
              multiple
              className="hidden"
              onChange={(event) => {
                onSelectFiles(Array.from(event.target.files ?? []));
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={isFull}
              title={isFull ? `Maksimal ${MAX_ATTACHMENTS} lampiran per pesan` : "Lampirkan gambar atau PDF"}
              aria-label="Lampirkan gambar atau PDF"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg border border-border text-muted-foreground transition-colors hover:bg-accent hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
            >
              <Plus className="h-4 w-4" />
            </button>
            {!hasContent && (
              <span className="hidden truncate text-xs text-muted-foreground sm:inline">
                Tempel gambar dengan Ctrl+V · Shift+Enter untuk baris baru
              </span>
            )}
          </div>

          {isLoading && onStop ? (
            <button
              type="button"
              onClick={onStop}
              title="Hentikan jawaban"
              aria-label="Hentikan jawaban"
              className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-foreground text-background transition-transform hover:scale-105 active:scale-95"
            >
              <Square className="h-3.5 w-3.5 fill-current" />
            </button>
          ) : (
            <button
              type="submit"
              disabled={!canSend}
              title="Kirim (Enter)"
              aria-label="Kirim"
              className={cn(
                "flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-all",
                canSend
                  ? "bg-primary text-primary-foreground hover:bg-primary/90 active:scale-95"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
              )}
            >
              <ArrowUp className="h-4 w-4" />
            </button>
          )}
        </div>
      </form>

      <p className="mt-2 text-center text-xs text-muted-foreground">
        Ini analisis risiko awal, bukan vonis final. Selalu verifikasi ke kanal resmi sebelum kirim data atau membayar biaya.
      </p>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.filename || "Pratinjau gambar"}
        showCloseButton={true}
      >
        {previewImage ? (
          <div className="flex items-center justify-center">
            <img
              src={previewImage.url}
              alt={previewImage.filename || "pratinjau"}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </footer>
  );
}
