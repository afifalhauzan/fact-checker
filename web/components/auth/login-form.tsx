"use client";

import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Key } from "lucide-react";
import { apiKeyLoginSchema, type ApiKeyLoginFormData } from "@/lib/auth-schemas";

interface LoginFormProps {
  onSubmit: (data: ApiKeyLoginFormData) => Promise<void>;
  isLoading: boolean;
  showAlert?: { type: 'error' | 'success'; message: string } | null;
}

export function LoginForm({ onSubmit, isLoading, showAlert }: LoginFormProps) {
  const [showApiKey, setShowApiKey] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ApiKeyLoginFormData>({
    resolver: zodResolver(apiKeyLoginSchema),
  });

  const toggleApiKeyVisibility = () => {
    setShowApiKey(!showApiKey);
  };

  return (
    <>
      {/* Alert Messages */}
      {showAlert?.type === 'error' && (
        <div className="mb-3 p-3 bg-destructive/10 border border-destructive/20 text-destructive text-xs rounded-lg animate-in fade-in zoom-in duration-200">
          {showAlert.message}
        </div>
      )}

      {/* Title & Subtitle */}
      <h1 className="text-2xl font-extrabold text-foreground mb-1">Masuk</h1>
      <p className="text-muted-foreground mb-6 text-sm font-medium">Masukkan API Key Anda untuk melanjutkan</p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {/* API Key Input */}
        <div className="relative">
          <span className="absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-50 pointer-events-none">
            <Key size={18} />
          </span>
          <input
            type={showApiKey ? 'text' : 'password'}
            placeholder="API Key"
            autoComplete="off"
            {...register("apiKey")}
            className={`w-full pl-11 pr-11 py-2.5 rounded-xl border bg-muted focus:bg-background focus:ring-2 focus:ring-ring focus:border-transparent outline-none transition-all placeholder:text-muted-foreground text-sm font-medium ${errors.apiKey ? 'border-destructive focus:ring-destructive/20' : 'border-border'
              }`}
          />
          <button
            type="button"
            onClick={toggleApiKeyVisibility}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus-visible:outline-none"
          >
            {showApiKey ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>

        {/* Error Message */}
        {errors.apiKey && (
          <p className="text-destructive text-xs font-medium">{errors.apiKey.message}</p>
        )}

        <div>
          <p className="text-muted-foreground text-sm font-bold">Key (Sample):</p>
          <p className="text-muted-foreground text-sm font-medium">jalin-super-secret-key-123</p>

        </div>

        {/* Login Button */}
        <button
          type="submit"
          disabled={isLoading}
          className="w-full text-sm font-bold bg-primary hover:bg-primary/90 text-primary-foreground rounded-xl py-2.5 mt-4 shadow-md transition-all active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? 'Memproses...' : 'Masuk'}
        </button>
      </form>

      {/* Divider */}
      <div className="my-6 flex items-center gap-3">
        <div className="flex-1 h-px bg-border"></div>
        <span className="text-[10px] text-muted-foreground font-bold tracking-widest">ATAU</span>
        <div className="flex-1 h-px bg-border"></div>
      </div>

      {/* Google Auth */}
      <a
        href="/api/auth/google/login"
        className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl border border-border text-sm font-bold hover:bg-accent transition-colors"
      >
        <svg className="h-4 w-4" viewBox="0 0 24 24">
          <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
          <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
          <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
          <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
        </svg>
        Google (belum bisa digunakan)
      </a>
    </>
  );
}
