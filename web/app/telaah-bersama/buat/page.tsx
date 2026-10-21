"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, Link2, Lock, RefreshCw, RotateCcw, Sparkles, Trash2, Upload, X } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { RiskCard } from "@/components/cards/RiskCard";
import { ModusBadge, RiskLevelBadge } from "@/components/telaah-bersama/badges";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { MockAttachment } from "@/components/telaah-bersama/mock-attachment";
import { cn } from "@/utils/utils";
import {
  DRAFT_FROM_CHAT as draft,
  SOURCE_PLATFORMS,
  hasAccusatoryWord,
  hasNikLikeNumber,
  maskNik,
  type TelaahAttachment,
} from "@/lib/telaah-bersama/mock-data";
import { ACCEPTED_ATTACHMENT_TYPES, prepareAttachments } from "@/lib/attachments";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";

const MAX_TITLE_LENGTH = 120;
const MAX_STORY_LENGTH = 1500;

// Stand-in for the redaction scan: lines that look like the applicant's own data.
function looksPersonal(line: string): boolean {
  return /\[NIK disensor\]|^kepada yth/i.test(line);
}

function FieldLabel({ htmlFor, children, hint }: { htmlFor?: string; children: React.ReactNode; hint?: React.ReactNode }) {
  return (
    <div className="mb-1.5 flex flex-wrap items-baseline justify-between gap-2">
      <label htmlFor={htmlFor} className="text-sm font-semibold text-foreground">
        {children}
      </label>
      {hint && <span className="text-xs text-muted-foreground">{hint}</span>}
    </div>
  );
}

const REUPLOAD_CHECK_MS = 700;

