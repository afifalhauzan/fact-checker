"use client";

import { Chat } from "@/components/chat";
import React from "react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { StreamingProvider } from "@/contexts/StreamingContext";
import { generateUUID } from "@/utils/browser-uuid";
import { ImagePlus } from "lucide-react";

export const dynamic = "force-dynamic";

function isFileDrag(event: React.DragEvent): boolean {
  return Array.from(event.dataTransfer?.types ?? []).includes("Files");
}

export default function ChatPage() {
  const [chatId] = React.useState(() => generateUUID());
  const [isDraggingPhoto, setIsDraggingPhoto] = React.useState(false);
  const dragDepthRef = React.useRef(0);

  const handleDragEnter = React.useCallback((event: React.DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current += 1;
    setIsDraggingPhoto(true);
  }, []);

  const handleDragOver = React.useCallback((event: React.DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
  }, []);

  const handleDragLeave = React.useCallback((event: React.DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current = Math.max(0, dragDepthRef.current - 1);
    if (dragDepthRef.current === 0) {
      setIsDraggingPhoto(false);
    }
  }, []);

  const handleDrop = React.useCallback((event: React.DragEvent) => {
    if (!isFileDrag(event)) return;
    event.preventDefault();
    dragDepthRef.current = 0;
    setIsDraggingPhoto(false);

    // Dropzone ini sengaja dibatasi ke 1 foto — kalau lebih dari satu di-drop, sisanya diabaikan.
    const droppedPhoto = Array.from(event.dataTransfer.files).find((file) => file.type.startsWith("image/"));
    if (droppedPhoto) {
      window.dispatchEvent(new CustomEvent<File>("telaahkarier:dropped-photo", { detail: droppedPhoto }));
    }
  }, []);

  return (
    <StreamingProvider chatId={chatId}>
      <div
        className="flex min-h-screen flex-col bg-background"
        onDragEnter={handleDragEnter}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        <ProtectedTopNavbar />

        <main className="relative flex min-h-0 flex-1">
          <div className="flex min-w-0 flex-1 flex-col items-center justify-center max-h-[calc(100vh-4rem)]">
            <Chat />
          </div>

          {isDraggingPhoto && (
            <div className="pointer-events-none absolute inset-0 z-50 flex items-center justify-center bg-background/40 backdrop-blur-sm animate-in fade-in duration-150">
              <div className="flex w-[min(92%,640px)] flex-col items-center gap-3 rounded-2xl border-2 border-dashed border-primary bg-card px-8 py-14 text-center shadow-lg">
                <ImagePlus className="h-14 w-14 text-primary" />
                <p className="text-lg font-semibold text-foreground">Lepas untuk unggah poster lowongan</p>
                <p className="text-sm text-muted-foreground">Hanya mendukung 1 foto per pesan.</p>
              </div>
            </div>
          )}
        </main>
      </div>
    </StreamingProvider>
  );
}
