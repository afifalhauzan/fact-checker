"use client"

import { Suspense, useState, useEffect } from "react"
import { Bot, CheckCircle2 } from "lucide-react"
import { type ApiKeyLoginFormData } from "@/lib/auth-schemas"
import toast, { Toaster } from "react-hot-toast"
import { useRouter } from "next/navigation"
import { useAuthContext } from "@/contexts/AuthContext"
import { LoginForm } from "@/components/auth/login-form"

function LoginPageContent() {
  const router = useRouter()
  const { login, isAuthenticated, isLoading, error, clearError } = useAuthContext()
  const [showAlert, setShowAlert] = useState<{ type: 'error' | 'success', message: string } | null>(null)

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push("/")
    }
  }, [isAuthenticated, router])

  // Show auth context errors
  useEffect(() => {
    if (error) {
      setShowAlert({ type: 'error', message: error })
      setTimeout(() => {
        setShowAlert(null)
        clearError()
      }, 5000)
    }
  }, [error, clearError])

  const handleLogin = async (data: ApiKeyLoginFormData) => {
    try {
      const conversationId = await login(data)
      toast.success('API Key validated! Redirecting...')
      
      // Redirect with conversation_id if available
      if (conversationId) {
        router.push(`/?conversation_id=${conversationId}`)
      } else {
        router.push("/")
      }
    } catch (error) {
      // Error is already handled by AuthContext and shown via useEffect
      console.error('Login error:', error)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted p-4 relative overflow-hidden">
      <Toaster />

      {/* Background Dot Pattern */}
      <div className="absolute inset-0 z-0 opacity-40" style={{ backgroundImage: "radial-gradient(#cbd5e1 1px, transparent 1px)", backgroundSize: "24px 24px" }} />
      
      {/* Main Card */}
      <div className="max-w-4xl w-full bg-card rounded-[1.5rem] shadow-2xl flex flex-row md:flex-row overflow-hidden border border-border relative z-10">
        
        {/* Left Column - Form Area */}
        <div className="p-10 md:p-10 flex flex-col justify-center w-full md:w-1/2 relative">
          
          {/* Header Logo */}
          <div className="flex items-center gap-3">
            <div className="bg-primary p-1.5 rounded-lg text-primary-foreground shadow-sm">
              <Bot size={18} strokeWidth={2.5} />
            </div>
            <span className="font-bold text-foreground text-lg tracking-tight">META<span className="text-primary">BOT</span> AI</span>
          </div>

          <div className="mt-12 md:mt-8">
            <LoginForm 
              onSubmit={handleLogin}
              isLoading={isLoading}
              showAlert={showAlert}
            />
          </div>
        </div>

        {/* Right Column - Visual Gradient */}
        <div className="w-1/2 bg-gradient-to-br from-primary/90 to-primary hidden md:flex flex-col items-center justify-center p-8 space-y-10 relative overflow-hidden">
          <div className="bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 rounded-full p-8 shadow-xl mb-6 relative z-10 transition-transform hover:scale-105 duration-500">
            <div className="bg-primary-foreground/20 rounded-full p-4 border border-primary-foreground/10">
              <Bot className="w-12 h-12 text-primary-foreground" strokeWidth={1.5} />
            </div>
          </div>

          <div className="text-center relative z-10 space-y-2">
            <h2 className="text-primary-foreground font-extrabold text-2xl tracking-tight">
              Analisis Data Cerdas
            </h2>
            <p className="text-primary-foreground/80 text-sm font-medium max-w-[90%] mx-auto leading-relaxed">
              Dapatkan wawasan dari data Anda dengan platform business intelligence bertenaga AI.
            </p>
          </div>

          <div className="mt-auto relative z-10 w-full flex justify-center pb-2">
            <div className="flex items-center gap-3 bg-primary-foreground/10 backdrop-blur-md border border-primary-foreground/20 px-4 py-3 rounded-xl shadow-lg">
              <CheckCircle2 className="w-4 h-4 text-primary-foreground" />
              <span className="text-primary-foreground/95 text-xs font-semibold">
                Standar Perusahaan <span className="text-primary-foreground/70 font-normal">| Dipercaya Tim Nasional</span>
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
