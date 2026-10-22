"use client";

import React from "react";
import toast from "react-hot-toast";
import { ThumbsDown, ThumbsUp } from "lucide-react";
import { cn } from "@/utils/utils";

type Rating = "baik" | "buruk";

const REASONS = ["Penilaian risiko keliru", "Kurang lengkap", "Sulit dipahami", "Tidak menjawab pertanyaan"];

async function saveRating(conversationId: string, messageId: string, rating: Rating | null, reason?: string): Promise<boolean> {
  const response = await fetch(
    `/api/chat/session/${encodeURIComponent(conversationId)}/messages/${encodeURIComponent(messageId)}/feedback`,
    { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ rating, reason }) }
  ).catch(() => null);
  return !!response?.ok;
}

const ICON_BUTTON =
  "rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

/**
 * "Was this answer good?" under an assistant answer. Ratings are stored with the message, so they
 * can be read next to the answer when evaluating TelaahKarier. Signed-in sessions only.
 */
export function MessageFeedback({
  conversationId,
  messageId,
  initialRating,
}: {
  conversationId: string;
  messageId: string;
  initialRating: Rating | null;
}) {
  const [rating, setRating] = React.useState<Rating | null>(initialRating);
  const [isAskingReason, setIsAskingReason] = React.useState(false);
  const [reason, setReason] = React.useState("");

  const submit = async (next: Rating | null, nextReason?: string) => {
    const previous = rating;
    setRating(next);
    const saved = await saveRating(conversationId, messageId, next, nextReason);
    if (!saved) {
      setRating(previous);
      toast.error("Penilaian belum tersimpan. Coba lagi sebentar lagi.");
      return false;
    }
    return true;
  };

  const handleUp = () => {
    setIsAskingReason(false);
    void submit(rating === "baik" ? null : "baik");
  };

  const handleDown = () => {
    if (rating === "buruk") {
      setIsAskingReason(false);
      void submit(null);
      return;
    }
    // Saved right away; the reason, if given, updates it
    void submit("buruk");
    setIsAskingReason(true);
  };

  const sendReason = async (text: string) => {
    if (await submit("buruk", text)) {
      setIsAskingReason(false);
      setReason("");
      toast.success("Terima kasih, masukanmu membantu kami memperbaiki TelaahKarier.");
    }
  };

  return (
    <div className="mt-1 space-y-2">
      <div className="flex items-center gap-1">
        <span className="mr-1 text-[11px] text-muted-foreground">Jawaban ini membantu?</span>
        <button
          type="button"
          onClick={handleUp}
          aria-pressed={rating === "baik"}
          aria-label="Jawaban ini baik"
          title="Jawaban ini baik"
          className={cn(ICON_BUTTON, rating === "baik" && "text-primary")}
        >
          <ThumbsUp className={cn("h-3.5 w-3.5", rating === "baik" && "fill-primary/20")} />
        </button>
        <button
          type="button"
          onClick={handleDown}
          aria-pressed={rating === "buruk"}
          aria-label="Jawaban ini kurang baik"
          title="Jawaban ini kurang baik"
          className={cn(ICON_BUTTON, rating === "buruk" && "text-destructive")}
        >
          <ThumbsDown className={cn("h-3.5 w-3.5", rating === "buruk" && "fill-destructive/20")} />
        </button>
      </div>

      {isAskingReason && (
        <div className="space-y-2 rounded-lg border border-border bg-card p-3">
          <p className="text-xs font-medium text-foreground">Apa yang kurang? (opsional)</p>
          <div className="flex flex-wrap gap-1.5">
            {REASONS.map((item) => (
              <button
                key={item}
                type="button"
                onClick={() => void sendReason(item)}
                className="rounded-full border border-border px-2.5 py-1 text-xs text-foreground transition-colors hover:border-primary hover:bg-primary/5"
              >
                {item}
              </button>
            ))}
          </div>
          <form
            onSubmit={(event) => {
              event.preventDefault();
              if (reason.trim()) void sendReason(reason.trim());
            }}
            className="flex gap-2"
          >
            <input
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Ceritakan singkat (opsional)"
              className="h-8 min-w-0 flex-1 rounded-md border border-border bg-background px-2.5 text-xs outline-none focus:border-primary"
            />
            <button type="submit" disabled={!reason.trim()} className="rounded-md bg-primary px-3 text-xs font-medium text-primary-foreground disabled:opacity-50">
              Kirim
            </button>
            <button type="button" onClick={() => setIsAskingReason(false)} className="px-1 text-xs text-muted-foreground hover:text-foreground">
              Lewati
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
