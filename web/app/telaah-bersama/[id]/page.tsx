"use client";

import React from "react";
import Link from "next/link";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import {
  ArrowLeft,
  Check,
  CheckCircle2,
  Copy,
  Flag,
  Link2,
  Pencil,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { RiskCard } from "@/components/cards/RiskCard";
import { ModusBadge, RiskLevelBadge, SeedBadge } from "@/components/telaah-bersama/badges";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { ReactionButton } from "@/components/telaah-bersama/reaction-button";
import { Discussion } from "@/components/telaah-bersama/discussion";
import { ReportModal } from "@/components/telaah-bersama/report-modal";
import { MockAttachment } from "@/components/telaah-bersama/mock-attachment";
import {
  CONTACT_LABELS,
  CURRENT_USER,
  formatDate,
  formatPeriod,
  formatRelative,
  type TelaahContact,
} from "@/lib/telaah-bersama/mock-data";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";
import { EditPostModal } from "@/components/telaah-bersama/edit-post-modal";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="space-y-2">
      <h2 className="text-sm font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function ContactRow({ contact }: { contact: TelaahContact }) {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(contact.value);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // Clipboard can be blocked; the value is still visible to copy by hand.
    }
  };

  return (
    <li className="flex items-start justify-between gap-2 py-2">
      <div className="min-w-0">
        <p className="text-[11px] text-muted-foreground">{CONTACT_LABELS[contact.kind]}</p>
        <p className="break-words text-sm font-medium text-foreground">{contact.value}</p>
      </div>
      <button
        type="button"
        onClick={handleCopy}
        aria-label={`Salin ${CONTACT_LABELS[contact.kind]}`}
        className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
      >
        {copied ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
      </button>
    </li>
  );
}

function NewPostBanner() {
  const searchParams = useSearchParams();
  if (searchParams.get("baru") !== "1") return null;

  return (
    <div className="flex gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-900">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
      <div>
        <p className="font-medium">Telaahmu sudah terbit. Terima kasih sudah membantu orang lain waspada.</p>
        <p className="mt-1 text-emerald-900/80">Kamu bisa menyunting atau menghapus Telaah ini kapan saja.</p>
      </div>
    </div>
  );
}

