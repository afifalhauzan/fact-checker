"use client";

import React from "react";
import Link from "next/link";
import { ArrowRightLeft, CheckCircle2, HandHelping, Megaphone, MessageCircle, ScanSearch, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { findSharedPost } from "@/lib/telaah-bersama/api";
import { formatDate } from "@/lib/telaah-bersama/types";
import type { SimilarTelaahPartData, TelaahSharePartData } from "@/types/streaming";
import { RiskLevelBadge } from "./badges";

/**
 * Shown under a Sedang/Tinggi verdict: the only entry point for creating a post (design doc 5.1).
 * Once the analysis has been posted it links to that post instead: one analysis, one post.
 */
export function BuatPostPrompt({ share, onCreate }: { share: TelaahSharePartData; onCreate: () => void }) {
  const [postedId, setPostedId] = React.useState<number | null>(null);

  React.useEffect(() => {
    let cancelled = false;
    findSharedPost(share)
      .then((post) => !cancelled && setPostedId(post?.id ?? null))
      // On failure the button stays; publishing itself still refuses a second post.
      .catch(() => undefined);
    return () => {
      cancelled = true;
    };
  }, [share]);

  if (postedId) {
    return (
      <section className="flex flex-col gap-3 rounded-xl border border-emerald-200 bg-emerald-50 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="flex items-center gap-2 text-sm font-medium text-emerald-900">
          <CheckCircle2 className="h-4 w-4 shrink-0" />
          Hasil telaah ini sudah kamu bagikan ke TelaahBareng.
        </p>
        <Button variant="outline" size="sm" className="shrink-0 bg-background" asChild>
          <Link href={`/telaah-bersama/${postedId}`}>Lihat Telaah #{postedId}</Link>
        </Button>
      </section>
    );
  }

  return (
    <section className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 shadow-sm sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3">
        <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Megaphone className="h-4 w-4" />
        </span>
        <div>
          <p className="text-sm font-semibold text-foreground">Bantu orang lain waspada</p>
          <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">
            Bagikan hasil telaah ini ke TelaahBareng. Kamu bisa memeriksa dan menghapus data pribadi sebelum diposting.
          </p>
        </div>
      </div>
      <Button variant="outline" size="sm" className="shrink-0" onClick={onCreate}>
        Buat post?
      </Button>
    </section>
  );
}

/** Design doc 6.2: the most similar existing post, offered before the pipeline runs. */
export function SimilarTelaahCard({
  data,
  onSelfAnalyze,
  disabled,
}: {
  data: SimilarTelaahPartData;
  onSelfAnalyze: () => void;
  disabled: boolean;
}) {
  const { post } = data;

  return (
    <section className="overflow-hidden rounded-xl border border-primary/30 bg-card shadow-sm">
      <div className="flex items-center gap-2 border-b border-primary/20 bg-primary/5 px-4 py-2.5">
        <ScanSearch className="h-4 w-4 text-primary" />
        <p className="text-sm font-semibold text-foreground">Sudah ditelaah sebelumnya</p>
      </div>

      <div className="space-y-3 p-4">
        <div className="flex flex-wrap items-center gap-2">
          <RiskLevelBadge level={post.riskLevel} />
          <span className="text-xs text-muted-foreground">dinilai pada {formatDate(post.analyzedAt)}</span>
        </div>

        <div>
          <p className="text-sm font-semibold leading-snug text-foreground">
            Telaah #{post.id} · {post.title}
          </p>
          <p className="mt-1 line-clamp-2 text-sm leading-relaxed text-muted-foreground">{post.claim}</p>
        </div>

        {data.reasons.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {data.reasons.map((reason) => (
              <span key={reason} className="rounded-full bg-muted px-2.5 py-0.5 text-[11px] text-foreground">
                {reason}
              </span>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span className="inline-flex items-center gap-1.5">
            <HandHelping className="h-3.5 w-3.5 text-primary" />
            <span className="font-medium text-foreground">{post.reactionCount}</span> orang juga menerima ini
          </span>
          <span className="inline-flex items-center gap-1.5">
            <MessageCircle className="h-3.5 w-3.5" />
            {post.commentCount} diskusi
          </span>
        </div>

        {post.topComment && (
          <p className="border-l-2 border-border pl-3 text-xs italic leading-relaxed text-muted-foreground">
            &ldquo;{post.topComment.body}&rdquo; · {post.topComment.author}
          </p>
        )}

        {data.ownSignals.length > 0 && (
          <div className="rounded-lg border border-red-200 bg-red-50 p-3">
            <p className="flex items-center gap-1.5 text-xs font-semibold text-red-800">
              <ShieldAlert className="h-3.5 w-3.5" />
              Dari pesanmu sendiri
            </p>
            <ul className="mt-1 space-y-0.5 text-xs text-red-900/85">
              {data.ownSignals.map((signal) => (
                <li key={signal}>{signal}</li>
              ))}
            </ul>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2 border-t border-border pt-3">
          <Button size="sm" asChild>
            <Link href={`/telaah-bersama/${post.id}`}>Baca postingan</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={onSelfAnalyze} disabled={disabled}>
            Tetap telaah sendiri
          </Button>
        </div>
        <p className="text-[11px] text-muted-foreground">
          Telaah sendiri tidak memakai hasil Telaah di atas, jadi penilaiannya murni dari materimu.
        </p>
      </div>
    </section>
  );
}

/** Design doc 6.11: the new material looks like another posting than the one this session is about. */
export function SessionMoveCard({
  previousTitle,
  onMove,
  onStay,
  disabled,
}: {
  previousTitle: string;
  onMove: () => void;
  onStay: () => void;
  disabled: boolean;
}) {
  return (
    <section className="rounded-xl border border-amber-300 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-900">
        <ArrowRightLeft className="h-4 w-4" />
        Sepertinya ini lowongan lain
      </p>
      <p className="mt-1.5 text-sm leading-relaxed text-amber-900/85">
        Sesi ini sedang membahas <b>{previousTitle}</b>. Supaya konteksnya tidak tercampur, pindahkan pesanmu ke sesi baru?
      </p>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button size="sm" onClick={onMove} disabled={disabled}>
          Ya, pindahkan ke sesi baru
        </Button>
        <Button size="sm" variant="outline" className="bg-background" onClick={onStay} disabled={disabled}>
          Tidak, ini lowongan yang sama
        </Button>
      </div>
    </section>
  );
}
