"use client";

import React from "react";
import toast from "react-hot-toast";
import { HandHelping } from "lucide-react";
import { cn } from "@/utils/utils";
import { toggleReaction } from "@/lib/telaah-bersama/api";
import type { TelaahPost } from "@/lib/telaah-bersama/types";
import { useLoginPrompt } from "./login-prompt";

export function ReactionButton({
  post,
  isSignedIn,
  onChange,
}: {
  post: TelaahPost;
  isSignedIn: boolean;
  onChange: (state: { reacted: boolean; reactionCount: number }) => void;
}) {
  const openLoginPrompt = useLoginPrompt((state) => state.open);
  const [isSaving, setIsSaving] = React.useState(false);
  const isReacted = post.viewer.reacted;

  const handleClick = async () => {
    if (!isSignedIn) {
      openLoginPrompt("Masuk untuk menandai bahwa kamu juga menerima lowongan ini.");
      return;
    }
    setIsSaving(true);
    try {
      onChange(await toggleReaction(post.id));
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Gagal menyimpan reaksi.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={isSaving}
      aria-pressed={isReacted}
      className={cn(
        "inline-flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors disabled:opacity-70",
        isReacted
          ? "border-primary bg-primary text-primary-foreground hover:bg-primary/90"
          : "border-primary/40 bg-background text-foreground hover:bg-primary/10"
      )}
    >
      <HandHelping className="h-4 w-4" />
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