export default function TelaahDetailPage() {
  const params = useParams<{ id: string }>();
  const postId = Number(params.id);
  const post = useTelaahBersamaStore((state) => state.posts.find((item) => item.id === postId));
  const hasReported = useTelaahBersamaStore((state) => !!state.reported[postId]);
  const removePost = useTelaahBersamaStore((state) => state.removePost);
  const isGuest = useTelaahBersamaStore((state) => state.viewer === "tamu");
  const requireLogin = useTelaahBersamaStore((state) => state.requireLogin);
  const router = useRouter();
  const [isReportOpen, setIsReportOpen] = React.useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = React.useState(false);
  const [isEditOpen, setIsEditOpen] = React.useState(false);

  if (!post) {
    return (
      <div className="min-h-screen bg-background">
        <ProtectedTopNavbar />
        <main className="mx-auto max-w-3xl px-4 py-16 text-center">
          <p className="text-sm text-muted-foreground">Telaah tidak ditemukan.</p>
          <Link href="/telaah-bersama" className="mt-4 inline-block text-sm font-medium text-primary hover:underline">
            Kembali ke TelaahBareng
          </Link>
        </main>
      </div>
    );
  }

  const isOwner = !isGuest && post.author === CURRENT_USER;
  const period = formatPeriod(post.openDate, post.closeDate);
  const details = [
    { label: "Perusahaan / instansi", value: post.company },
    { label: "Posisi", value: post.position },
    { label: "Lokasi", value: post.location },
    { label: "Gaji", value: post.salary },
    { label: "Periode pendaftaran", value: period },
    { label: "Sumber lowongan", value: [post.source.platform, post.source.account].filter(Boolean).join(" · ") },
  ].filter((item) => item.value);

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <main className="mx-auto w-full max-w-6xl px-4 py-6 sm:px-6">
        <Link
          href="/telaah-bersama"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
        >
          <ArrowLeft className="h-4 w-4" />
          TelaahBareng
        </Link>

        <div className="mt-4 grid grid-cols-1 gap-8 lg:grid-cols-[minmax(0,1fr)_320px]">
          <article className="min-w-0 space-y-6">
            <React.Suspense fallback={null}>
              <NewPostBanner />
            </React.Suspense>

            <header className="space-y-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <RiskLevelBadge level={post.riskLevel} />
                <ModusBadge modus={post.modus} />
                {post.isSeed && <SeedBadge />}
                {post.spamReports > 0 && (
                  <span className="inline-flex rounded-full border border-border bg-muted px-2.5 py-0.5 text-xs text-muted-foreground">
                    Dilaporkan sebagai spam ({post.spamReports})
                  </span>
                )}
              </div>
              <h1 className="text-xl font-semibold leading-snug text-foreground sm:text-2xl">
                <span className="text-muted-foreground">Telaah #{post.id} · </span>
                {post.title}
              </h1>
              <p className="text-xs text-muted-foreground">
                Dibagikan oleh <span className="text-foreground">{post.author}</span> · {formatRelative(post.createdAt)} ·
                ditelaah {post.matchCount}× di TelaahKarier
              </p>
            </header>

            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <p className="text-[11px] font-medium uppercase tracking-[0.08em] text-muted-foreground">
                Tingkat risiko · dinilai pada {formatDate(post.analyzedAt)}
              </p>
              <p className="mt-1 text-base font-semibold leading-relaxed text-foreground">{post.claim}</p>
              <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-muted-foreground">
                <ShieldAlert className="h-3.5 w-3.5" />
                Ini penilaian awal, bukan vonis. Cocokkan dengan kanal resmi perusahaan.
              </p>

              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-4">
                <ReactionButton postId={post.id} />
                {isOwner ? (
                  <>
                    <Button variant="ghost" size="sm" onClick={() => setIsEditOpen(true)} className="text-muted-foreground">
                      <Pencil />
                      Sunting
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setIsDeleteOpen(true)} className="text-muted-foreground">
                      <Trash2 />
                      Hapus
                    </Button>
                  </>
                ) : (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (requireLogin("Masuk untuk melaporkan Telaah ini.")) setIsReportOpen(true);
                    }}
                    disabled={hasReported}
                    className="text-muted-foreground"
                  >
                    <Flag />
                    {hasReported ? "Sudah dilaporkan" : "Laporkan"}
                  </Button>
                )}
              </div>
            </div>

            <Section title="Ringkasan">
              <p className="text-sm leading-relaxed text-foreground">{post.summary}</p>
            </Section>

            <Section title="Bukti dari telaah">
              <div className="space-y-2">
                {post.evidence.map((item, index) => (
                  <RiskCard key={index} type={item.type} description={item.description} evidence={item.evidence} />
                ))}
              </div>
            </Section>

            <Section title="Materi lowongan">
              <div className="space-y-1 rounded-xl border border-border bg-muted/40 p-4 text-sm leading-relaxed text-foreground">
                {post.materialLines.map((line, index) => (
                  <p key={index}>{line}</p>
                ))}
              </div>
            </Section>

            {post.story && (
              <Section title={`Cerita ${post.author}`}>
                <p className="rounded-xl border-l-2 border-primary/40 bg-card py-1 pl-4 text-sm italic leading-relaxed text-foreground">
                  {post.story}
                </p>
              </Section>
            )}

            {post.attachments.length > 0 && (
              <Section title="Lampiran">
                <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
                  {post.attachments.map((attachment) => (
                    <MockAttachment
                      key={attachment.id}
                      label={attachment.label}
                      variant={attachment.variant}
                      url={attachment.url}
                    />
                  ))}
                </div>
              </Section>
            )}

            {post.links.length > 0 && (
              <Section title="Link di materi">
                <ul className="space-y-1.5">
                  {post.links.map((link) => (
                    <li key={link} className="flex items-center gap-2 text-sm text-foreground">
                      <Link2 className="h-3.5 w-3.5 shrink-0 text-muted-foreground" />
                      <span className="break-all">{link}</span>
                    </li>
                  ))}
                </ul>
                <p className="text-xs text-muted-foreground">
                  Link ditampilkan sebagai teks dan tidak bisa diklik. Jangan membuka atau mengisi data di link ini.
                </p>
              </Section>
            )}

            <div className="border-t border-border pt-6">
              <Discussion postId={post.id} comments={post.comments} />
            </div>
          </article>

          <aside className="space-y-4 lg:sticky lg:top-20 lg:self-start">
            <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
              <h2 className="text-sm font-semibold text-foreground">Info lowongan</h2>
              <dl className="mt-2 divide-y divide-border">
                {details.map((item) => (
                  <div key={item.label} className="py-2">
                    <dt className="text-[11px] text-muted-foreground">{item.label}</dt>
                    <dd className="text-sm text-foreground">{item.value}</dd>
                  </div>
                ))}
              </dl>
            </div>

            {post.contacts.length > 0 && (
              <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
                <h2 className="text-sm font-semibold text-foreground">Kontak di lowongan</h2>
                <p className="mt-1 text-xs text-muted-foreground">
                  Cocokkan dengan nomor atau rekening yang menghubungimu.
                </p>
                <ul className="mt-1 divide-y divide-border">
                  {post.contacts.map((contact) => (
                    <ContactRow key={`${contact.kind}-${contact.value}`} contact={contact} />
                  ))}
                </ul>
              </div>
            )}

            <Link
              href="/chat"
              className="block rounded-xl border border-primary/30 bg-primary/5 p-4 text-sm transition-colors hover:bg-primary/10"
            >
              <span className="font-semibold text-foreground">Lowonganmu sedikit berbeda?</span>
              <span className="mt-1 block text-muted-foreground">Telaah sendiri di chat untuk penilaian yang sesuai materimu.</span>
            </Link>
          </aside>
        </div>
      </main>

      <ReportModal postId={post.id} isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <EditPostModal post={post} isOpen={isEditOpen} onClose={() => setIsEditOpen(false)} />
      <ConfirmModal
        isOpen={isDeleteOpen}
        onClose={() => setIsDeleteOpen(false)}
        onConfirm={() => {
          router.push("/telaah-bersama");
          removePost(post.id);
        }}
        title="Hapus Telaah ini?"
        description="Telaah beserta diskusinya akan hilang dari TelaahBareng. Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
    </div>
  );
}
