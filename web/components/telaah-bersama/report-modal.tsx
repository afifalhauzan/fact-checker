"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { reportComment, reportPost } from "@/lib/telaah-bersama/api";
import type { ReportType } from "@/lib/telaah-bersama/types";

type ReportOption = { type: ReportType; label: string; description: string; result: string };

const POST_OPTIONS: ReportOption[] = [
  {
    type: "data_pribadi",
    label: "Ada data pribadi yang bocor",
    description: "Misalnya NIK, nama, atau nomor pribadi seseorang yang bukan bagian dari lowongan.",
    result:
      "Kami memindai ulang Telaah ini secara otomatis. Jika ditemukan data pribadi, Telaah disembunyikan sampai pembuatnya menyuntingnya.",
  },
  {
    type: "spam",
    label: "Spam atau tidak relevan",
    description: "Bukan tentang lowongan kerja, atau iklan.",
    result: "Telaah ini akan diberi label jumlah laporan spam.",
  },
];

const COMMENT_OPTIONS: ReportOption[] = [
  {
    type: "data_pribadi",
    label: "Ada data pribadi yang bocor",
    description: "Misalnya NIK, alamat, atau nomor pribadi seseorang.",
    result: "Kami memindai ulang komentar ini secara otomatis. Jika ditemukan data pribadi, komentar disembunyikan.",
  },
  {
    type: "spam",
    label: "Spam atau tidak relevan",
    description: "Iklan, promosi, atau tidak berkaitan dengan lowongan ini.",
    result: "Komentar ini akan diberi label jumlah laporan spam.",
  },
];

export function ReportModal({
  postId,
  commentId,
  isOpen,
  onClose,
  onReported,
}: {
  postId: number;
  // Set to report one comment instead of the post.
  commentId?: number;
  isOpen: boolean;
  onClose: () => void;
  onReported: () => void;
}) {
  const isComment = commentId !== undefined;
  const OPTIONS = isComment ? COMMENT_OPTIONS : POST_OPTIONS;
  const [selected, setSelected] = React.useState<ReportType | null>(null);
  const [submitted, setSubmitted] = React.useState<ReportType | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [isSending, setIsSending] = React.useState(false);

  const handleClose = () => {
    setSelected(null);
    setSubmitted(null);
    setError(null);
    onClose();
  };

  const handleSubmit = async () => {
    if (!selected) return;
    setIsSending(true);
    setError(null);
    try {
      await (isComment ? reportComment(postId, commentId, selected) : reportPost(postId, selected));
      setSubmitted(selected);
      onReported();
    } catch (reportError) {
      setError(reportError instanceof Error ? reportError.message : "Laporan gagal dikirim.");
    } finally {
      setIsSending(false);
    }
  };

  const submittedOption = OPTIONS.find((option) => option.type === submitted);

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title={isComment ? "Laporkan komentar ini" : "Laporkan Telaah ini"}
      description="Pilih alasan yang paling sesuai."
    >
      {submittedOption ? (
        <div className="space-y-4">
          <div className="flex gap-3 rounded-lg border border-emerald-200 bg-emerald-50 p-3 text-sm text-emerald-900">
            <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
            <div>
              <p className="font-medium">Laporan terkirim.</p>
              <p className="mt-1 text-emerald-900/80">{submittedOption.result}</p>
            </div>
          </div>
          <div className="flex justify-end">
            <Button onClick={handleClose}>Tutup</Button>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <div className="space-y-2" role="radiogroup">
            {OPTIONS.map((option) => (
              <button
                key={option.type}
                type="button"
                role="radio"
                aria-checked={selected === option.type}
                onClick={() => setSelected(option.type)}
                className={cn(
                  "w-full rounded-lg border p-3 text-left transition-colors",
                  selected === option.type ? "border-primary bg-primary/5" : "border-border hover:bg-muted/60"
                )}
              >
                <p className="text-sm font-medium text-foreground">{option.label}</p>
                <p className="mt-0.5 text-xs text-muted-foreground">{option.description}</p>
              </button>
            ))}
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!selected || isSending}>
              {isSending ? "Mengirim…" : "Kirim laporan"}
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
