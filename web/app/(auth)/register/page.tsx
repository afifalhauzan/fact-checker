"use client"

import { Suspense } from "react"
import Link from "next/link"
import { AuthShell } from "@/components/auth/auth-shell"
import { RegisterForm } from "@/components/auth/register-form"
import { useAuthSubmit } from "@/hooks/useAuthSubmit"
import { type RegisterFormData } from "@/lib/auth-schemas"

function RegisterPageContent() {
  const { submit, isLoading, alert } = useAuthSubmit<RegisterFormData>("/api/auth/register", "Pendaftaran gagal")

  return (
    <AuthShell>
      <RegisterForm onSubmit={submit} isLoading={isLoading} showAlert={alert} />

      <p className="mt-5 text-center text-sm text-muted-foreground">
        Sudah punya akun?{" "}
        <Link href="/login" className="font-semibold text-primary hover:underline">
          Masuk
        </Link>
      </p>
    </AuthShell>
  )
}

export default function RegisterPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <RegisterPageContent />
    </Suspense>
  )
}
