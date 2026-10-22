"use client";

import React from "react";
import toast from "react-hot-toast";
import { AlertTriangle, ChevronDown, Flag, Reply, Send, ThumbsUp, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmModal } from "@/components/ui/modal";
import { cn } from "@/utils/utils";
import { addComment, deleteComment, toggleCommentLike } from "@/lib/telaah-bersama/api";
import { ReportModal } from "./report-modal";
import { formatRelative, type TelaahComment } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";
import { useLoginPrompt } from "./login-prompt";

const MAX_COMMENT_LENGTH = 1000;
const MAX_INDENT_DEPTH = 4;

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

const ACTION_CLASS = "inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors";

function CommentItem({
  comment,
  onReply,
  onDelete,
  onLike,
  onReport,
}: {
  comment: TelaahComment;
  onReply: () => void;
  onDelete: () => void;
  onLike: () => void;
  onReport: () => void;
}) {
  if (comment.isDeleted || comment.isHidden) {
    return (
      <div className="flex items-center justify-between gap-3 rounded-lg border border-dashed border-border bg-muted/30 p-3 text-sm italic text-muted-foreground">
        {comment.isDeleted ? "Komentar telah dihapus" : "Komentar disembunyikan karena memuat data pribadi"}
        {comment.isMine && (
          <button type="button" onClick={onDelete} className={cn(ACTION_CLASS, "not-italic hover:text-destructive")}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        )}
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
      {comment.spamReports > 0 && (
        <p className="mt-2 text-[11px] text-muted-foreground">Dilaporkan sebagai spam ({comment.spamReports})</p>
      )}
      <div className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-2">
        {comment.isMine ? (
          comment.likeCount > 0 && (
            <span className={ACTION_CLASS}>
              <ThumbsUp className="h-3.5 w-3.5" />
              {comment.likeCount}
            </span>
          )
        ) : (
          <button
            type="button"
            onClick={onLike}
            aria-pressed={comment.viewer.liked}
            aria-label={comment.viewer.liked ? "Batal suka" : "Suka komentar ini"}
            className={cn(ACTION_CLASS, comment.viewer.liked ? "text-primary" : "hover:text-primary")}
          >
            <ThumbsUp className={cn("h-3.5 w-3.5", comment.viewer.liked && "fill-current")} />
            {comment.likeCount > 0 ? comment.likeCount : "Suka"}
          </button>
        )}
        <button type="button" onClick={onReply} className={cn(ACTION_CLASS, "hover:text-primary")}>
          <Reply className="h-3.5 w-3.5" />
          Balas
        </button>
        {comment.isMine && (
          <button type="button" onClick={onDelete} className={cn(ACTION_CLASS, "hover:text-destructive")}>
            <Trash2 className="h-3.5 w-3.5" />
            Hapus
          </button>
        )}
        {!comment.isMine &&
          (comment.viewer.reported ? (
            <span className={ACTION_CLASS}>
              <Flag className="h-3.5 w-3.5" />
              Dilaporkan
            </span>
          ) : (
            <button type="button" onClick={onReport} className={cn(ACTION_CLASS, "hover:text-destructive")}>
              <Flag className="h-3.5 w-3.5" />
              Laporkan
            </button>
          ))}
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
  onChanged,
}: {
  postId: number;
  comments: TelaahComment[];
  // Pseudonym of the signed-in viewer; null for guests.
  viewerName: string | null;
  onAdded: (comment: TelaahComment) => void;
  // Called with the removed comment and the post's new comment count.
  onDeleted: (comment: TelaahComment, commentCount: number) => void;
  // Called with a comment whose likes or report state changed.
  onChanged: (comment: TelaahComment) => void;
}) {
  const openLoginPrompt = useLoginPrompt((state) => state.open);
  const [replyingTo, setReplyingTo] = React.useState<number | null>(null);
  const [pendingDelete, setPendingDelete] = React.useState<TelaahComment | null>(null);
  const [reporting, setReporting] = React.useState<TelaahComment | null>(null);

  const handleLike = async (comment: TelaahComment) => {
    if (!viewerName) {
      openLoginPrompt("Masuk untuk menyukai komentar di Telaah ini.");
      return;
    }
    try {
      const { liked, likeCount } = await toggleCommentLike(postId, comment.id);
      onChanged({ ...comment, likeCount, viewer: { ...comment.viewer, liked } });
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyukai komentar.");
    }
  };

  const handleReport = (comment: TelaahComment) => {
    if (!viewerName) {
      openLoginPrompt("Masuk untuk melaporkan komentar.");
      return;
    }
    setReporting(comment);
  };

  const handleConfirmDelete = async () => {
    if (!pendingDelete) return;
    try {
      const { commentCount } = await deleteComment(postId, pendingDelete.id);
      onDeleted(pendingDelete, commentCount);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Komentar gagal dihapus.");
    }
  };

  // Replies nest to any depth. Top-level comments and their direct replies are always shown;
  // deeper levels start folded and open one level at a time.
  const [expanded, setExpanded] = React.useState<Set<number>>(new Set());
  const childrenOf = React.useMemo(() => {
    const map = new Map<number | null, TelaahComment[]>();
    for (const comment of comments) {
      map.set(comment.parentId, [...(map.get(comment.parentId) ?? []), comment]);
    }
    return map;
  }, [comments]);
  // Newest threads first; replies in the order they were written.
  const threads = [...(childrenOf.get(null) ?? [])].reverse();

  const expand = (id: number) => setExpanded((current) => new Set(current).add(id));

  const startReply = (comment: TelaahComment, depth: number) => {
    if (!viewerName) {
      openLoginPrompt("Masuk untuk membalas diskusi di Telaah ini.");
      return;
    }
    if (depth >= 1) expand(comment.id);
    setReplyingTo(comment.id);
  };

  const renderNode = (comment: TelaahComment, depth: number): React.ReactNode => {
    const children = childrenOf.get(comment.id) ?? [];
    const isOpen = depth === 0 || expanded.has(comment.id);
    const isReplying = replyingTo === comment.id && !!viewerName;

    return (
      <li key={comment.id} className="space-y-2">
        <CommentItem
          comment={comment}
          onReply={() => startReply(comment, depth)}
          onDelete={() => setPendingDelete(comment)}
          onLike={() => handleLike(comment)}
          onReport={() => handleReport(comment)}
        />
        {children.length > 0 && !isOpen && (
          <button
            type="button"
            onClick={() => expand(comment.id)}
            className="ml-4 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline sm:ml-6"
          >
            <ChevronDown className="h-3.5 w-3.5" />
            Lihat {children.length} balasan
          </button>
        )}
        {((isOpen && children.length > 0) || isReplying) && (
          // Indentation stops growing after a few levels so deep threads stay readable on a phone
          <ul className={cn("space-y-2 border-l-2 border-border", depth < MAX_INDENT_DEPTH ? "ml-4 pl-3 sm:ml-6" : "pl-3")}>
            {isOpen && children.map((child) => renderNode(child, depth + 1))}
            {isReplying && viewerName && (
              <li>
                <CommentForm
                  postId={postId}
                  parentId={comment.id}
                  viewerName={viewerName}
                  placeholder={comment.author ? `Balas ${comment.author}` : "Tulis balasan"}
                  autoFocus
                  onAdded={(added) => {
                    onAdded(added);
                    expand(comment.id);
                    setReplyingTo(null);
                  }}
                  onCancel={() => setReplyingTo(null)}
                />
              </li>
            )}
          </ul>
        )}
      </li>
    );
  };

  return (
    <section aria-labelledby="diskusi-heading" className="space-y-3">
      <h2 id="diskusi-heading" className="text-base font-semibold text-foreground">
        Diskusi{" "}
        <span className="font-normal text-muted-foreground">
          ({comments.filter((comment) => !comment.isDeleted && !comment.isHidden).length})
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
        <ul className="space-y-3">{threads.map((thread) => renderNode(thread, 0))}</ul>
      )}

      <ConfirmModal
        isOpen={!!pendingDelete}
        onClose={() => setPendingDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus komentar ini?"
        description={
          comments.some((comment) => comment.parentId === pendingDelete?.id)
            ? "Isi dan namamu akan dihapus. Balasan dari orang lain tetap tampil di bawah tulisan \"Komentar telah dihapus\"."
            : "Komentar akan dihapus. Tindakan ini tidak bisa dibatalkan."
        }
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
      <ReportModal
        postId={postId}
        commentId={reporting?.id ?? 0}
        isOpen={!!reporting}
        onClose={() => setReporting(null)}
        onReported={() => reporting && onChanged({ ...reporting, viewer: { ...reporting.viewer, reported: true } })}
      />
    </section>
  );
}
