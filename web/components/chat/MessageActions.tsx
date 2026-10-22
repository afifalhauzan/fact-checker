"use client";

import React from "react";
import toast from "react-hot-toast";
import { Check, Copy, FileDown, Loader2, Share2 } from "lucide-react";
import { ShareModal } from "@/components/chat/ShareModal";
import { buildAnalysisExport, exportFilename, type AnalysisExport, type ExportPart, type SourceFile } from "@/lib/analysis-export/build";
import { toPlainMarkdown } from "@/lib/analysis-export/markdown";
import { copyText } from "@/lib/clipboard";

const BUTTON =
  "inline-flex h-8 items-center gap-1.5 rounded-md border border-border bg-card px-2.5 text-xs text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-wait disabled:opacity-70";

/**
 * Copy, PDF and share under an assistant answer. All three come from one Markdown document
 * (lib/analysis-export), so they say the same thing. Sharing sends the PDF, with no public link.
 */
export function MessageActions({
  parts,
  sourceText,
  sourceFiles,
  userName,
}: {
  parts: ExportPart[];
  /** What the user sent before this answer (the posting, or the question). */
  sourceText?: string;
  sourceFiles?: SourceFile[];
  /** Named in the line that goes with a shared PDF. */
  userName?: string | null;
}) {
  const [isCopied, setIsCopied] = React.useState(false);
  const [isMakingPdf, setIsMakingPdf] = React.useState(false);
  const [shareAnalysis, setShareAnalysis] = React.useState<AnalysisExport | null>(null);

  // Answers that only offer a choice have nothing to export
  const canExport = React.useMemo(() => buildAnalysisExport(parts) !== null, [parts]);
  if (!canExport) return null;

  const build = () => buildAnalysisExport(parts, { sourceText, sourceFiles });

  const handleCopy = async () => {
    const analysis = build();
    if (!analysis) return;

    if (await copyText(toPlainMarkdown(analysis.markdown))) {
      setIsCopied(true);
      setTimeout(() => setIsCopied(false), 2000);
    } else {
      toast.error("Gagal menyalin. Coba lagi ya.");
    }
  };

  const handlePdf = async () => {
    const analysis = build();
    if (!analysis || isMakingPdf) return;

    setIsMakingPdf(true);
    try {
      // The PDF library is large, so it is only fetched when someone asks for a PDF
      const { downloadAnalysisPdf } = await import("@/lib/analysis-export/pdf");
      await downloadAnalysisPdf(analysis, exportFilename(analysis.title));
    } catch (error) {
      console.error("Failed to make PDF:", error);
      toast.error("PDF belum bisa dibuat. Coba lagi sebentar lagi.");
    } finally {
      setIsMakingPdf(false);
    }
  };

  return (
    <div className="mt-2 flex flex-wrap items-center gap-1.5">
      <button type="button" onClick={handleCopy} className={BUTTON} title="Salin hasil dalam format Markdown">
        {isCopied ? (
          <>
            <Check className="h-3.5 w-3.5 text-green-600" />
            <span className="text-green-600">Disalin</span>
          </>
        ) : (
          <>
            <Copy className="h-3.5 w-3.5" />
            Salin
          </>
        )}
      </button>

      {/* <button type="button" onClick={handlePdf} disabled={isMakingPdf} className={BUTTON} title="Unduh hasil sebagai PDF">
        {isMakingPdf ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileDown className="h-3.5 w-3.5" />}
        {isMakingPdf ? "Membuat PDF..." : "PDF"}
      </button> */}

      <button type="button" onClick={() => setShareAnalysis(build())} className={BUTTON} title="Bagikan hasil sebagai PDF">
        <Share2 className="h-3.5 w-3.5" />
        Bagikan
      </button>

      <ShareModal analysis={shareAnalysis} userName={userName} onClose={() => setShareAnalysis(null)} />
    </div>
  );
}
