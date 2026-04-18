"use client";

import React from "react";
import { Sparkles } from "lucide-react";

interface Suggestion {
  id: number;
  text: string;
}

const SUGGESTIONS: Suggestion[] = [
  {
    id: 1,
    text: "Grafik Tren Transaksi"
  },
  {
    id: 2,
    text: "Analisis Tren Karyawan"
  },
  {
    id: 3,
    text: "Penjualan 1 Tahun Terakhir"
  }
];

interface ChatStartProps {
  onSuggestionClick: (suggestion: string) => void;
  isLoading: boolean;
}

export function ChatStart({ onSuggestionClick, isLoading }: ChatStartProps) {
  return (
    <div className="flex flex-col items-center justify-center my-auto px-4">
      {/* Welcome Avatar/Icon */}
      <div className="mb-6 p-4 rounded-full bg-primary/10 text-primary">
        <Sparkles size={40} className="animate-pulse" />
      </div>

      {/* Welcome Message */}
      <div className="flex flex-col items-center gap-4 mb-8 w-full max-w-2xl">
        <div className="flex gap-2 items-end justify-center">
          <div className="max-w-full md:max-w-[90%] rounded-2xl rounded-bl-sm backdrop-blur-sm p-4 text-base leading-relaxed text-secondary-foreground shadow-sm">
            <span className="font-semibold text-primary">Halo! Saya METABOT.</span> Ada yang bisa saya bantu hari ini dalam menganalisis data?
          </div>
        </div>
      </div>

      {/* Suggestions */}
      <div className="flex flex-wrap justify-center gap-2 mb-4 max-w-md">
        {SUGGESTIONS.map((suggestion) => (
          <button
            key={suggestion.id}
            onClick={() => onSuggestionClick(suggestion.text)}
            disabled={isLoading}
            className="rounded-full border border-border bg-secondary px-4 py-2 text-sm font-medium text-secondary-foreground transition-all hover:bg-accent hover:text-accent-foreground hover:-translate-y-0.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {suggestion.text}
          </button>
        ))}
      </div>
    </div>
  );
}
