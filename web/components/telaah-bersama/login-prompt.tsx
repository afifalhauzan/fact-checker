"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { LogIn } from "lucide-react";
import { create } from "zustand";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";

interface LoginPromptState {
  reason: string | null;
  open: (reason: string) => void;
  close: () => void;
}

/** Opened when a guest tries something that needs an account (react, comment, report, post). */
export const useLoginPrompt = create<LoginPromptState>((set) => ({
  reason: null,
  open: (reason) => set({ reason }),
  close: () => set({ reason: null }),
}));

export function LoginPromptHost() {
  const pathname = usePathname();
  const reason = useLoginPrompt((state) => state.reason);
  const close = useLoginPrompt((state) => state.close);
  const from = encodeURIComponent(pathname);

  return (
    <Modal isOpen={!!reason} onClose={close} title="Masuk dulu, ya" description={reason ?? undefined}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Akun dibutuhkan supaya setiap reaksi, diskusi, dan laporan berasal dari orang sungguhan. Namamu tetap tampil
          sebagai nama samaran.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href={`/register?from=${from}`}>Daftar</Link>
          </Button>
          <Button asChild>
            <Link href={`/login?from=${from}`}>
              <LogIn />
              Masuk
            </Link>
          </Button>
        </div>
      </div>
    </Modal>
  );
}
