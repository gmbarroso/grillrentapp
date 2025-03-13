"use client"

import { useState, useCallback } from "react"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useLogoutUser() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const logout = useCallback(async (token: string) => {
    if (!token) return { success: true }

    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/users/logout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Failed to logout: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in logout:", err)
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      setIsLoading(false)
      return { success: true, error: err instanceof Error ? err : new Error("An unknown error occurred") }
    }
  }, [])

  return { logout, isLoading, error }
}

