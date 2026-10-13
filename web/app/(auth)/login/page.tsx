"use client"

import { Suspense } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
import { LoginForm } from "@/components/auth/login-form"
import { useAuthSubmit } from "@/hooks/useAuthSubmit"
import { type EmailPasswordLoginFormData } from "@/lib/auth-schemas"

function LoginPageContent() {
  const { submit, isLoading, alert } = useAuthSubmit<EmailPasswordLoginFormData>("/api/auth/login", "Login gagal")

  return (
    <AuthShell>
      <LoginForm onSubmit={submit} isLoading={isLoading} showAlert={alert} />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Belum punya akun?{" "}
        <Link href="/register" className="font-semibold text-primary hover:underline">
          Daftar
        </Link>
      </p>
    </AuthShell>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <LoginPageContent />
    </Suspense>
  )
}
