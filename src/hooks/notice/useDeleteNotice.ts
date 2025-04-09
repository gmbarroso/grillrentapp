"use client"

import { useState, useCallback } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useDeleteNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const deleteNotice = useCallback(async (noticeId: string) => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = `/notices/${noticeId}`
      logApiRequest("DELETE", `${API_BASE_URL}${endpoint}`)

      const response = await fetch(`${API_BASE_URL}${endpoint}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${localStorage.getItem("token")}`,
          "Content-Type": "application/json",
        },
      })

      const data = await response.json()
      logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || `Failed to delete notice: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in deleteNotice:", err)
      const apiError = handleApiError(err, `/notices/${noticeId}`)
      setError(apiError)
      setIsLoading(false)
      return { success: false, error: apiError }
    }
  }, [])

  return { deleteNotice, isLoading, error }
}
