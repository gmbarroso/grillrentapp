"use client"

import { useState, useCallback } from "react"
import { getApiBaseUrl, logApiRequest, logApiResponse, handleApiError, fetchWithAuthHandling } from "../../utils/api"

const API_BASE_URL = getApiBaseUrl()

export function useCreateNotice() {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<Error | null>(null)

  const createNotice = useCallback(async (noticeData: { title: string; subtitle: string; content: string }) => {
    setIsLoading(true)
    setError(null)

    try {
      const endpoint = "/notices"
      logApiRequest("POST", `${API_BASE_URL}${endpoint}`, noticeData)

      const response = await fetchWithAuthHandling(`${API_BASE_URL}${endpoint}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(noticeData),
      })

      const data = await response.json()
      logApiResponse(endpoint, response.status, data)

      if (!response.ok) {
        throw new Error(data.message || `Failed to create notice: ${response.status}`)
      }

      setIsLoading(false)
      return { success: true, data }
    } catch (err) {
      console.error("Error in createNotice:", err)
      const apiError = handleApiError(err, "/notices")
      setError(apiError)
      setIsLoading(false)
      return { success: false, error: apiError }
    }
  }, [])

  return { createNotice, isLoading, error }
}
