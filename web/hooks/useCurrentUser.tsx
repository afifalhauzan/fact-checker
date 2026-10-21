"use client"

import { useEffect, useState } from "react"

export interface CurrentUser {
  id: number
  name: string
  email: string
  // Public name in TelaahBareng
  pseudonym: string | null
}

/**
 * Loads the signed-in user from /api/me. `user` stays null for guests.
 */
export function useCurrentUser() {
  const [user, setUser] = useState<CurrentUser | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    fetch("/api/me", { cache: "no-store" })
      .then((response) => (response.ok ? response.json() : { user: null }))
      .then((data) => {
        if (!cancelled) setUser(data.user ?? null)
      })
      .catch(() => {
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false)
      })

    return () => {
      cancelled = true
    }
  }, [])

  return { user, isLoading }
}
