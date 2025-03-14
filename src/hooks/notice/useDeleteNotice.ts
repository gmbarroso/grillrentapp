"use client"

import { useState, useCallback } from "react"

const API_BASE_URL = process.env.REACT_APP_BFF_URL || "http://localhost:3001"

export function useDeleteNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteNotice = useCallback(async (noticeId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const response = await fetch(`${API_BASE_URL}/notices/${noticeId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.message || `Failed to delete notice: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in deleteNotice:", err)
      setError(err instanceof Error ? err : new Error("An unknown error occurred"))
      setIsLoading(false)
      return { success: false, error: err instanceof Error ? err : new Error("An unknown error occurred") }
    }
  }, [])

  return { deleteNotice, isLoading, error }
}

