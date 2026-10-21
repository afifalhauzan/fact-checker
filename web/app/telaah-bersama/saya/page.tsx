"use client";

import React from "react";
import Link from "next/link";
import { Pencil, Trash2 } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { PrototypeBanner } from "@/components/telaah-bersama/prototype-banner";
import { TelaahCard } from "@/components/telaah-bersama/telaah-card";
import { EditPostModal } from "@/components/telaah-bersama/edit-post-modal";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { CURRENT_USER, type TelaahPost } from "@/lib/telaah-bersama/mock-data";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";

export default function PostSayaPage() {
  const allPosts = useTelaahBersamaStore((state) => state.posts);
  const isGuest = useTelaahBersamaStore((state) => state.viewer === "tamu");
  const requireLogin = useTelaahBersamaStore((state) => state.requireLogin);
  const removePost = useTelaahBersamaStore((state) => state.removePost);
  const [editing, setEditing] = React.useState<TelaahPost | null>(null);
  const [deleting, setDeleting] = React.useState<TelaahPost | null>(null);
  const myPosts = allPosts.filter((post) => post.author === CURRENT_USER);

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />
      <PrototypeBanner />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">Post saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Telaah yang kamu bagikan di TelaahBareng. Kamu bisa menyunting atau menghapusnya kapan saja.
        </p>

        {isGuest ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Masuk untuk melihat post yang pernah kamu bagikan.</p>
            <Button className="mt-4" onClick={() => requireLogin("Masuk untuk melihat post saya.")}>
              Masuk
            </Button>
          </div>
        ) : myPosts.length === 0 ? (
          <div className="mt-6 rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-sm text-muted-foreground">
              Belum ada post. Hasil telaah berisiko Sedang atau Tinggi bisa kamu bagikan lewat tombol Buat post di TelaahLoker.
            </p>
            <Button className="mt-4" asChild>
              <Link href="/chat">Buka TelaahLoker</Link>
            </Button>
          </div>
        ) : (
          <ul className="mt-6 space-y-4">
            {myPosts.map((post) => (
              <li key={post.id} className="space-y-2">
                <TelaahCard post={post} />
                <div className="flex justify-end gap-1">
                  <Button variant="ghost" size="sm" onClick={() => setEditing(post)} className="text-muted-foreground">
                    <Pencil />
                    Sunting
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => setDeleting(post)} className="text-muted-foreground">
                    <Trash2 />
                    Hapus
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </main>

      {editing && <EditPostModal post={editing} isOpen onClose={() => setEditing(null)} />}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={() => deleting && removePost(deleting.id)}
        title="Hapus Telaah ini?"
        description="Telaah beserta diskusinya akan hilang dari TelaahBareng. Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
    </div>
  );
}
