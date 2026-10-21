"use client";

import React from "react";
import Link from "next/link";
import toast from "react-hot-toast";
import { Pencil, Trash2 } from "lucide-react";
import { ProtectedTopNavbar } from "@/components/protected-top-navbar";
import { TelaahCard } from "@/components/telaah-bersama/telaah-card";
import { EditPostModal } from "@/components/telaah-bersama/edit-post-modal";
import { Button } from "@/components/ui/button";
import { ConfirmModal } from "@/components/ui/modal";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import { deletePost, listPosts } from "@/lib/telaah-bersama/api";
import type { TelaahPost } from "@/lib/telaah-bersama/types";

export default function PostSayaPage() {
  const { user, isLoading: isUserLoading } = useCurrentUser();
  const [posts, setPosts] = React.useState<TelaahPost[] | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const [editing, setEditing] = React.useState<TelaahPost | null>(null);
  const [deleting, setDeleting] = React.useState<TelaahPost | null>(null);

  React.useEffect(() => {
    if (!user) return;
    listPosts({ mine: true, sort: "terbaru", limit: 50 })
      .then((result) => setPosts(result.data))
      .catch((loadError) => setError(loadError instanceof Error ? loadError.message : "Post gagal dimuat."));
  }, [user]);

  const handleDelete = async () => {
    if (!deleting) return;
    try {
      await deletePost(deleting.id);
      setPosts((current) => current?.filter((post) => post.id !== deleting.id) ?? null);
      toast.success("Telaah dihapus.");
    } catch (deleteError) {
      toast.error(deleteError instanceof Error ? deleteError.message : "Telaah gagal dihapus.");
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <ProtectedTopNavbar />

      <main className="mx-auto w-full max-w-3xl px-4 py-8 sm:px-6">
        <h1 className="text-2xl font-semibold text-foreground">Post saya</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Telaah yang kamu bagikan di TelaahBareng{user?.pseudonym ? ` sebagai ${user.pseudonym}` : ""}. Kamu bisa
          menyunting atau menghapusnya kapan saja.
        </p>

        {isUserLoading || (user && !posts && !error) ? (
          <p className="mt-6 text-sm text-muted-foreground">Memuat…</p>
        ) : !user ? (
          <div className="mt-6 rounded-xl border border-border bg-card p-6 text-center">
            <p className="text-sm text-muted-foreground">Masuk untuk melihat post yang pernah kamu bagikan.</p>
            <Button className="mt-4" asChild>
              <Link href="/login?from=%2Ftelaah-bersama%2Fsaya">Masuk</Link>
            </Button>
          </div>
        ) : error ? (
          <p className="mt-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-800">{error}</p>
        ) : posts && posts.length === 0 ? (
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
            {posts?.map((post) => (
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

      {editing && (
        <EditPostModal
          post={editing}
          isOpen
          onClose={() => setEditing(null)}
          onSaved={(saved) => setPosts((current) => current?.map((post) => (post.id === saved.id ? saved : post)) ?? null)}
        />
      )}
      <ConfirmModal
        isOpen={!!deleting}
        onClose={() => setDeleting(null)}
        onConfirm={handleDelete}
        title="Hapus Telaah ini?"
        description="Telaah beserta diskusinya akan hilang dari TelaahBareng. Tindakan ini tidak bisa dibatalkan."
        confirmText="Hapus"
        cancelText="Batal"
        isDestructive
      />
    </div>
  );
}
