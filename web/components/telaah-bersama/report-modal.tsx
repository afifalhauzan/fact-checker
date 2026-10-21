"use client";

import React from "react";
import { CheckCircle2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import type { ReportType } from "@/lib/telaah-bersama/mock-data";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";

const OPTIONS: Array<{ type: ReportType; label: string; description: string; result: string }> = [
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

export function ReportModal({ postId, isOpen, onClose }: { postId: number; isOpen: boolean; onClose: () => void }) {
  const report = useTelaahBersamaStore((state) => state.report);
  const [selected, setSelected] = React.useState<ReportType | null>(null);
  const [submitted, setSubmitted] = React.useState<ReportType | null>(null);

  const handleClose = () => {
    setSelected(null);
    setSubmitted(null);
    onClose();
  };

  const handleSubmit = () => {
    if (!selected) return;
    report(postId, selected);
    setSubmitted(selected);
  };

  const submittedOption = OPTIONS.find((option) => option.type === submitted);

  return (
    <Modal isOpen={isOpen} onClose={handleClose} title="Laporkan Telaah ini" description="Pilih alasan yang paling sesuai.">
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

          <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
            <Button variant="outline" onClick={handleClose}>
              Batal
            </Button>
            <Button onClick={handleSubmit} disabled={!selected}>
              Kirim laporan
            </Button>
          </div>
        </div>
      )}
    </Modal>
  );
}
