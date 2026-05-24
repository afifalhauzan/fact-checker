"use client"

import { Suspense, useState } from "react"
import { Bot, CheckCircle2 } from "lucide-react"
import { useRouter } from "next/navigation"
import { LoginForm } from "@/components/auth/login-form"
import { type EmailPasswordLoginFormData } from "@/lib/auth-schemas"

function LoginPageContent() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)

  const handleLogin = async (_data: EmailPasswordLoginFormData) => {
    setIsLoading(true)
    router.push("/chat")
  }

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-muted p-4">
      <div
        className="absolute inset-0 z-0 opacity-40"
        style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }}
      />

      <div className="relative z-10 flex w-full max-w-4xl flex-row overflow-hidden rounded-[1.5rem] border border-border bg-card shadow-2xl">
        <div className="relative flex w-full flex-col justify-center p-10 md:w-1/2">
          <div className="flex items-center gap-3">
            <div className="rounded-lg bg-primary p-1.5 text-primary-foreground shadow-sm">
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <span className="text-lg font-bold tracking-tight text-foreground">
              FactChecker <span className="text-primary">AI</span>
            </span>
          </div>

          <div className="mt-12 md:mt-8">
            <LoginForm onSubmit={handleLogin} isLoading={isLoading} />
          </div>
        </div>

        <div className="hidden w-1/2 flex-col items-center justify-center space-y-10 overflow-hidden bg-gradient-to-br from-primary/90 to-primary p-8 md:flex">
          <div className="relative z-10 mb-6 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 p-8 shadow-xl backdrop-blur-md transition-transform duration-500 hover:scale-105">
            <div className="rounded-full border border-primary-foreground/10 bg-primary-foreground/20 p-4">
              <Bot className="h-12 w-12 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </div>

          <div className="relative z-10 space-y-2 text-center">
            <h2 className="text-2xl font-extrabold tracking-tight text-primary-foreground">FactChecker AI</h2>
            <p className="mx-auto max-w-[90%] text-sm font-medium leading-relaxed text-primary-foreground/80">
              Telusuri klaim, cek konteks, dan pahami sumber dengan alur chat yang ringan.
            </p>
          </div>

          <div className="relative z-10 mt-auto flex w-full justify-center pb-2">
            <div className="flex items-center gap-3 rounded-xl border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-3 shadow-lg backdrop-blur-md">
              <CheckCircle2 className="h-4 w-4 text-primary-foreground" />
              <span className="text-xs font-semibold text-primary-foreground/95">
                FactChecker AI <span className="font-normal text-primary-foreground/70">| Ready for mock flow</span>
              </span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-muted" />}>
      <LoginPageContent />
    </Suspense>
  )
}
