"use client"

import { useState, useCallback } from "react"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useUpdateNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const updateNotice = useCallback(
    async (noticeId: string, updateData: { title?: string; subtitle?: string; content?: string }) => {
      setIsLoading(true)
      setError(null)

      try {
        const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(updateData),
        })

        const data = await response.json()

        if (!response.ok) {
          throw new Error(data.message || `Failed to update notice: ${response.status}`)
        }

        setIsLoading(false)
        return { success: true, data }
      } catch (err) {
        console.error("Error in updateNotice:", err)
        setError(err instanceof Error ? err : new Error("An unknown error occurred"))
        setIsLoading(false)
        return { success: false, error: err instanceof Error ? err : new Error("An unknown error occurred") }
      }
    },
    [],
  )

  return { updateNotice, isLoading, error }
}

