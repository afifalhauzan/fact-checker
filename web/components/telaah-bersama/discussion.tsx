"use client";

import React from "react";
import toast from "react-hot-toast";
import { AlertTriangle, Reply, Send, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/ui/modal";
import { cn } from "@/utils/utils";
import { addComment, deleteComment } from "@/lib/telaah-bersama/api";
import { formatRelative, type TelaahComment } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";
import { useLoginPrompt } from "./login-prompt";

const MAX_COMMENT_LENGTH = 1000;

function CommentForm({
  postId,
  parentId,
  viewerName,
  placeholder,
  autoFocus,
  onAdded,
  onCancel,
}: {
  postId: number;
  parentId?: number;
  viewerName: string;
  placeholder: string;
  autoFocus?: boolean;
  onAdded: (comment: TelaahComment) => void;
  onCancel?: () => void;
}) {
  const [draft, setDraft] = React.useState("");
  const [isSending, setIsSending] = React.useState(false);
  const trimmed = draft.trim();
  const hasSensitive = hasSensitiveData(draft);
  const fieldId = parentId ? `reply-${parentId}` : "comment";

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!trimmed || isSending) return;
    setIsSending(true);
    try {
      onAdded(await addComment(postId, trimmed, parentId));
      setDraft("");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Komentar gagal dikirim.");
    } finally {
      setIsSending(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-2 rounded-xl border border-border bg-card p-3">
      <label htmlFor={fieldId} className="text-xs text-muted-foreground">
        {parentId ? "Membalas" : "Berkomentar"} sebagai <span className="font-medium text-foreground">{viewerName}</span>
      </label>
      <Textarea
        id={fieldId}
        value={draft}
        autoFocus={autoFocus}
        maxLength={MAX_COMMENT_LENGTH}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className={cn("resize-y", parentId ? "min-h-16" : "min-h-20")}
      />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className={hasSensitive ? "text-xs text-red-700" : "text-xs text-muted-foreground"}>
          {hasSensitive
            ? "Komentarmu tampaknya memuat NIK atau kode OTP. Bagian itu akan disensor otomatis saat dikirim."
            : "Jangan menulis NIK, OTP, atau data pribadimu."}
        </p>
        <div className="flex gap-2">
          {onCancel && (
            <Button type="button" size="sm" variant="ghost" onClick={onCancel}>
              Batal
            </Button>
          )}
          <Button type="submit" size="sm" disabled={!trimmed || isSending}>
            <Send />
            {isSending ? "Mengirim…" : "Kirim"}
          </Button>
        </div>
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  onReply,
  onDelete,
}: {
  comment: TelaahComment;
  onReply: () => void;
  onDelete: () => void;
}) {
  if (comment.isDeleted) {
    return (
      <div className="rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm italic text-muted-foreground">
        Komentar telah dihapus
      </div>
    );
  }

  return (
    <div className="rounded-lg border border-border bg-card p-3">
      <div className="flex flex-wrap items-center gap-2 text-xs">
        <span className="font-medium text-foreground">{comment.author}</span>
        {comment.isPostAuthor && (
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[11px] font-medium text-primary">Pembuat</span>
        )}
        {comment.isNewAccount && !comment.isPostAuthor && (
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
      <div className="mt-2 flex items-center gap-4">
        <button
          type="button"
          onClick={onReply}
          className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <Reply className="h-3.5 w-3.5" />
          Balas
        </button>
        {comment.isMine && (
          <button
            type="button"
            onClick={onDelete}
            className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-destructive"
          >
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        )}
      </div>
    </div>
  );
}

export function Discussion({
  postId,
  comments,
  viewerName,
  onAdded,
  onDeleted,
}: {
  postId: number;
  comments: TelaahComment[];
  // Pseudonym of the signed-in viewer; null for guests.
  viewerName: string | null;
  onAdded: (comment: TelaahComment) => void;
  // Called with the removed comment and the post's new comment count.
  onDeleted: (comment: TelaahComment, commentCount: number) => void;
}) {
  const openLoginPrompt = useLoginPrompt((state) => state.open);
  const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<TelaahComment | null>(null);

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const { commentCount } = await deleteComment(postId, pendingDelete.id);
      onDeleted(pendingDelete, commentCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Komentar gagal dihapus.");
    }
  };

  // Newest threads first; replies under their thread in the order they were written.
  const threads = comments.filter((comment) => comment.parentId === null).reverse();
  const repliesOf = (threadId: number) => comments.filter((comment) => comment.parentId === threadId);

  const startReply = (threadId: number) => {
    if (!viewerName) {
      openLoginPrompt("Masuk untuk membalas diskusi di Telaah ini.");
      return;
    }
    setReplyingTo(threadId);
  };

  return (
    <section aria-labelledby="diskusi-heading" className="space-y-3">
      <h2 id="diskusi-heading" className="text-base font-semibold text-foreground">
        Diskusi{" "}
        <span className="font-normal text-muted-foreground">
          ({comments.filter((comment) => !comment.isDeleted).length})
        </span>
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
        <CommentForm
          postId={postId}
          viewerName={viewerName}
          placeholder="Ceritakan pengalamanmu: apakah kamu menerima lowongan atau chat yang sama? Apa yang terjadi setelahnya?"
          onAdded={onAdded}
        />
      )}

      {threads.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
          Belum ada diskusi. Jadilah yang pertama bercerita.
        </p>
      ) : (
        <ul className="space-y-3">
          {threads.map((thread) => {
            const replies = repliesOf(thread.id);
            return (
              <li key={thread.id} className="space-y-2">
                <CommentItem comment={thread} onReply={() => startReply(thread.id)} onDelete={() => setPendingDelete(thread)} />
                {(replies.length > 0 || replyingTo === thread.id) && (
                  <div className="ml-4 space-y-2 border-l-2 border-border pl-3 sm:ml-6">
                    {replies.map((reply) => (
                      <CommentItem
                        key={reply.id}
                        comment={reply}
                        onReply={() => startReply(thread.id)}
                        onDelete={() => setPendingDelete(reply)}
                      />
                    ))}
                    {replyingTo === thread.id && viewerName && (
                      <CommentForm
                        postId={postId}
                        parentId={thread.id}
                        viewerName={viewerName}
                        placeholder={thread.author ? `Balas ${thread.author}` : "Tulis balasan"}
                        autoFocus
                        onAdded={(comment) => {
                          onAdded(comment);
                          setReplyingTo(null);
                        }}
                        onCancel={() => setReplyingTo(null)}
                      />
                    )}
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus komentar ini?"
        description={
          pendingDelete?.parentId === null && comments.some((comment) => comment.parentId === pendingDelete?.id)
            ? "Isi dan namamu akan dihapus. Balasan dari orang lain tetap tampil di bawah tulisan \"Komentar telah dihapus\"."
            : "Komentar akan dihapus. Tindakan ini tidak bisa dibatalkan."
        }
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
    </section>
  );
}
