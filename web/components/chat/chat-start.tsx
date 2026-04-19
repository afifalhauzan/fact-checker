"use client";

import React from "react";
import { Sparkles } from "lucide-react";

// Tipografi/Interface (Jika menggunakan TypeScript)
interface Suggestion {
  id: number;
  text: string;
}

interface ChatStartProps {
  onSuggestionClick: (text: string) => void;
  isLoading: boolean;
}

const SUGGESTIONS = [
  { id: 1, text: "“Makan gula menyebabkan diabetes” — apakah ini benar?" },
  { id: 2, text: "Ringkas dan jelaskan klaim utama dari artikel ini: [paste teks]" },
  { id: 3, text: "Analisis opini ini: apa bias atau asumsi yang digunakan?" },
];

export function ChatStart({ onSuggestionClick, isLoading }: ChatStartProps) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-6 py-12 antialiased">
      
      {/* Container Pesan Utama */}
      <section className="relative flex flex-col items-start w-full max-w-xl mb-12 animate-in fade-in slide-in-from-bottom-4 duration-700">
        
        {/* Chat Bubble Wrapper */}
        <div className="relative">
          <div className="
            relative z-10 
            bg-card text-card-foreground 
            p-5 md:p-6 
            rounded-2xl rounded-bl-none 
            shadow-[0_8px_30px_rgb(0,0,0,0.04)] 
            border border-border/40 
            backdrop-blur-sm
          ">
            <p className="text-md md:text-base leading-relaxed">
              <span className="text-xl font-semibold text-primary block mb-1">
                Halo! 👋
              </span>
              <span className="text-muted-foreground">
                Punya informasi yang bikin ragu atau bingung? 
                Tempel artikel, klaim, atau opini—kita akan pecah dan pahami bersama.
              </span>
            </p>
          </div>

          {/* Ekor Chat Bubble (Tail) */}
          <div className="absolute -left-1 bottom-0 w-4 h-4 bg-card border-l border-b border-border/40 transform rotate-[-15deg] -z-0 rounded-sm shadow-sm" />
        </div>

        {/* Sub-label di bawah bubble */}
        {/* <p className="mt-4 ml-2 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/60">
          Sistem Analisis Berbasis Konteks
        </p> */}
      </section>

      {/* Suggestions Section */}
      {/* <div className="w-full max-w-2xl">
        <div className="flex flex-wrap justify-center gap-2.5">
          {SUGGESTIONS.map((suggestion) => (
            <button
              key={suggestion.id}
              onClick={() => onSuggestionClick(suggestion.text)}
              disabled={isLoading}
              className="
                group relative
                inline-flex items-center text-left
                rounded-2xl border border-border/60 
                bg-muted/30 px-5 py-3 
                text-sm font-medium text-secondary-foreground
                transition-all duration-300
                hover:bg-background hover:border-primary/30 hover:shadow-md hover:-translate-y-1
                active:scale-95
                disabled:opacity-50 disabled:cursor-not-allowed
                max-w-[100%] md:max-w-[45%]
              "
            >
              <span className="line-clamp-2">{suggestion.text}</span>
            </button>
          ))}
        </div>
      </div> */}
    </div>
  );
}