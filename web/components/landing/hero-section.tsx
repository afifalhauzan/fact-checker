"use client";

import React from "react";
import Link from "next/link";
import { AlertTriangle, CheckCircle2, History } from "lucide-react";
import { useRouter } from "next/navigation";
import { TypingIndicator } from "@/components/chat/TypingIndicator";
import { Composer } from "@/components/chat/composer";
import { saveLandingChatDraft, type LandingAttachmentDraft } from "@/lib/landing-chat-handoff";
import { prepareAttachments } from "@/lib/attachments";
import { useChatSessions } from "@/hooks/use-chat-sessions";
import { formatRelativeTime } from "@/utils/formatters";

const MAX_RECENT_SESSIONS = 3;

/** Signed-in visitors can pick up their latest telaah right from the homepage. */
function RecentSessions() {
  const { sessions, isGuest, isLoading } = useChatSessions();
  if (isLoading || isGuest || sessions.length === 0) return null;

  return (
    <div className="mt-5 text-left">
      <p className="mb-2 flex items-center gap-1.5 px-1 text-xs font-medium text-[#5a6a76]">
        <History className="size-3.5" />
        Lanjutkan telaah terakhir
      </p>
      <ul className="grid gap-2 sm:grid-cols-3">
        {sessions.slice(0, MAX_RECENT_SESSIONS).map((session) => (
          <li key={session.id}>
            <Link
              href={`/chat?conversation_id=${encodeURIComponent(session.id)}`}
              className="block rounded-lg border border-[#17232c]/10 bg-white px-3 py-2.5 shadow-sm transition-colors hover:border-[#2b6f95]/40 hover:bg-[#2b6f95]/5"
            >
              <span className="block truncate text-sm font-medium text-[#17232c]">{session.title || "Telaah tanpa judul"}</span>
              <span className="text-xs text-[#5a6a76]">{formatRelativeTime(session.updated_at)}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}

export function HeroSection() {
  const router = useRouter();
  const [input, setInput] = React.useState("");
  const [attachments, setAttachments] = React.useState<LandingAttachmentDraft[]>([]);
  const [isPreparingAttachments, setIsPreparingAttachments] = React.useState(false);
  const [attachmentNotice, setAttachmentNotice] = React.useState<string | null>(null);

  const handleSelectFiles = React.useCallback(
    async (files: File[]) => {
      if (files.length === 0) {
        return;
      }

      setIsPreparingAttachments(true);
      try {
        const { attachments: prepared, rejections } = await prepareAttachments(files, attachments.length);
        setAttachmentNotice(rejections.length ? rejections.join(" ") : null);
        setAttachments((prev) => [...prev, ...prepared]);
      } catch (error) {
        console.error("[HeroSection] Failed to prepare attachments:", error);
        setAttachmentNotice("Gagal membaca lampiran. Coba lagi ya.");
      } finally {
        setIsPreparingAttachments(false);
      }
    },
    [attachments.length]
  );

  const handleSubmit = React.useCallback(
    () => {
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

  return (
    <section className="mx-auto mb-20 w-full max-w-[1440px] px-4 text-center sm:mb-28 sm:px-8">
      <div className="mx-auto mb-5 flex w-fit items-center gap-2 rounded-full bg-slate-100 px-3 py-1.5 text-xs font-medium text-[#5a6a76] motion-safe:animate-[fadeUp_600ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Analisis risiko lowongan kerja digital
      </div>

      <h1 className="mx-auto max-w-5xl font-regular text-4xl leading-[0.9] tracking-normal text-[#17232c] md:text-[4rem] motion-safe:animate-[fadeUp_760ms_cubic-bezier(0.22,1,0.36,1)_both]">
        Cek Risiko Lowongan Kerja
        <span className="block italic font-medium text-[#2b6f95]">sebelum anda daftar.</span>
      </h1>

      <div className="mx-auto mt-6 max-w-3xl sm:mt-7 motion-safe:animate-[fadeUp_880ms_cubic-bezier(0.22,1,0.36,1)_both]">
        <p className="mx-auto mb-6 max-w-2xl text-base leading-relaxed text-[#5a6a76] sm:text-md">
          Unggah poster, screenshot, teks, atau link lowongan kerja. Sistem akan membantu membedah red flag,
          validitas perusahaan, risiko link/kontak, dan langkah aman sebelum kamu kirim data atau melakukan pembayaran.
        </p>

        <Composer
          input={input}
          setInput={setInput}
          onSubmit={handleSubmit}
          isLoading={isPreparingAttachments}
          attachments={attachments}
          onSelectFiles={(files) => void handleSelectFiles(files)}
          onRemoveAttachment={(id) => setAttachments((prev) => prev.filter((item) => item.id !== id))}
          autoFocus={false}
          className="shadow-[0_18px_45px_rgba(23,35,44,0.08)]"
        />

        {attachmentNotice && (
          <p role="alert" className="mt-2 text-xs text-[#a34d3c]">
            {attachmentNotice}
          </p>
        )}

        <RecentSessions />
      </div>

    </section>
  );
}
