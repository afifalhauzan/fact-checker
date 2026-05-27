"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail } from "lucide-react";
import {
  emailPasswordLoginSchema,
  type EmailPasswordLoginFormData,
} from "@/lib/auth-schemas";

interface LoginFormProps {
  onSubmit: (data: EmailPasswordLoginFormData) => Promise<void>;
  isLoading: boolean;
  showAlert?: { type: "error" | "success"; message: string } | null;
}

export function LoginForm({ onSubmit, isLoading, showAlert }: LoginFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<EmailPasswordLoginFormData>({
    resolver: zodResolver(emailPasswordLoginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  return (
    <>
      {showAlert?.type === "error" && (
        <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in zoom-in duration-200">
          {showAlert.message}
        </div>
      )}

      <h1 className="mb-1 text-2xl font-extrabold text-foreground">Masuk ke RiskCheck Loker</h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        Gunakan email dan password untuk melanjutkan ke chat.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-50">
            <Mail size={18} />
          </span>
          <input
            type="email"
            placeholder="Email"
            autoComplete="email"
            {...register("email")}
            className={`w-full rounded-xl border bg-muted py-2.5 pl-11 pr-4 text-sm font-medium placeholder:text-muted-foreground outline-none transition-all focus:border-transparent focus:bg-background focus:ring-2 focus:ring-ring ${
              errors.email ? "border-destructive focus:ring-destructive/20" : "border-border"
            }`}
          />
        </div>
        {errors.email && <p className="text-xs font-medium text-destructive">{errors.email.message}</p>}

        <div className="relative">
          <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-50">
            <Lock size={18} />
          </span>
          <input
            type={showPassword ? "text" : "password"}
            placeholder="Password"
            autoComplete="current-password"
            {...register("password")}
            className={`w-full rounded-xl border bg-muted py-2.5 pl-11 pr-11 text-sm font-medium placeholder:text-muted-foreground outline-none transition-all focus:border-transparent focus:bg-background focus:ring-2 focus:ring-ring ${
              errors.password ? "border-destructive focus:ring-destructive/20" : "border-border"
            }`}
          />
          <button
            type="button"
            onClick={() => setShowPassword((prev) => !prev)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
            aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
          >
            {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
          </button>
        </div>
        {errors.password && <p className="text-xs font-medium text-destructive">{errors.password.message}</p>}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? "Memproses..." : "Masuk ke Chat"}
        </button>
      </form>
    </>
  );
}
