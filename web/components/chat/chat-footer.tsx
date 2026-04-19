"use client";

import React from "react";

interface ChatFooterProps {
  input: string;
  setInput: (value: string) => void;
  onSubmit: (event?: { preventDefault?: () => void }) => void;
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export function ChatFooter({
  input,
  setInput,
  onSubmit,
  onSuggestionClick,
  isLoading
}: ChatFooterProps) {
  return (
    <footer className="sticky bottom-0 left-0 right-0 w-full md:relative md:shrink-0 p-4 pt-2 bg-background border-t border-border md:border-t-0">
      <div className="md:border-t md:border-border pt-3">
        <form
          onSubmit={onSubmit}
          className="flex items-center gap-2 rounded-xl border-2 border-input bg-muted p-1.5 pl-3.5 focus-within:border-primary focus-within:ring-2 focus-within:ring-ring/100 transition-all"
        >
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Tanya tentang info apapun..."
            autoComplete="off"
            disabled={isLoading}
            className="flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-gradient-to-br from-primary to-primary/90 text-primary-foreground shadow-sm transition-all hover:scale-105 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
            </svg>
          </button>
        </form>
        <p className="mt-2 text-center text-xs text-muted-foreground">
          AI bisa membantu memahami, tapi bukan selalu benar. Gunakan ini sebagai titik awal, lalu verifikasi sendiri ya.
        </p>
      </div>
    </footer>
  );
}