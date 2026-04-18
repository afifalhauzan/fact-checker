"use client";

import type { FormEvent } from "react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { usePromoteChart } from "@/hooks/usePromoteChart";

interface PromoteChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void;
}

export function PromoteChartModal({
  isOpen,
  onClose,
  onConfirm,
}: PromoteChartModalProps) {
  const { promote, loading } = usePromoteChart();

  const handleSubmit = async (e?: FormEvent) => {
    e?.preventDefault();

    const promoted = await promote();
    if (!promoted) {
      return;
    }

    onConfirm?.();
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Simpan & Bagikan"
      description="Buat dashboard dari grafik ini dan bagikan ke tim Anda. Dashboard akan menjadi versi mandiri dan tidak terhubung dengan chat."
    >
      <div className="flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2">
        <Button
          variant="outline"
          onClick={onClose}
          disabled={loading}
          className="mt-3 sm:mt-0"
        >
          Batal
        </Button>
        <Button onClick={() => handleSubmit()} disabled={loading}>
          {loading ? "Menyimpan..." : "Simpan & Bagikan"}
        </Button>
      </div>
    </Modal>
  );
}