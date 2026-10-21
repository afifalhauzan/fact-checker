"use client";

import { HandHelping } from "lucide-react";
import { cn } from "@/utils/utils";
import { useTelaahBersamaStore } from "@/lib/telaah-bersama/store";

export function ReactionButton({ postId, size = "default" }: { postId: number; size?: "default" | "sm" }) {
  const post = useTelaahBersamaStore((state) => state.posts.find((item) => item.id === postId));
  const isReacted = useTelaahBersamaStore((state) => !!state.reacted[postId]);
  const toggleReaction = useTelaahBersamaStore((state) => state.toggleReaction);
  const requireLogin = useTelaahBersamaStore((state) => state.requireLogin);

  if (!post) return null;

  return (
    <button
      type="button"
      onClick={() => {
        if (requireLogin("Masuk untuk menandai bahwa kamu juga menerima lowongan ini.")) toggleReaction(postId);
      }}
      aria-pressed={isReacted}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border font-medium transition-colors",
        size === "sm" ? "px-3 py-1.5 text-xs" : "px-4 py-2 text-sm",
        isReacted
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-primary/40 bg-background text-foreground hover:bg-primary/10"
      )}
    >
      <HandHelping className={size === "sm" ? "h-3.5 w-3.5" : "h-4 w-4"} />
      <span>{isReacted ? "Kamu juga menerima ini" : "Saya juga menerima ini"}</span>
      <span
        className={cn(
          "rounded-full px-1.5 text-xs tabular-nums",
          isReacted ? "bg-primary-foreground/20" : "bg-primary/10 text-primary"
        )}
      >
        {post.reactionCount}
      </span>
    </button>
  );
}
