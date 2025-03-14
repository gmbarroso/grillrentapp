"use client"

import { useState, useCallback } from "react"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useCreateNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createNotice = useCallback(async (noticeData: { title: string; subtitle: string; content: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/notices`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify(noticeData),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Failed to create notice: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in createNotice:", err)
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      setIsLoading(false)
      return { success: false, error: err instanceof Error ? err : new Error("An unknown error occurred") }
    }
  }, [])

  return { createNotice, isLoading, error }
}

