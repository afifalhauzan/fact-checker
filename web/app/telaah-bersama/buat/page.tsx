"use client";

import React from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { AlertTriangle, ArrowLeft, ImageIcon, Link2, Lock, RefreshCw, RotateCcw, Sparkles, Trash2, Upload, X } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Modal } from "@/components/ui/modal";
import { RiskCard } from "@/components/cards/RiskCard";
import { ModusBadge, RiskLevelBadge } from "@/components/telaah-bersama/badges";
import { cn } from "@/utils/utils";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { draftPost, publishPost, type DraftAttributes } from "@/lib/telaah-bersama/api";
import {
  clearShareDraft,
  dataUrlToFile,
  readShareDraft,
  sha256Hex,
  type ShareFile,
} from "@/lib/telaah-bersama/share-handoff";
import { SOURCE_PLATFORMS, hasAccusatoryWord } from "@/lib/telaah-bersama/types";
import { hasSensitiveData, looksLikePersonalData } from "@/langchain/agents/analyzer/redaction";
import type { SharePayload } from "@/langchain/agents/telaah-bersama/share-payload";
import type { TelaahSharePartData } from "@/types/streaming";

const MAX_TITLE_LENGTH = 120;
const MAX_STORY_LENGTH = 1500;

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

/** One analyzed image: the file once we have it (from the chat or re-uploaded), and whether it is kept. */
interface AttachmentSlot {
  sha256: string;
  label: string;
  file: File | null;
  previewUrl: string | null;
  kept: boolean;
}

function PageShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      {children}
    </div>
  );
}

