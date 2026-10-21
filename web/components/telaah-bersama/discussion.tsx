"use client";

import React from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { addComment } from "@/lib/telaah-bersama/api";
import { formatRelative, type TelaahComment } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";
import { useLoginPrompt } from "./login-prompt";

const MAX_COMMENT_LENGTH = 1000;

function CommentItem({ comment }: { comment: TelaahComment }) {
  return (
    <li className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-foreground">{comment.author}</span>
        {comment.isNewAccount && (
          <span className="rounded-full bg-muted px-2 py-0.5 text-[11px] text-muted-foreground">akun baru</span>
        )}
        <span className="text-muted-foreground">{formatRelative(comment.createdAt)}</span>
      </div>
      {comment.flag === "klaim_tanpa_bukti" && (
        <p className="mt-2 inline-flex items-center gap-1.5 rounded-md border border-violet-200 bg-violet-50 px-2 py-1 text-[11px] text-violet-800">
          <AlertTriangle className="h-3 w-3" />
          Klaim tanpa bukti: komentar ini mengarahkan penilaian tanpa menyertakan bukti. Tingkat risiko tidak berubah.
        </p>
      )}
      <p className="mt-2 whitespace-pre-wrap text-sm leading-relaxed text-foreground">{comment.body}</p>
    </li>
  );
}

export function Discussion({
  postId,
  comments,
  viewerName,
  onAdded,
}: {
  postId: number;
  comments: TelaahComment[];
  // Pseudonym of the signed-in viewer; null for guests.
  viewerName: string | null;
  onAdded: (comment: TelaahComment) => void;
}) {
  const openLoginPrompt = useLoginPrompt((state) => state.open);
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const trimmed = draft.trim();
  const hasSensitive = hasSensitiveData(draft);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      onAdded(await addComment(postId, trimmed));
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Komentar gagal dikirim.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <section aria-labelledby="diskusi-heading" className="space-y-3">
      <h2 id="diskusi-heading" className="text-base font-semibold text-foreground">
        Diskusi <span className="font-normal text-muted-foreground">({comments.length})</span>
      </h2>

      {!viewerName ? (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-card p-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-muted-foreground">Menerima lowongan yang sama? Masuk untuk menceritakan pengalamanmu.</p>
          <Button
            size="sm"
            variant="outline"
            className="shrink-0"
            onClick={() => openLoginPrompt("Masuk untuk ikut berdiskusi di Telaah ini.")}
          >
            Masuk untuk berkomentar
          </Button>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-border bg-card p-3">
          <label htmlFor="comment" className="text-xs text-muted-foreground">
            Berkomentar sebagai <span className="font-medium text-foreground">{viewerName}</span>
          </label>
          <Textarea
            id="comment"
            value={draft}
            maxLength={MAX_COMMENT_LENGTH}
            onChange={(event) => setDraft(event.target.value)}
            placeholder="Ceritakan pengalamanmu: apakah kamu menerima lowongan atau chat yang sama? Apa yang terjadi setelahnya?"
            className="min-h-20 resize-y"
          />
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className={hasSensitive ? "text-xs text-red-700" : "text-xs text-muted-foreground"}>
              {hasSensitive
                ? "Komentarmu tampaknya memuat NIK atau kode OTP. Bagian itu akan disensor otomatis saat dikirim."
                : "Jangan menulis NIK, OTP, atau data pribadimu."}
            </p>
            <Button type="submit" size="sm" disabled={!trimmed || isSending}>
              <Send />
              {isSending ? "Mengirim…" : "Kirim"}
            </Button>
          </div>
        </form>
      )}

      {comments.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada diskusi. Jadilah yang pertama bercerita.
        </p>
      ) : (
        <ul className="space-y-2">
          {[...comments].reverse().map((comment) => (
            <CommentItem key={comment.id} comment={comment} />
          ))}
        </ul>
      )}
    </section>
  );
}
