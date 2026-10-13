"use client"

import { useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"

type AuthAlert = { type: "error" | "success"; message: string }

/**
 * Posts an auth form (login/register) to its route handler, then sends the user
 * to where they were headed. The session cookie is set by the route handler.
 */
export function useAuthSubmit<T>(endpoint: string, fallbackError: string) {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isLoading, setIsLoading] = useState(false)
  const [alert, setAlert] = useState<AuthAlert | null>(null)

  const submit = async (data: T) => {
    setIsLoading(true)
    setAlert(null)

    try {
      const response = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      })

      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        setAlert({ type: "error", message: body.error || fallbackError })
        setIsLoading(false)
        return
      }

      const from = searchParams.get("from")
      router.push(from?.startsWith("/") && !from.startsWith("//") ? from : "/chat")
      router.refresh()
    } catch {
      setAlert({ type: "error", message: "Tidak dapat terhubung ke server" })
      setIsLoading(false)
    }
  }

  return { submit, isLoading, alert }
}
