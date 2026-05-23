"use client";

import React from "react";
import { Paperclip, Search, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { saveLandingChatDraft, type LandingAttachmentDraft } from "@/lib/landing-chat-handoff";

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

  return `landing-attachment-${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

export function HeroSection() {
  const router = useRouter();
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<LandingAttachmentDraft[]>([]);
  const [isPreparingAttachments, setIsPreparingAttachments] = React.useState(false);

  const handleSelectFiles = React.useCallback(async (files: FileList | null) => {
    if (!files || files.length === 0) {
      return;
    }

    setIsPreparingAttachments(true);
    try {
      const selected = Array.from(files);
      const prepared = await Promise.all(
        selected.map(async (file): Promise<LandingAttachmentDraft> => ({
          id: createAttachmentId(),
          filename: file.name,
          mediaType: file.type || "application/octet-stream",
          url: await fileToDataUrl(file),
          size: file.size,
        }))
      );

      setAttachments((prev) => [...prev, ...prepared]);
    } catch (error) {
      console.error("[HeroSection] Failed to prepare attachments:", error);
    } finally {
      setIsPreparingAttachments(false);
    }
  }, []);

  const handleSubmit = React.useCallback(
    (event?: React.FormEvent) => {
      event?.preventDefault();

      const text = input.trim();
      const hasText = text.length > 0;
      const hasAttachments = attachments.length > 0;

      if (!hasText && !hasAttachments) return;

      saveLandingChatDraft({
        text,
        attachments,
      });

      router.push("/chat");
    },
    [attachments, input, router]
  );

  const canSubmit = !isPreparingAttachments && (input.trim().length > 0 || attachments.length > 0);

  return (
    <section className="mx-auto mb-24 w-full max-w-[1440px] px-4 pt-10 text-center sm:mb-32 sm:px-8">
      <h1 className="font-['Newsreader',serif] text-[3rem] leading-[0.96] tracking-tight text-[#2c3437] sm:text-[4.75rem] md:text-[6.25rem] motion-safe:animate-[fadeUp_700ms_cubic-bezier(0.34,1.2,0.64,1)_both]">
        Pahami kebenaran,
        <span className="mt-1 block italic text-[#4e45e4] sm:mt-2">secara interaktif.</span>
      </h1>

      <div className="mx-auto mt-8 max-w-3xl sm:mt-10 motion-safe:animate-[fadeUp_900ms_cubic-bezier(0.34,1.2,0.64,1)_both]">
        <p className="mb-7 text-base text-[#596064] sm:text-lg">Punya informasi yang bikin ragu atau bingung?</p>

        {attachments.length > 0 && (
          <div className="mb-3 flex flex-wrap justify-center gap-2">
            {attachments.map((attachment) => (
              <div
                key={attachment.id}
                className="inline-flex max-w-[220px] items-center gap-2 rounded-full border border-[#dce4e8] bg-white px-3 py-1.5 text-xs text-[#596064] shadow-sm"
              >
                <span className="truncate">{attachment.filename || "file"}</span>
                <button
                  type="button"
                  onClick={() => setAttachments((prev) => prev.filter((item) => item.id !== attachment.id))}
                  className="rounded-full p-0.5 text-[#7b8286] transition-colors hover:bg-[#eef2f5] hover:text-[#2c3437]"
                  aria-label="Hapus file"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
          </div>
        )}

        <form
          onSubmit={handleSubmit}
          className="rounded-full bg-white p-1.5 shadow-[0_20px_40px_rgba(44,52,55,0.08)] ring-1 ring-[#dce4e8] transition-all focus-within:ring-2 focus-within:ring-[#4e45e4]/30 sm:p-2"
        >
          <div className="flex items-center gap-1 sm:gap-2">
            <Search className="ml-4 size-4 text-[#747c80] sm:ml-6" strokeWidth={2} />
            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              placeholder="Tempel artikel, klaim, atau opini..."
              className="w-full bg-transparent px-2 py-3 text-sm text-[#2c3437] placeholder:text-[#acb3b7] focus:outline-none sm:px-4 sm:py-4 sm:text-base"
            />

            <input
              ref={fileInputRef}
              type="file"
              multiple
              className="hidden"
              onChange={(event) => {
                void handleSelectFiles(event.target.files);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="mr-1 inline-flex h-9 w-9 items-center justify-center rounded-full text-[#596064] transition-colors hover:bg-[#eef2f5] hover:text-[#2c3437] sm:mr-0"
              title="Lampirkan file"
              aria-label="Lampirkan file"
            >
              <Paperclip className="h-4 w-4" />
            </button>

            <button
              type="submit"
              disabled={!canSubmit}
              className="rounded-full bg-[#4e45e4] px-5 py-2.5 text-sm font-medium text-[#fbf7ff] shadow-[0_10px_25px_rgba(78,69,228,0.25)] transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-60 sm:px-8 sm:py-3.5"
            >
              Analisis
            </button>
          </div>
        </form>
      </div>
    </section>
  );
}
