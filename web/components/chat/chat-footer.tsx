"use client";

import { Composer, type ComposerProps } from "@/components/chat/composer";

export interface ComposerAttachment {
  type: "file";
  id: string;
  filename?: string;
  mediaType: string;
  url: string;
  size?: number;
}

export function ChatFooter(props: ComposerProps) {
  return (
    <footer className="sticky bottom-0 left-0 right-0 w-full bg-background px-4 pb-3 pt-2 md:relative md:shrink-0">
      <Composer {...props} />
      <p className="mt-2 text-center text-xs text-muted-foreground">
        Ini analisis risiko awal, bukan vonis final. Selalu verifikasi ke kanal resmi sebelum kirim data atau membayar biaya.
      </p>
    </footer>
  );
}
