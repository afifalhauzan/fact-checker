"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { FlaskConical, LogIn } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Button } from "@/components/ui/button";
import { cn } from "@/utils/utils";
import { useTelaahBersamaStore, type Viewer } from "@/lib/telaah-bersama/store";

const VIEWERS: Array<{ id: Viewer; label: string }> = [
  { id: "pengguna", label: "Pengguna" },
  { id: "tamu", label: "Tamu" },
];

/** Shown when a guest tries something that needs an account (react, comment, report, post). */
function LoginPromptHost() {
  const pathname = usePathname();
  const reason = useTelaahBersamaStore((state) => state.loginPrompt);
  const closeLoginPrompt = useTelaahBersamaStore((state) => state.closeLoginPrompt);
  const loginHref = `/login?from=${encodeURIComponent(pathname)}`;

  return (
    <Modal isOpen={!!reason} onClose={closeLoginPrompt} title="Masuk dulu, ya" description={reason ?? undefined}>
      <div className="space-y-4">
        <p className="text-sm leading-relaxed text-muted-foreground">
          Akun dibutuhkan supaya setiap reaksi, diskusi, dan laporan berasal dari orang sungguhan. Namamu tetap tampil
          sebagai nama samaran.
        </p>
        <div className="flex flex-col-reverse gap-2 sm:flex-row sm:justify-end">
          <Button variant="outline" asChild>
            <Link href={`/register?from=${encodeURIComponent(pathname)}`}>Daftar</Link>
          </Button>
          <Button asChild>
            <Link href={loginHref}>
              <LogIn />
              Masuk
            </Link>
          </Button>
        </div>
        <p className="text-[11px] text-violet-700">
          Prototipe: pilih &ldquo;Pengguna&rdquo; di banner ungu untuk kembali ke mode masuk.
        </p>
      </div>
    </Modal>
  );
}

export function PrototypeBanner() {
  const viewer = useTelaahBersamaStore((state) => state.viewer);
  const setViewer = useTelaahBersamaStore((state) => state.setViewer);

  return (
    <>
      <div className="flex flex-wrap items-center justify-center gap-x-3 gap-y-1 border-b border-violet-200 bg-violet-50 px-4 py-1.5 text-center text-xs text-violet-800">
        <span className="inline-flex items-center gap-1.5">
          <FlaskConical className="h-3.5 w-3.5 shrink-0" />
          Prototipe UX Telaah Bersama. Semua data adalah contoh dan tidak tersimpan.
        </span>
        <span className="inline-flex items-center gap-1" role="radiogroup" aria-label="Lihat sebagai">
          <span>Lihat sebagai</span>
          {VIEWERS.map((item) => (
            <button
              key={item.id}
              type="button"
              role="radio"
              aria-checked={viewer === item.id}
              onClick={() => setViewer(item.id)}
              className={cn(
                "rounded-full px-2 py-0.5 transition-colors",
                viewer === item.id ? "bg-violet-700 text-white" : "hover:bg-violet-100"
              )}
            >
              {item.label}
            </button>
          ))}
        </span>
      </div>
      <LoginPromptHost />
    </>
  );
}