export default function BuatPostPage() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [draft, setDraft] = React.useState<{ share: TelaahSharePartData; files: ShareFile[] } | null | undefined>(undefined);

  React.useEffect(() => {
    setDraft(readShareDraft());
  }, []);

  if (draft === undefined || isUserLoading) {
    return (
      <PageShell>
        <p className="py-16 text-center text-sm text-muted-foreground">Memuat…</p>
      </PageShell>
    );
  }

  if (!user) {
    return (
      <PageShell>
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">Masuk untuk membuat post</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Post di TelaahBareng dibuat dari hasil telaahmu sendiri, jadi kamu perlu masuk dulu. Namamu tetap tampil sebagai
            nama samaran.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/login?from=%2Ftelaah-bersama%2Fbuat">Masuk</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  let payload: SharePayload | null = null;
  try {
    payload = draft ? (JSON.parse(draft.share.payload) as SharePayload) : null;
  } catch {
    payload = null;
  }

  if (!draft || !payload) {
    return (
      <PageShell>
        <main className="mx-auto max-w-md px-4 py-16 text-center">
          <h1 className="text-xl font-semibold text-foreground">Mulai dari hasil telaah</h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            Post dibuat dari hasil telaah berisiko Sedang atau Tinggi. Buka percakapanmu di TelaahLoker, lalu tekan tombol
            Buat post? di bawah hasilnya.
          </p>
          <Button className="mt-5" asChild>
            <Link href="/chat">Buka TelaahLoker</Link>
          </Button>
        </main>
      </PageShell>
    );
  }

  return <PostForm share={draft.share} payload={payload} files={draft.files} />;
}

function PostForm({ share, payload, files }: { share: TelaahSharePartData; payload: SharePayload; files: ShareFile[] }) {
  const router = useRouter();
  const reuploadInputRef = React.useRef<HTMLInputElement>(null);

  const [attributes, setAttributes] = React.useState<DraftAttributes | null>(null);
  const [attributesSignature, setAttributesSignature] = React.useState("");
  const [isDrafting, setIsDrafting] = React.useState(true);
  const [title, setTitle] = React.useState("");
  const [platform, setPlatform] = React.useState("");
  const [account, setAccount] = React.useState("");
  const [removedLines, setRemovedLines] = React.useState<Set<number>>(new Set());
  const [slots, setSlots] = React.useState<AttachmentSlot[]>(() =>
    payload.attachments.map((item) => ({ sha256: item.sha256, label: item.label, file: null, previewUrl: null, kept: true }))
  );
  const [reuploadMessage, setReuploadMessage] = React.useState<{ text: string; ok: boolean } | null>(null);
  const [links, setLinks] = React.useState(payload.links);
  const [story, setStory] = React.useState("");
  const [consent, setConsent] = React.useState(false);
  const [isConfirmOpen, setIsConfirmOpen] = React.useState(false);
  const [isPublishing, setIsPublishing] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const runDraft = React.useCallback(
    async (keepSource: boolean) => {
      setIsDrafting(true);
      try {
        const result = await draftPost(share);
        setAttributes(result.attributes);
        setAttributesSignature(result.attributesSignature);
        setTitle(result.attributes.title);
        if (!keepSource) {
          setPlatform(result.attributes.sourcePlatform ?? "");
          setAccount(result.attributes.sourceAccount ?? "");
        }
      } catch (draftError) {
        setError(draftError instanceof Error ? draftError.message : "Judul gagal dibuat.");
      } finally {
        setIsDrafting(false);
      }
    },
    [share]
  );

  React.useEffect(() => {
    void runDraft(false);
  }, [runDraft]);

  // Images still in this browser session from the chat fill their slot by hash.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const found: Record<string, { file: File; previewUrl: string }> = {};
      for (const item of files) {
        const file = await dataUrlToFile(item);
        found[await sha256Hex(await file.arrayBuffer())] = { file, previewUrl: item.url };
      }
      if (cancelled) return;
      setSlots((current) =>
        current.map((slot) => (found[slot.sha256] && !slot.file ? { ...slot, ...found[slot.sha256] } : slot))
      );
    })();
    return () => {
      cancelled = true;
    };
  }, [files]);

  const keptLines = payload.materialLines.filter((_, index) => !removedLines.has(index));
  const keptSlots = slots.filter((slot) => slot.file && slot.kept);
  const missingSlots = slots.filter((slot) => !slot.file);
  const personalLinesLeft = keptLines.filter(looksLikePersonalData).length;
  const canContinue = consent && title.trim().length > 0 && keptLines.length > 0 && !!attributes && !isDrafting;

  const toggleLine = (index: number) => {
    setRemovedLines((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  // Only a byte-identical copy of an analyzed image is accepted; the server checks the same hash.
  const handleReupload = async (file: File | undefined) => {
    if (!file) return;
    const hash = await sha256Hex(await file.arrayBuffer());
    const slot = slots.find((item) => item.sha256 === hash);
    if (!slot) {
      setReuploadMessage({ text: `"${file.name}" bukan file yang ditelaah. Unggah file yang sama persis dengan yang kamu kirim di chat.`, ok: false });
      return;
    }
    setSlots((current) =>
      current.map((item) => (item.sha256 === hash ? { ...item, file, previewUrl: URL.createObjectURL(file), kept: true } : item))
    );
    setReuploadMessage({ text: `"${file.name}" cocok dengan lampiran yang ditelaah.`, ok: true });
  };

  const handlePublish = async () => {
    if (!attributes) return;
    setIsPublishing(true);
    setError(null);
    try {
      const form = new FormData();
      form.append("share", JSON.stringify(share));
      form.append("attributes", JSON.stringify(attributes));
      form.append("attributesSignature", attributesSignature);
      form.append(
        "edits",
        JSON.stringify({ title: title.trim(), story: story.trim(), materialLines: keptLines, links, sourcePlatform: platform, sourceAccount: account })
      );
      keptSlots.forEach((slot) => slot.file && form.append("files", slot.file, slot.file.name));

      const post = await publishPost(form);
      clearShareDraft();
      router.push(`/telaah-bersama/${post.id}?baru=1`);
    } catch (publishError) {
      setError(publishError instanceof Error ? publishError.message : "Post gagal diterbitkan.");
      setIsConfirmOpen(false);
    } finally {
      setIsPublishing(false);
    }
  };

  return (
    <PageShell>
      <main className="mx-auto w-full max-w-3xl px-4 py-6 sm:px-6">
        <button
          type="button"
          onClick={() => router.back()}
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          Kembali ke percakapan
        </button>

        <h1 className="mt-4 text-2xl font-semibold text-foreground">Buat post di TelaahBareng</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Bagikan hasil telaahmu supaya orang lain yang menerima lowongan serupa bisa waspada.
        </p>

        <div className="mt-5 flex gap-3 rounded-xl border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
          <div>
            <p className="font-semibold">Periksa data pribadi sebelum memposting</p>
            <p className="mt-1 text-amber-900/85">
              Post ini akan terlihat publik. Hapus baris atau lampiran yang memuat nama, nomor HP, alamat, atau data pribadimu.
              NIK dan kode OTP disensor otomatis, tetapi nama dan foto tidak.
            </p>
          </div>
        </div>

        <div className="mt-6 space-y-7">
          {/* Locked verdict */}
          <section className="rounded-xl border border-border bg-card p-4 shadow-sm">
            <div className="flex items-start justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <RiskLevelBadge level={payload.riskLevel} />
                {attributes && <ModusBadge modus={attributes.modus} />}
              </div>
              <span className="inline-flex shrink-0 items-center gap-1 text-xs text-muted-foreground">
                <Lock className="h-3.5 w-3.5" />
                Dari hasil telaah, tidak bisa diubah
              </span>
            </div>
            <p className="mt-3 text-sm font-medium leading-relaxed text-foreground">{payload.claim}</p>
            {payload.evidence.length > 0 && (
              <details className="group mt-3">
                <summary className="cursor-pointer text-xs font-medium text-primary">
                  Lihat {payload.evidence.length} bukti yang ikut terbit
                </summary>
                <div className="mt-2 space-y-2">
                  {payload.evidence.map((item, index) => (
                    <RiskCard key={index} type={item.type} description={item.description} evidence={item.evidence} />
                  ))}
                </div>
              </details>
            )}
          </section>

          {/* Title */}
          <section>
            <FieldLabel
              htmlFor="title"
              hint={
                <span className="inline-flex items-center gap-1">
                  <Sparkles className="h-3 w-3 text-primary" />
                  Dibuat AI dari materi, bisa diedit
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
                placeholder={isDrafting ? "Membuat judul…" : ""}
                onChange={(event) => setTitle(event.target.value)}
              />
              <Button
                type="button"
                variant="outline"
                size="icon"
                onClick={() => void runDraft(true)}
                disabled={isDrafting}
                title="Buat ulang judul"
              >
                <RefreshCw className={isDrafting ? "animate-spin" : undefined} />
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
                <option value="">Pilih platform</option>
                {SOURCE_PLATFORMS.map((item) => (
                  <option key={item}>{item}</option>
                ))}
              </select>
              <Input
                aria-label="Akun atau link asal"
                value={account}
                maxLength={255}
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
              {payload.materialLines.map((line, index) => {
                const isRemoved = removedLines.has(index);
                const isPersonal = looksLikePersonalData(line);
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
                      <p className={cn("break-words leading-relaxed", isRemoved ? "text-muted-foreground line-through" : "text-foreground")}>
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
          {slots.length > 0 && (
            <section>
              <FieldLabel hint="Gambar yang ditelaah, bisa dihapus">Lampiran</FieldLabel>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                {slots.map((slot) =>
                  slot.file && slot.previewUrl ? (
                    <div key={slot.sha256} className={cn("relative", !slot.kept && "opacity-40")}>
                      <div className="flex aspect-[3/4] w-full flex-col overflow-hidden rounded-lg border border-border bg-muted">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={slot.previewUrl} alt={slot.label} className="min-h-0 flex-1 object-cover" />
                        <span className="flex items-center gap-1.5 border-t border-border bg-white/80 px-2.5 py-1.5 text-[11px] text-muted-foreground">
                          <ImageIcon className="h-3 w-3 shrink-0" />
                          <span className="truncate">{slot.label}</span>
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() =>
                          setSlots((current) => current.map((item) => (item.sha256 === slot.sha256 ? { ...item, kept: !item.kept } : item)))
                        }
                        aria-label={slot.kept ? `Hapus ${slot.label}` : `Pulihkan ${slot.label}`}
                        className="absolute right-1.5 top-1.5 rounded-full bg-black/60 p-1 text-white transition-colors hover:bg-black/80"
                      >
                        {slot.kept ? <X className="h-3.5 w-3.5" /> : <RotateCcw className="h-3.5 w-3.5" />}
                      </button>
                    </div>
                  ) : (
                    <div
                      key={slot.sha256}
                      className="flex aspect-[3/4] w-full flex-col items-center justify-center gap-2 rounded-lg border border-dashed border-border p-3 text-center text-xs text-muted-foreground"
                    >
                      <ImageIcon className="h-5 w-5" />
                      <span>{slot.label}</span>
                      <span>Belum terlampir. Unggah ulang file yang sama untuk ikut diposting.</span>
                    </div>
                  )
                )}
              </div>
              {missingSlots.length > 0 && (
                <>
                  <input
                    ref={reuploadInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    className="hidden"
                    onChange={(event) => {
                      void handleReupload(event.target.files?.[0]);
                      event.currentTarget.value = "";
                    }}
                  />
                  <button
                    type="button"
                    onClick={() => reuploadInputRef.current?.click()}
                    className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-primary hover:underline"
                  >
                    <Upload className="h-3.5 w-3.5" />
                    Unggah ulang file yang sama
                  </button>
                </>
              )}
              {reuploadMessage && (
                <p className={cn("mt-1.5 text-xs", reuploadMessage.ok ? "text-emerald-700" : "text-red-700")}>{reuploadMessage.text}</p>
              )}
            </section>
          )}

          {/* Links */}
          {payload.links.length > 0 && (
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
            <p className={cn("mt-1 text-xs", hasSensitiveData(story) ? "text-red-700" : "text-muted-foreground")}>
              {hasSensitiveData(story)
                ? "Ceritamu tampaknya memuat NIK atau kode OTP. Bagian itu disensor otomatis saat diposting."
                : "Jangan menulis nama lengkap, NIK, alamat, atau nomor pribadimu."}
            </p>
          </section>

          {/* Consent + actions */}
          <section className="space-y-4 border-t border-border pt-5">
            {error && <p className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800">{error}</p>}
            <label className="flex cursor-pointer gap-3 text-sm text-foreground">
              <input
                type="checkbox"
                checked={consent}
                onChange={(event) => setConsent(event.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 accent-[var(--color-primary)]"
              />
              <span>
                Saya sudah memeriksa bahwa post ini tidak memuat data pribadi saya atau orang lain, dan saya paham post ini
                akan terlihat publik.
              </span>
            </label>
            <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
              <Button variant="outline" onClick={() => router.back()}>
                Batal
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
              {keptLines.length} baris materi · {keptSlots.length} lampiran · {links.length} link
              {story.trim() ? " · dengan cerita" : ""}
            </p>
          </div>

          {personalLinesLeft > 0 && (
            <div className="flex gap-2 rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
              <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
              <p>Masih ada {personalLinesLeft} baris yang tampaknya memuat data pribadimu. Yakin tetap diposting?</p>
            </div>
          )}
          {keptSlots.length > 0 && (
            <p className="text-xs text-muted-foreground">
              Periksa juga gambarnya: nama atau foto di dalam gambar tidak bisa disensor otomatis.
            </p>
          )}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={() => setIsConfirmOpen(false)} disabled={isPublishing}>
              Periksa lagi
            </Button>
            <Button onClick={handlePublish} disabled={isPublishing}>
              {isPublishing ? "Memposting…" : "Posting sekarang"}
            </Button>
          </div>
        </div>
      </Modal>
    </PageShell>
  );
}