export default function BuatPostPage() {
  const router = useRouter();
  const addPost = useTelaahBersamaStore((state) => state.addPost);
  const isGuest = useTelaahBersamaStore((state) => state.viewer === "tamu");
  const requireLogin = useTelaahBersamaStore((state) => state.requireLogin);
  const reuploadInputRef = React.useRef<HTMLInputElement>(null);
  const [reuploads, setReuploads] = React.useState<TelaahAttachment[]>([]);
  const [reuploadStatus, setReuploadStatus] = React.useState<"idle" | "checking" | "matched" | "rejected">("idle");
  const [reuploadMessage, setReuploadMessage] = React.useState("");

  const [titleIndex, setTitleIndex] = React.useState(0);
  const [title, setTitle] = React.useState(draft.titleSuggestions[0]);
  const [platform, setPlatform] = React.useState(draft.source.platform);
  const [account, setAccount] = React.useState(draft.source.account ?? "");
  const [removedLines, setRemovedLines] = React.useState<Set<number>>(new Set());
  const [attachmentIds, setAttachmentIds] = React.useState(draft.attachments.map((item) => item.id));
  const [links, setLinks] = React.useState(draft.links);
  const [story, setStory] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);

  const keptLines = draft.materialLines.filter((_, index) => !removedLines.has(index));
  const allAttachments: TelaahAttachment[] = [...draft.attachments, ...reuploads];
  const keptAttachments = allAttachments.filter((item) => attachmentIds.includes(item.id));
  const personalLinesLeft = keptLines.filter(looksPersonal).length;
  const sensitiveAttachmentsLeft = keptAttachments.filter((item) => item.sensitiveWarning).length;
  const canContinue = consent && title.trim().length > 0 && keptLines.length > 0;

  const toggleLine = (index: number) => {
    setRemovedLines((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // shortcut: the prototype accepts any valid image; the real check compares its SHA-256 with the
  // hashes in the signed payload and rejects files that were never analyzed (design doc 6.4).
  const handleReupload = async (file: File | undefined) => {
    if (!file) return;
    const { attachments: prepared, rejections } = await prepareAttachments([file], keptAttachments.length);
    if (prepared.length === 0) {
      setReuploadStatus("rejected");
      setReuploadMessage(rejections.join(" "));
      return;
    }
    setReuploadStatus("checking");
    setTimeout(() => {
      const attachment: TelaahAttachment = {
        id: prepared[0].id,
        label: prepared[0].filename ?? "Lampiran",
        variant: "poster",
        url: prepared[0].url,
      };
      setReuploads((current) => [...current, attachment]);
      setAttachmentIds((ids) => [...ids, attachment.id]);
      setReuploadStatus("matched");
      setReuploadMessage(`"${attachment.label}" cocok dengan lampiran yang ditelaah.`);
    }, REUPLOAD_CHECK_MS);
  };

  const regenerateTitle = () => {
    const nextIndex = (titleIndex + 1) % draft.titleSuggestions.length;
    setTitleIndex(nextIndex);
    setTitle(draft.titleSuggestions[nextIndex]);
  };

  const handlePublish = () => {
    const id = addPost({
      title: title.trim(),
      riskLevel: draft.riskLevel,
      claim: draft.claim,
      modus: draft.modus,
      company: draft.company,
      position: draft.position,
      location: draft.location,
      openDate: draft.openDate,
      closeDate: draft.closeDate,
      source: { platform, account: account.trim() || undefined },
      contacts: draft.contacts,
      summary: draft.summary,
      evidence: draft.evidence,
      materialLines: keptLines,
      story: story.trim() ? maskNik(story.trim()) : undefined,
      links,
      attachments: keptAttachments,
      analyzedAt: new Date().toISOString(),
    });
    router.push(`/telaah-bersama/${id}?baru=1`);
  };

  if (isGuest) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedTopNavbar />
        <PrototypeBanner />
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">Masuk untuk membuat post</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Post di TelaahBareng dibuat dari hasil telaahmu sendiri, jadi kamu perlu masuk dulu. Namamu tetap tampil
            sebagai nama samaran.
          </p>
          <Button className="mt-5" onClick={() => requireLogin("Masuk untuk membuat post di TelaahBareng.")}>
            Masuk
          </Button>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <Link
          href="/chat/prototipe"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke percakapan
        </Link>

        <h1 className="mt-4 text-2xl font-semibold text-foreground">Buat post di TelaahBareng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bagikan hasil telaahmu supaya orang lain yang menerima lowongan serupa bisa waspada.
        </p>

        <div className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Periksa data pribadi sebelum memposting</p>
            <p className="mt-1 text-amber-900/85">
              Post ini akan terlihat publik. Hapus baris atau lampiran yang memuat nama, nomor HP, alamat, atau data
              pribadimu. NIK dan kode OTP disensor otomatis, tetapi nama dan foto tidak.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-7">
          {/* Locked verdict */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <RiskLevelBadge level={draft.riskLevel} />
                <ModusBadge modus={draft.modus} />
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Dari hasil telaah, tidak bisa diubah
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{draft.claim}</p>
            <details className="group mt-3">
              <summary className="cursor-pointer text-xs font-medium text-primary">
                Lihat {draft.evidence.length} bukti yang ikut terbit
              </summary>
              <div className="mt-2 space-y-2">
                {draft.evidence.map((item, index) => (
                  <RiskCard key={index} type={item.type} description={item.description} evidence={item.evidence} />
                ))}
              </div>
            </details>
          </section>

          {/* Title */}
          <section>
            <FieldLabel
              htmlFor="title"
              hint={
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Dibuat AI dari percakapanmu, bisa diedit
                </span>
              }
            >
              Judul
            </FieldLabel>
            <div className="flex gap-2">
              <Input
                id="title"
                value={title}
                maxLength={MAX_TITLE_LENGTH}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Button type="button" variant="outline" size="icon" onClick={regenerateTitle} title="Buat ulang judul">
                <RefreshCw />
              </Button>
            </div>
            <div className="mt-1 flex justify-between gap-2 text-xs">
              <span className={hasAccusatoryWord(title) ? "text-amber-700" : "text-muted-foreground"}>
                {hasAccusatoryWord(title)
                  ? "Hindari kata yang menuduh. Gunakan informasi netral; tingkat risiko sudah tampil sebagai lencana."
                  : "Isi dengan info netral: perusahaan, posisi, lokasi, periode."}
              </span>
              <span className="shrink-0 tabular-nums text-muted-foreground">
                {title.length}/{MAX_TITLE_LENGTH}
              </span>
            </div>
          </section>

          {/* Source */}
          <section>
            <FieldLabel hint="Diisi AI dari materi, bisa diedit">Sumber lowongan</FieldLabel>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[180px_1fr]">
              <select
                aria-label="Platform"
                value={platform}
                onChange={(event) => setPlatform(event.target.value)}
                className="h-9 rounded-md border border-input bg-background px-3 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              >
                {SOURCE_PLATFORMS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Input
                aria-label="Akun atau link asal"
                value={account}
                onChange={(event) => setAccount(event.target.value)}
                placeholder="Akun, grup, atau link tempat kamu menemukan lowongan"
              />
            </div>
          </section>

          {/* Locked material */}
          <section>
            <FieldLabel
              hint={
                <span className="inline-flex items-center gap-1">
                  <Lock className="h-3 w-3" />
                  Teks tidak bisa diubah, baris bisa dihapus
                </span>
              }
            >
              Materi lowongan
            </FieldLabel>
            <ul className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-card">
              {draft.materialLines.map((line, index) => {
                const isRemoved = removedLines.has(index);
                const isPersonal = looksPersonal(line);
                return (
                  <li
                    key={index}
                    className={cn(
                      "flex items-start gap-3 px-3 py-2 text-sm",
                      isRemoved && "bg-muted/50",
                      !isRemoved && isPersonal && "bg-amber-50"
                    )}
                  >
                    <div className="min-w-0 flex-1">
                      <p className={cn("leading-relaxed", isRemoved ? "text-muted-foreground line-through" : "text-foreground")}>
                        {line}
                      </p>
                      {isPersonal && !isRemoved && (
                        <p className="mt-0.5 text-xs text-amber-800">Baris ini tampaknya memuat data pribadimu.</p>
                      )}
                    </div>
                    <button
                      type="button"
                      onClick={() => toggleLine(index)}
                      className="inline-flex shrink-0 items-center gap-1 rounded-md px-2 py-1 text-xs text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                    >
                      {isRemoved ? (
                        <>
                          <RotateCcw className="h-3.5 w-3.5" />
                          Pulihkan
                        </>
                      ) : (
                        <>
                          <Trash2 className="h-3.5 w-3.5" />
                          Hapus
                        </>
                      )}
                    </button>
                  </li>
                );
              })}
            </ul>
          </section>

          {/* Attachments */}
          <section>
            <FieldLabel hint="Otomatis dari pesan yang ditelaah, bisa dihapus">Lampiran</FieldLabel>
            {keptAttachments.length > 0 ? (
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {keptAttachments.map((attachment) => (
                  <div key={attachment.id} className="space-y-1.5">
                    <div className="relative">
                      <MockAttachment
                        label={attachment.label}
                        variant={attachment.variant}
                        url={attachment.url}
                        className={attachment.sensitiveWarning ? "ring-2 ring-amber-400" : undefined}
                      />
                      <button
                        type="button"
                        onClick={() => setAttachmentIds((ids) => ids.filter((id) => id !== attachment.id))}
                        aria-label={`Hapus ${attachment.label}`}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                    {attachment.sensitiveWarning && (
                      <p className="flex gap-1 text-xs leading-snug text-amber-800">
                        <AlertTriangle className="mt-0.5 h-3 w-3 shrink-0" />
                        {attachment.sensitiveWarning}
                      </p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">
                Tidak ada lampiran yang akan diposting.
              </p>
            )}
            <input
              ref={reuploadInputRef}
              type="file"
              accept={ACCEPTED_ATTACHMENT_TYPES}
              className="hidden"
              onChange={(event) => {
                void handleReupload(event.target.files?.[0]);
                event.currentTarget.value = "";
              }}
            />
            <button
              type="button"
              onClick={() => reuploadInputRef.current?.click()}
              disabled={reuploadStatus === "checking"}
              className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline disabled:cursor-wait disabled:opacity-60"
            >
              <Upload className="h-3.5 w-3.5" />
              Lampiran dari percakapan lama tidak muncul? Unggah ulang file yang sama.
            </button>
            {reuploadStatus !== "idle" && (
              <p
                className={cn(
                  "mt-1.5 text-xs",
                  reuploadStatus === "checking" && "text-muted-foreground",
                  reuploadStatus === "matched" && "text-emerald-700",
                  reuploadStatus === "rejected" && "text-red-700"
                )}
              >
                {reuploadStatus === "checking" ? "Mencocokkan dengan lampiran yang ditelaah…" : reuploadMessage}
                {reuploadStatus === "matched" && (
                  <span className="text-violet-700"> (Prototipe: di versi nyata, hanya file yang sama persis yang diterima.)</span>
                )}
              </p>
            )}
          </section>

          {/* Links */}
          {draft.links.length > 0 && (
            <section>
              <FieldLabel hint="Dari materi, bisa dihapus">Link</FieldLabel>
              {links.length > 0 ? (
                <ul className="space-y-1.5">
                  {links.map((link) => (
                    <li
                      key={link}
                      className="flex items-center justify-between gap-2 rounded-lg border border-border bg-card px-3 py-2 text-sm"
                    >
                      <span className="flex min-w-0 items-center gap-2">
                        <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                        <span className="truncate">{link}</span>
                      </span>
                      <button
                        type="button"
                        onClick={() => setLinks((current) => current.filter((item) => item !== link))}
                        aria-label={`Hapus ${link}`}
                        className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">Tidak ada link yang akan diposting.</p>
              )}
            </section>
          )}

          {/* Story */}
          <section>
            <FieldLabel htmlFor="story" hint="Opsional">
              Cerita kamu
            </FieldLabel>
            <Textarea
              id="story"
              value={story}
              maxLength={MAX_STORY_LENGTH}
              onChange={(event) => setStory(event.target.value)}
              placeholder="Contoh: Saya dihubungi lewat WA setelah melamar lewat link di bio. Saya belum transfer."
              className="min-h-24"
            />
            <p className={cn("mt-1 text-xs", hasNikLikeNumber(story) ? "text-red-700" : "text-muted-foreground")}>
              {hasNikLikeNumber(story)
                ? "Ceritamu tampaknya memuat NIK. NIK akan disensor otomatis saat diposting."
                : "Jangan menulis nama lengkap, NIK, alamat, atau nomor pribadimu."}
            </p>
          </section>

          {/* Consent + actions */}
          <section className="space-y-4 border-t border-border pt-5">
            <label className="flex cursor-pointer gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                Saya sudah memeriksa bahwa post ini tidak memuat data pribadi saya atau orang lain, dan saya paham post
                ini akan terlihat publik.
              </span>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" asChild>
                <Link href="/chat/prototipe">Batal</Link>
              </Button>
              <Button onClick={() => setIsConfirmOpen(true)} disabled={!canContinue}>
                Lanjut ke konfirmasi
              </Button>
            </div>
          </section>
        </div>
      </main>

      <Modal
        isOpen={isConfirmOpen}
        onClose={() => setIsConfirmOpen(false)}
        title="Posting ke TelaahBareng?"
        description="Post akan langsung terlihat publik. Kamu tetap bisa menyunting atau menghapusnya nanti."
      >
        <div className="space-y-4">
          <div className="rounded-lg border border-border bg-muted/40 p-3 text-sm">
            <p className="font-medium text-foreground">{title}</p>
            <p className="mt-1 text-xs text-muted-foreground">
              {keptLines.length} baris materi · {keptAttachments.length} lampiran · {links.length} link
              {story.trim() ? " · dengan cerita" : ""}
            </p>
          </div>

          {(personalLinesLeft > 0 || sensitiveAttachmentsLeft > 0) && (
            <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>
                Masih ada {personalLinesLeft > 0 ? `${personalLinesLeft} baris` : ""}
                {personalLinesLeft > 0 && sensitiveAttachmentsLeft > 0 ? " dan " : ""}
                {sensitiveAttachmentsLeft > 0 ? `${sensitiveAttachmentsLeft} lampiran` : ""} yang tampaknya memuat data
                pribadimu. Yakin tetap diposting?
              </p>
            </div>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)}>
              Periksa lagi
            </Button>
            <Button onClick={handlePublish}>Posting sekarang</Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
