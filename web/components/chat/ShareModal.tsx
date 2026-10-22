"use client";

import React from "react";
import toast from "react-hot-toast";
import { Check, Copy, Download, FileText, Loader2, Share2 } from "lucide-react";
import { FaWhatsapp } from "react-icons/fa";
import { Modal } from "@/components/ui/modal";
import { exportFilename, shareMessage, type AnalysisExport } from "@/lib/analysis-export/build";
import { copyText } from "@/lib/clipboard";
import { cn } from "@/utils/utils";

type PdfState = { status: "preparing" } | { status: "ready"; file: File } | { status: "error" };

const SECONDARY_BUTTON =
  "inline-flex h-9 flex-1 items-center justify-center gap-2 rounded-md border border-input bg-background px-3 text-sm font-medium text-foreground shadow-sm transition-colors hover:bg-accent focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function formatSize(bytes: number): string {
  return bytes >= 1024 * 1024 ? `${(bytes / (1024 * 1024)).toFixed(1)} MB` : `${Math.max(1, Math.round(bytes / 1024))} KB`;
}

/**
 * Shares an answer as a PDF with a short line of text, through the device's own share sheet (which
 * is where WhatsApp and Telegram accept files from a web page). The PDF is made when the modal
 * opens, not on the tap: browsers only allow sharing right after a tap, and building a PDF takes
 * longer than that. Where the browser cannot share files, the PDF can be downloaded instead.
 */
export function ShareModal({
  analysis,
  userName,
  onClose,
}: {
  /** The answer to share; null keeps the modal closed. */
  analysis: AnalysisExport | null;
  userName?: string | null;
  onClose: () => void;
}) {
  const [pdf, setPdf] = React.useState<PdfState>({ status: "preparing" });
  const [attempt, setAttempt] = React.useState(0);
  const [isCopied, setIsCopied] = React.useState(false);

  const text = shareMessage(userName);

  React.useEffect(() => {
    if (!analysis) return;

    let cancelled = false;
    setPdf({ status: "preparing" });

    (async () => {
      try {
        // The PDF library is large, so it is only fetched when someone shares
        const { renderAnalysisPdf } = await import("@/lib/analysis-export/pdf");
        const blob = await renderAnalysisPdf(analysis);
        if (!cancelled) setPdf({ status: "ready", file: new File([blob], exportFilename(analysis.title), { type: "application/pdf" }) });
      } catch (error) {
        console.error("Failed to make PDF:", error);
        if (!cancelled) setPdf({ status: "error" });
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [analysis, attempt]);

  const file = pdf.status === "ready" ? pdf.file : null;
  const canShareFile = !!file && typeof navigator !== "undefined" && typeof navigator.canShare === "function" && navigator.canShare({ files: [file] });

  const handleShare = async () => {
    if (!file || !analysis) return;

    try {
      await navigator.share({ files: [file], title: analysis.title, text });
    } catch (error) {
      // Closing the share sheet is not an error
      if (error instanceof DOMException && error.name === "AbortError") return;
      console.error("Share failed:", error);
      toast.error("Menu bagikan tidak bisa dibuka. Unduh PDF-nya lalu kirim lewat aplikasi.");
    }
  };

  const handleDownload = () => {
    if (!file) return;

    const url = URL.createObjectURL(file);
    const link = document.createElement("a");
    link.href = url;
    link.download = file.name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
  };

  const handleCopyText = async () => {
    if (await copyText(text)) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error("Gagal menyalin. Coba lagi ya.");
    }
  };

  return (
    <Modal
      isOpen={!!analysis}
      onClose={onClose}
      title="Bagikan hasil telaah"
      description=""
    >
      <div className="space-y-4">
        <div>
          <p className="mb-1.5 text-[11px] font-medium uppercase tracking-[0.1em] text-muted-foreground">Pesan</p>
          <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-foreground">{text}</p>
        </div>

        <div className="flex items-center gap-3 rounded-lg border border-border px-3 py-2.5">
          <FileText className="h-8 w-8 shrink-0 text-primary" />
          <div className="min-w-0 flex-1">
            {pdf.status === "error" ? (
              <p className="text-sm text-destructive">PDF belum bisa dibuat.</p>
            ) : (
              <p className="truncate text-sm font-medium text-foreground">{file?.name ?? "Menyiapkan PDF..."}</p>
            )}
            <p className="text-xs text-muted-foreground">
              {file ? `PDF · ${formatSize(file.size)}` : pdf.status === "error" ? "Coba lagi sebentar lagi." : "Mohon tunggu sebentar"}
            </p>
          </div>
          {pdf.status === "preparing" && <Loader2 className="h-4 w-4 shrink-0 animate-spin text-muted-foreground" />}
          {pdf.status === "error" && (
            <button type="button" onClick={() => setAttempt((count) => count + 1)} className="shrink-0 text-sm font-medium text-primary hover:underline">
              Coba lagi
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2">
          {canShareFile ? (
            <button
              type="button"
              onClick={handleShare}
              className="inline-flex h-10 w-full items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Share2 className="h-4 w-4" />
              Bagikan PDF Analisis
            </button>
          ) : (
            file && (
              <p className="rounded-lg bg-muted px-3 py-2 text-xs leading-relaxed text-muted-foreground">
                Browser ini belum bisa membagikan file langsung. Unduh PDF-nya, lalu lampirkan di WhatsApp atau Telegram.
              </p>
            )
          )}

          <div className="flex flex-col gap-2 sm:flex-row">
            <button type="button" onClick={handleDownload} disabled={!file} className={cn(SECONDARY_BUTTON, !canShareFile && file && "border-primary/40")}>
              <Download className="h-4 w-4" />
              Unduh PDF Analisis
            </button>
          </div>
        </div>


      </div>
    </Modal>
  );
}
