"use client";
/* eslint-disable @next/next/no-img-element */

import React from "react";
import { Paperclip, X, File as FileIcon } from "lucide-react";
import { formatMediaTypeLabel } from "@/utils/formatters";
import { Modal } from "@/components/ui/modal";

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
  isLoading: boolean;
  attachments: ComposerAttachment[];
  onSelectFiles: (files: FileList | null) => void;
  onRemoveAttachment: (id: string) => void;
}

function formatFileSize(size?: number): string {
  if (!size || Number.isNaN(size)) return "";
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export function ChatFooter({
  input,
  setInput,
  onSubmit,
  isLoading,
  attachments,
  onSelectFiles,
  onRemoveAttachment,
}: ChatFooterProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [previewImage, setPreviewImage] = React.useState<ComposerAttachment | null>(null);

  return (
    <footer className="sticky bottom-0 left-0 right-0 w-full md:relative md:shrink-0 p-4 pt-0 bg-background border-t border-border md:border-t-0">
      <div className="pt-3">
        {attachments.length > 0 && (
          <div className="mb-2 flex flex-wrap gap-2">
            {attachments.map((attachment) => {
              const isImage = attachment.mediaType.startsWith("image/");

              return (
                <div
                  key={attachment.id}
                  className="group relative rounded-lg border border-border bg-muted/60 p-1.5"
                >
                  <button
                    type="button"
                    onClick={() => {
                      if (isImage) {
                        setPreviewImage(attachment);
                      }
                    }}
                    className={`block text-left ${isImage ? "cursor-zoom-in" : "cursor-default"}`}
                  >
                    {isImage ? (
                      <img
                        src={attachment.url}
                        alt={attachment.filename || "image attachment"}
                        className="h-16 w-16 rounded-md object-cover"
                      />
                    ) : (
                      <div className="flex min-h-16 min-w-40 items-center gap-2 rounded-md px-2 py-1.5">
                        <FileIcon className="h-4 w-4 text-muted-foreground" />
                        <div className="overflow-hidden">
                          <p className="truncate text-xs font-medium text-foreground">
                            {attachment.filename || "file"}
                          </p>
                          <p className="truncate text-[11px] text-muted-foreground">
                            {formatMediaTypeLabel(attachment.mediaType)}
                          </p>
                          <p className="text-[11px] text-muted-foreground">
                            {formatFileSize(attachment.size)}
                          </p>
                        </div>
                      </div>
                    )}
                  </button>

                  <button
                    type="button"
                    onClick={() => onRemoveAttachment(attachment.id)}
                    className="absolute -right-1.5 -top-1.5 flex h-5 w-5 items-center justify-center rounded-full border border-border bg-background text-muted-foreground hover:text-foreground"
                    title="Hapus lampiran"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              );
            })}
          </div>
        )}

        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-xl border-2 border-input bg-muted p-1.5 pl-2 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/100 transition-all"
        >
          <input
            ref={fileInputRef}
            type="file"
            className="hidden"
            multiple
            onChange={(event) => {
              onSelectFiles(event.target.files);
              event.currentTarget.value = "";
            }}
          />

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={isLoading}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground hover:bg-accent hover:text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
            title="Tambah gambar atau file"
          >
            <Paperclip className="h-4 w-4" />
          </button>

          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder= {isLoading ? "Sedang berpikir..." : "Tanya tentang info apapun..."}
            autoComplete="off"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={isLoading || (!input.trim() && attachments.length === 0)}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI bisa membantu memahami, tapi bukan selalu benar. Gunakan ini sebagai titik awal, lalu verifikasi sendiri ya.
        </p>
      </div>

      <Modal
        isOpen={!!previewImage}
        onClose={() => setPreviewImage(null)}
        title={previewImage?.filename || "Image preview"}
        showCloseButton={true}
      >
        {previewImage ? (
          <div className="flex items-center justify-center">
            <img
              src={previewImage.url}
              alt={previewImage.filename || "preview"}
              className="max-h-[75vh] w-auto max-w-full rounded-lg object-contain"
            />
          </div>
        ) : null}
      </Modal>
    </footer>
  );
}
