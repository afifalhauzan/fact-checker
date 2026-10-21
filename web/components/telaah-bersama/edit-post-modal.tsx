"use client";

import React from "react";
import { Lock, RotateCcw, Trash2, X } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/utils/utils";
import { updatePost } from "@/lib/telaah-bersama/api";
import { attachmentUrl, hasAccusatoryWord, type TelaahPost } from "@/lib/telaah-bersama/types";
import { hasSensitiveData } from "@/langchain/agents/analyzer/redaction";
import { PostAttachment } from "./post-attachment";

const MAX_TITLE_LENGTH = 120;
const MAX_STORY_LENGTH = 1500;

/** Owner edits (design doc 5.2): title and story are free text; material, attachments, and links can only be removed. */
function EditForm({ post, onClose, onSaved }: { post: TelaahPost; onClose: () => void; onSaved: (post: TelaahPost) => void }) {
  const [title, setTitle] = React.useState(post.title);
  const [story, setStory] = React.useState(post.story ?? "");
  const [removedLines, setRemovedLines] = React.useState<Set<number>>(new Set());
  const [attachmentIds, setAttachmentIds] = React.useState(post.attachments.map((item) => item.id));
  const [links, setLinks] = React.useState(post.links);
  const [error, setError] = React.useState<string | null>(null);
  const [isSaving, setIsSaving] = React.useState(false);

  const keptLines = post.materialLines.filter((_, index) => !removedLines.has(index));
  const canSave = title.trim().length > 0 && keptLines.length > 0 && !isSaving;

  const toggleLine = (index: number) => {
    setRemovedLines((current) => {
      const next = new Set(current);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const handleSave = async () => {
    setIsSaving(true);
    setError(null);
    try {
      onSaved(await updatePost(post.id, { title: title.trim(), story: story.trim(), materialLines: keptLines, links, attachmentIds }));
      onClose();
    } catch (saveError) {
      setError(saveError instanceof Error ? saveError.message : "Perubahan gagal disimpan.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="max-h-[70vh] space-y-5 overflow-y-auto pr-1">
      {post.status === "hidden_pending_edit" && (
        <p className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900">
          Telaah ini disembunyikan karena laporan data pribadi terkonfirmasi. Hapus baris yang memuat NIK atau kode,
          lalu simpan agar Telaah tampil lagi.
        </p>
      )}

      <div className="space-y-1.5">
        <label htmlFor="edit-title" className="text-sm font-semibold text-foreground">
          Judul
        </label>
        <Input id="edit-title" value={title} maxLength={MAX_TITLE_LENGTH} onChange={(event) => setTitle(event.target.value)} />
        {hasAccusatoryWord(title) && (
          <p className="text-xs text-amber-700">Hindari kata yang menuduh. Gunakan informasi netral.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <label htmlFor="edit-story" className="text-sm font-semibold text-foreground">
          Cerita kamu
        </label>
        <Textarea
          id="edit-story"
          value={story}
          maxLength={MAX_STORY_LENGTH}
          onChange={(event) => setStory(event.target.value)}
          className="min-h-20"
        />
        {hasSensitiveData(story) && (
          <p className="text-xs text-red-700">Ceritamu tampaknya memuat NIK atau kode OTP. Bagian itu disensor otomatis saat disimpan.</p>
        )}
      </div>

      <div className="space-y-1.5">
        <p className="flex items-center justify-between gap-2 text-sm font-semibold text-foreground">
          Materi lowongan
          <span className="inline-flex items-center gap-1 text-xs font-normal text-muted-foreground">
            <Lock className="h-3 w-3" />
            Baris hanya bisa dihapus
          </span>
        </p>
        <ul className="divide-y divide-border overflow-hidden rounded-lg border border-border">
          {post.materialLines.map((line, index) => {
            const isRemoved = removedLines.has(index);
            return (
              <li
                key={index}
                className={cn(
                  "flex items-start gap-2 px-3 py-1.5 text-sm",
                  isRemoved && "bg-muted/50",
                  !isRemoved && hasSensitiveData(line) && "bg-amber-50"
                )}
              >
                <p className={cn("flex-1 leading-relaxed", isRemoved && "text-muted-foreground line-through")}>{line}</p>
                <button
                  type="button"
                  onClick={() => toggleLine(index)}
                  aria-label={isRemoved ? "Pulihkan baris" : "Hapus baris"}
                  className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                >
                  {isRemoved ? <RotateCcw className="h-3.5 w-3.5" /> : <Trash2 className="h-3.5 w-3.5" />}
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {post.attachments.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Lampiran</p>
          <div className="grid grid-cols-3 gap-2">
            {post.attachments
              .filter((item) => attachmentIds.includes(item.id))
              .map((attachment) => (
                <div key={attachment.id} className="relative">
                  <PostAttachment url={attachmentUrl(attachment)} label={attachment.label} />
                  <button
                    type="button"
                    onClick={() => setAttachmentIds((ids) => ids.filter((id) => id !== attachment.id))}
                    aria-label={`Hapus ${attachment.label}`}
                    className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white hover:bg-black/80"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
          </div>
        </div>
      )}

      {post.links.length > 0 && (
        <div className="space-y-1.5">
          <p className="text-sm font-semibold text-foreground">Link</p>
          {links.map((link) => (
            <div key={link} className="flex items-center justify-between gap-2 rounded-lg border border-border px-3 py-1.5 text-sm">
              <span className="truncate">{link}</span>
              <button
                type="button"
                onClick={() => setLinks((current) => current.filter((item) => item !== link))}
                aria-label={`Hapus ${link}`}
                className="shrink-0 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      <p className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <Lock className="h-3 w-3" />
        Tingkat risiko dan bukti berasal dari hasil telaah, sehingga tidak bisa disunting.
      </p>
      {error && <p className="text-sm text-red-700">{error}</p>}

      <div className="flex flex-col-reverse gap-2 border-t border-border pt-4 sm:flex-row sm:justify-end">
        <Button variant="outline" onClick={onClose}>
          Batal
        </Button>
        <Button onClick={handleSave} disabled={!canSave}>
          {isSaving ? "Menyimpan…" : "Simpan perubahan"}
        </Button>
      </div>
    </div>
  );
}

export function EditPostModal({
  post,
  isOpen,
  onClose,
  onSaved,
}: {
  post: TelaahPost;
  isOpen: boolean;
  onClose: () => void;
  onSaved: (post: TelaahPost) => void;
}) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Sunting Telaah">
      {/* Remounted on every open so the form starts from the saved post. */}
      {isOpen && <EditForm post={post} onClose={onClose} onSaved={onSaved} />}
    </Modal>
  );
}
