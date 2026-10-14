"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Eye, EyeOff, Lock, Mail, User, type LucideIcon } from "lucide-react";
import { registerSchema, type RegisterFormData } from "@/lib/auth-schemas";

interface RegisterFormProps {
  onSubmit: (data: RegisterFormData) => Promise<void>;
  isLoading: boolean;
  showAlert?: { type: "error" | "success"; message: string } | null;
}

const FIELDS: Array<{
  name: keyof RegisterFormData;
  placeholder: string;
  type: "text" | "email" | "password";
  autoComplete: string;
  icon: LucideIcon;
}> = [
  { name: "name", placeholder: "Nama lengkap", type: "text", autoComplete: "name", icon: User },
  { name: "email", placeholder: "Email", type: "email", autoComplete: "email", icon: Mail },
  { name: "password", placeholder: "Password", type: "password", autoComplete: "new-password", icon: Lock },
  {
    name: "passwordConfirmation",
    placeholder: "Ulangi password",
    type: "password",
    autoComplete: "new-password",
    icon: Lock,
  },
];

export function RegisterForm({ onSubmit, isLoading, showAlert }: RegisterFormProps) {
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      passwordConfirmation: "",
    },
  });

  return (
    <>
      {showAlert?.type === "error" && (
        <div className="mb-3 rounded-lg border border-destructive/20 bg-destructive/10 p-3 text-xs text-destructive animate-in fade-in zoom-in duration-200">
          {showAlert.message}
        </div>
      )}

      <h1 className="mb-1 text-2xl font-extrabold text-foreground">Daftar ke TelaahKarier</h1>
      <p className="mb-6 text-sm font-medium text-muted-foreground">
        Buat akun supaya riwayat telaah kamu tersimpan.
      </p>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-3">
        {FIELDS.map(({ name, placeholder, type, autoComplete, icon: Icon }) => {
          const isPassword = type === "password";

          return (
            <div key={name}>
              <div className="relative">
                <span className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-[15px] opacity-50">
                  <Icon size={18} />
                </span>
                <input
                  type={isPassword && showPassword ? "text" : type}
                  placeholder={placeholder}
                  autoComplete={autoComplete}
                  {...register(name)}
                  className={`w-full rounded-xl border bg-muted py-2.5 pl-11 text-sm font-medium placeholder:text-muted-foreground outline-none transition-all focus:border-transparent focus:bg-background focus:ring-2 focus:ring-ring ${
                    isPassword ? "pr-11" : "pr-4"
                  } ${errors[name] ? "border-destructive focus:ring-destructive/20" : "border-border"}`}
                />
                {name === "password" && (
                  <button
                    type="button"
                    onClick={() => setShowPassword((prev) => !prev)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
                    aria-label={showPassword ? "Sembunyikan password" : "Tampilkan password"}
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                )}
              </div>
              {errors[name] && (
                <p className="mt-1 text-xs font-medium text-destructive">{errors[name]?.message}</p>
              )}
            </div>
          );
        })}

        <button
          type="submit"
          disabled={isLoading}
          className="mt-4 w-full rounded-xl bg-primary py-2.5 text-sm font-bold text-primary-foreground shadow-md transition-all hover:bg-primary/90 active:scale-[0.98] disabled:opacity-50"
        >
          {isLoading ? "Memproses..." : "Daftar"}
        </button>
      </form>
    </>
  );
}
